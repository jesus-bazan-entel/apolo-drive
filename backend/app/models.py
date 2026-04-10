from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


# --- Auth ---
class LoginRequest(BaseModel):
    email: str
    password: str


# --- Users ---
class CreateUserRequest(BaseModel):
    email: str
    password: str
    full_name: str
    role: str = "user"


class UpdateUserRequest(BaseModel):
    full_name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None


class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    is_active: bool
    created_at: str


# --- Folders ---
class CreateFolderRequest(BaseModel):
    name: str
    parent_id: Optional[str] = None


class FolderResponse(BaseModel):
    id: str
    name: str
    parent_id: Optional[str]
    created_by: Optional[str]
    created_at: str
    updated_at: str


# --- Files ---
class FileResponse(BaseModel):
    id: str
    name: str
    original_name: str
    size: int
    mime_type: Optional[str]
    folder_id: Optional[str]
    storage_path: str
    created_by: Optional[str]
    created_at: str
    updated_at: str
