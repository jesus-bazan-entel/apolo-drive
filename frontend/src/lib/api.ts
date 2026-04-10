import axios from 'axios'
import type { AuthResponse, User, Folder, FileItem, BreadcrumbItem } from '@/types'

const API_URL = import.meta.env.VITE_API_URL || ''

const api = axios.create({
  baseURL: API_URL,
})

// Interceptor para añadir token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Interceptor para manejar 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// --- Auth ---
export const login = async (email: string, password: string): Promise<AuthResponse> => {
  const { data } = await api.post<AuthResponse>('/api/auth/login', { email, password })
  return data
}

// --- Users (Admin) ---
export const getUsers = async (): Promise<User[]> => {
  const { data } = await api.get<User[]>('/api/users')
  return data
}

export const createUser = async (body: {
  email: string
  password: string
  full_name: string
  role: string
}): Promise<User> => {
  const { data } = await api.post<User>('/api/users', body)
  return data
}

export const updateUser = async (
  userId: string,
  body: { full_name?: string; role?: string; is_active?: boolean }
): Promise<User> => {
  const { data } = await api.put<User>(`/api/users/${userId}`, body)
  return data
}

export const deleteUser = async (userId: string): Promise<void> => {
  await api.delete(`/api/users/${userId}`)
}

// --- Folders ---
export const getFolders = async (parentId?: string | null): Promise<Folder[]> => {
  const params = parentId ? { parent_id: parentId } : {}
  const { data } = await api.get<Folder[]>('/api/folders', { params })
  return data
}

export const createFolder = async (name: string, parentId?: string | null): Promise<Folder> => {
  const { data } = await api.post<Folder>('/api/folders', {
    name,
    parent_id: parentId || null,
  })
  return data
}

export const getBreadcrumb = async (folderId: string): Promise<BreadcrumbItem[]> => {
  const { data } = await api.get<BreadcrumbItem[]>(`/api/folders/${folderId}/breadcrumb`)
  return data
}

export const deleteFolder = async (folderId: string): Promise<void> => {
  await api.delete(`/api/folders/${folderId}`)
}

// --- Files ---
export const getFiles = async (folderId?: string | null): Promise<FileItem[]> => {
  const params = folderId ? { folder_id: folderId } : {}
  const { data } = await api.get<FileItem[]>('/api/files', { params })
  return data
}

export const uploadFile = async (file: File, folderId?: string | null): Promise<FileItem> => {
  const formData = new FormData()
  formData.append('file', file)
  if (folderId) {
    formData.append('folder_id', folderId)
  }
  const { data } = await api.post<FileItem>('/api/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export const downloadFile = async (fileId: string, fileName: string): Promise<void> => {
  const response = await api.get(`/api/files/${fileId}/download`, {
    responseType: 'blob',
  })
  const url = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', fileName)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

export const deleteFile = async (fileId: string): Promise<void> => {
  await api.delete(`/api/files/${fileId}`)
}
