export interface User {
  id: string
  email: string
  full_name: string
  role: 'admin' | 'user'
  is_active: boolean
  created_at: string
}

export interface AuthResponse {
  access_token: string
  refresh_token: string
  user: {
    id: string
    email: string
    full_name: string
    role: 'admin' | 'user'
  }
}

export interface Folder {
  id: string
  name: string
  parent_id: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface FileItem {
  id: string
  name: string
  original_name: string
  size: number
  mime_type: string | null
  folder_id: string | null
  storage_path: string
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface BreadcrumbItem {
  id: string
  name: string
  parent_id: string | null
}
