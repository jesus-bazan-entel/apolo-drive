from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
from supabase import Client

from app.auth import get_current_user, get_supabase
from app.models import CreateFolderRequest

router = APIRouter(prefix="/api/folders", tags=["folders"])


@router.get("")
async def list_folders(
    parent_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
):
    query = supabase.table("folders").select("*")

    if parent_id:
        query = query.eq("parent_id", parent_id)
    else:
        query = query.is_("parent_id", "null")

    result = query.order("name").execute()
    return result.data


@router.post("")
async def create_folder(
    body: CreateFolderRequest,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
):
    # Verificar que no exista una carpeta con el mismo nombre en el mismo nivel
    check_query = (
        supabase.table("folders")
        .select("id")
        .eq("name", body.name)
    )
    if body.parent_id:
        check_query = check_query.eq("parent_id", body.parent_id)
    else:
        check_query = check_query.is_("parent_id", "null")

    existing = check_query.execute()
    if existing.data:
        raise HTTPException(
            status_code=409,
            detail="Ya existe una carpeta con ese nombre en esta ubicación",
        )

    data = {
        "name": body.name,
        "parent_id": body.parent_id,
        "created_by": current_user["id"],
    }

    result = supabase.table("folders").insert(data).execute()
    return result.data[0]


@router.get("/{folder_id}")
async def get_folder(
    folder_id: str,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
):
    result = (
        supabase.table("folders")
        .select("*")
        .eq("id", folder_id)
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Carpeta no encontrada")
    return result.data


@router.get("/{folder_id}/breadcrumb")
async def get_breadcrumb(
    folder_id: str,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
):
    """Obtiene la ruta de navegación (breadcrumb) hasta la carpeta actual."""
    breadcrumb = []
    current_id = folder_id

    while current_id:
        result = (
            supabase.table("folders")
            .select("id, name, parent_id")
            .eq("id", current_id)
            .single()
            .execute()
        )
        if not result.data:
            break
        breadcrumb.insert(0, result.data)
        current_id = result.data.get("parent_id")

    return breadcrumb


@router.delete("/{folder_id}")
async def delete_folder(
    folder_id: str,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
):
    # Primero eliminar archivos de storage que están en esta carpeta
    files = (
        supabase.table("files")
        .select("storage_path")
        .eq("folder_id", folder_id)
        .execute()
    )

    if files.data:
        paths = [f["storage_path"] for f in files.data]
        supabase.storage.from_("apolo-drive").remove(paths)

    # Eliminar la carpeta (cascade eliminará registros de files y subcarpetas)
    result = (
        supabase.table("folders")
        .delete()
        .eq("id", folder_id)
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=404, detail="Carpeta no encontrada")

    return {"message": "Carpeta eliminada"}
