import uuid
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from typing import Optional
from io import BytesIO
from supabase import Client

from app.auth import get_current_user, get_supabase

router = APIRouter(prefix="/api/files", tags=["files"])


@router.get("")
async def list_files(
    folder_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
):
    query = supabase.table("files").select("*")

    if folder_id:
        query = query.eq("folder_id", folder_id)
    else:
        query = query.is_("folder_id", "null")

    result = query.order("original_name").execute()
    return result.data


@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    folder_id: Optional[str] = Form(None),
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="Nombre de archivo requerido")

    # Verificar la carpeta si se especificó
    if folder_id:
        folder = (
            supabase.table("folders")
            .select("id")
            .eq("id", folder_id)
            .single()
            .execute()
        )
        if not folder.data:
            raise HTTPException(status_code=404, detail="Carpeta no encontrada")

    # Leer contenido del archivo
    content = await file.read()
    file_size = len(content)

    # Generar ruta única en storage
    file_ext = file.filename.rsplit(".", 1)[-1] if "." in file.filename else ""
    unique_name = f"{uuid.uuid4()}.{file_ext}" if file_ext else str(uuid.uuid4())
    storage_path = f"files/{unique_name}"

    # Subir a Supabase Storage
    supabase.storage.from_("apolo-drive").upload(
        path=storage_path,
        file=content,
        file_options={"content-type": file.content_type or "application/octet-stream"},
    )

    # Guardar metadatos en la tabla files
    file_data = {
        "name": unique_name,
        "original_name": file.filename,
        "size": file_size,
        "mime_type": file.content_type,
        "folder_id": folder_id,
        "storage_path": storage_path,
        "created_by": current_user["id"],
    }

    result = supabase.table("files").insert(file_data).execute()
    return result.data[0]


@router.get("/{file_id}/download")
async def download_file(
    file_id: str,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
):
    # Obtener metadatos del archivo
    file_record = (
        supabase.table("files")
        .select("*")
        .eq("id", file_id)
        .single()
        .execute()
    )
    if not file_record.data:
        raise HTTPException(status_code=404, detail="Archivo no encontrado")

    file_data = file_record.data

    # Descargar de Storage
    content = supabase.storage.from_("apolo-drive").download(file_data["storage_path"])

    return StreamingResponse(
        BytesIO(content),
        media_type=file_data.get("mime_type", "application/octet-stream"),
        headers={
            "Content-Disposition": f'attachment; filename="{file_data["original_name"]}"'
        },
    )


@router.delete("/{file_id}")
async def delete_file(
    file_id: str,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
):
    # Obtener metadatos del archivo
    file_record = (
        supabase.table("files")
        .select("*")
        .eq("id", file_id)
        .single()
        .execute()
    )
    if not file_record.data:
        raise HTTPException(status_code=404, detail="Archivo no encontrado")

    # Eliminar de Storage
    supabase.storage.from_("apolo-drive").remove([file_record.data["storage_path"]])

    # Eliminar registro de la base de datos
    supabase.table("files").delete().eq("id", file_id).execute()

    return {"message": "Archivo eliminado"}
