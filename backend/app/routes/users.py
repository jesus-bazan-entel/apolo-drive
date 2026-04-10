from fastapi import APIRouter, HTTPException, Depends
from supabase import Client

from app.auth import require_admin, get_supabase
from app.models import CreateUserRequest, UpdateUserRequest
from app.config import get_settings, Settings

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("")
async def list_users(
    admin: dict = Depends(require_admin),
    supabase: Client = Depends(get_supabase),
):
    result = (
        supabase.table("profiles")
        .select("*")
        .order("created_at", desc=True)
        .execute()
    )
    return result.data


@router.post("")
async def create_user(
    body: CreateUserRequest,
    admin: dict = Depends(require_admin),
    settings: Settings = Depends(get_settings),
):
    from supabase import create_client

    # Usar service_role para crear usuarios
    supabase_admin = create_client(
        settings.supabase_url, settings.supabase_service_role_key
    )
    try:
        # Crear usuario en auth
        auth_response = supabase_admin.auth.admin.create_user(
            {
                "email": body.email,
                "password": body.password,
                "email_confirm": True,
                "user_metadata": {
                    "full_name": body.full_name,
                    "role": body.role,
                },
            }
        )
        user_id = auth_response.user.id

        # Verificar que el perfil fue creado por el trigger
        profile = (
            supabase_admin.table("profiles")
            .select("*")
            .eq("id", user_id)
            .single()
            .execute()
        )

        return profile.data
    except Exception as e:
        error_msg = str(e)
        if "already been registered" in error_msg or "already exists" in error_msg:
            raise HTTPException(
                status_code=409, detail="El email ya está registrado"
            )
        raise HTTPException(status_code=400, detail=f"Error al crear usuario: {error_msg}")


@router.put("/{user_id}")
async def update_user(
    user_id: str,
    body: UpdateUserRequest,
    admin: dict = Depends(require_admin),
    supabase: Client = Depends(get_supabase),
):
    update_data = body.model_dump(exclude_none=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No hay datos para actualizar")

    result = (
        supabase.table("profiles")
        .update(update_data)
        .eq("id", user_id)
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    return result.data[0]


@router.delete("/{user_id}")
async def delete_user(
    user_id: str,
    admin: dict = Depends(require_admin),
    settings: Settings = Depends(get_settings),
):
    from supabase import create_client

    if user_id == admin["id"]:
        raise HTTPException(
            status_code=400, detail="No puedes eliminarte a ti mismo"
        )

    supabase_admin = create_client(
        settings.supabase_url, settings.supabase_service_role_key
    )
    try:
        # Eliminar de auth (cascade eliminará el perfil)
        supabase_admin.auth.admin.delete_user(user_id)
        return {"message": "Usuario eliminado"}
    except Exception as e:
        raise HTTPException(
            status_code=400, detail=f"Error al eliminar usuario: {str(e)}"
        )
