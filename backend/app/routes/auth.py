from fastapi import APIRouter, HTTPException, Depends
from supabase import Client

from app.config import get_settings, Settings
from app.models import LoginRequest

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login")
async def login(body: LoginRequest, settings: Settings = Depends(get_settings)):
    from supabase import create_client

    supabase = create_client(settings.supabase_url, settings.supabase_key)
    try:
        response = supabase.auth.sign_in_with_password(
            {"email": body.email, "password": body.password}
        )
        # Obtener perfil del usuario
        profile = (
            supabase.table("profiles")
            .select("*")
            .eq("id", response.user.id)
            .single()
            .execute()
        )

        if profile.data and not profile.data.get("is_active", True):
            raise HTTPException(status_code=403, detail="Usuario desactivado")

        return {
            "access_token": response.session.access_token,
            "refresh_token": response.session.refresh_token,
            "user": {
                "id": response.user.id,
                "email": response.user.email,
                "full_name": profile.data.get("full_name", "") if profile.data else "",
                "role": profile.data.get("role", "user") if profile.data else "user",
            },
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail="Credenciales inválidas")


@router.post("/refresh")
async def refresh_token(refresh_token: str, settings: Settings = Depends(get_settings)):
    from supabase import create_client

    supabase = create_client(settings.supabase_url, settings.supabase_key)
    try:
        response = supabase.auth.refresh_session(refresh_token)
        return {
            "access_token": response.session.access_token,
            "refresh_token": response.session.refresh_token,
        }
    except Exception:
        raise HTTPException(status_code=401, detail="Token de refresco inválido")
