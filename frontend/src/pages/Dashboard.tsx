import { useState, useEffect, useCallback, useRef } from 'react'
import {
  FolderPlus,
  Upload,
  Trash2,
  Download,
  Folder,
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  File as FileIcon,
  ChevronRight,
  Home,
  MoreVertical,
  Search,
  X,
  ArrowLeft,
} from 'lucide-react'
import toast from 'react-hot-toast'
import {
  getFolders,
  getFiles,
  createFolder,
  deleteFolder,
  uploadFile,
  downloadFile,
  deleteFile,
  getBreadcrumb,
} from '@/lib/api'
import type { Folder as FolderType, FileItem, BreadcrumbItem } from '@/types'

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getFileIcon(mimeType: string | null) {
  if (!mimeType) return FileIcon
  if (mimeType.startsWith('image/')) return FileImage
  if (mimeType.startsWith('video/')) return FileVideo
  if (mimeType.startsWith('audio/')) return FileAudio
  if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text'))
    return FileText
  return FileIcon
}

export default function Dashboard() {
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)
  const [folders, setFolders] = useState<FolderType[]>([])
  const [files, setFiles] = useState<FileItem[]>([])
  const [breadcrumb, setBreadcrumb] = useState<BreadcrumbItem[]>([])
  const [loading, setLoading] = useState(false)
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [contextMenu, setContextMenu] = useState<{
    type: 'folder' | 'file'
    id: string
    name: string
    x: number
    y: number
  } | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadContents = useCallback(async () => {
    setLoading(true)
    try {
      const [foldersData, filesData] = await Promise.all([
        getFolders(currentFolderId),
        getFiles(currentFolderId),
      ])
      setFolders(foldersData)
      setFiles(filesData)

      if (currentFolderId) {
        const bc = await getBreadcrumb(currentFolderId)
        setBreadcrumb(bc)
      } else {
        setBreadcrumb([])
      }
    } catch (err: any) {
      toast.error('Error al cargar contenido')
    } finally {
      setLoading(false)
    }
  }, [currentFolderId])

  useEffect(() => {
    loadContents()
  }, [loadContents])

  // Cerrar context menu al hacer clic fuera
  useEffect(() => {
    const handler = () => setContextMenu(null)
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [])

  const handleCreateFolder = async () => {
    const name = newFolderName.trim()
    if (!name) {
      toast.error('Escribe un nombre para la carpeta')
      return
    }
    try {
      await createFolder(name, currentFolderId)
      toast.success('Carpeta creada')
      setNewFolderName('')
      setShowNewFolder(false)
      loadContents()
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Error al crear carpeta'
      toast.error(msg)
    }
  }

  const handleDeleteFolder = async (folderId: string, folderName: string) => {
    if (!confirm(`¿Eliminar la carpeta "${folderName}" y todo su contenido?`)) return
    try {
      await deleteFolder(folderId)
      toast.success('Carpeta eliminada')
      loadContents()
    } catch (err: any) {
      toast.error('Error al eliminar carpeta')
    }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files
    if (!uploadedFiles?.length) return

    setUploading(true)
    let success = 0
    let failed = 0

    for (const file of Array.from(uploadedFiles)) {
      try {
        await uploadFile(file, currentFolderId)
        success++
      } catch {
        failed++
      }
    }

    if (success > 0) toast.success(`${success} archivo(s) subido(s)`)
    if (failed > 0) toast.error(`${failed} archivo(s) fallaron`)

    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
    loadContents()
  }

  const handleDownload = async (fileId: string, fileName: string) => {
    try {
      await downloadFile(fileId, fileName)
    } catch {
      toast.error('Error al descargar archivo')
    }
  }

  const handleDeleteFile = async (fileId: string, fileName: string) => {
    if (!confirm(`¿Eliminar el archivo "${fileName}"?`)) return
    try {
      await deleteFile(fileId)
      toast.success('Archivo eliminado')
      loadContents()
    } catch {
      toast.error('Error al eliminar archivo')
    }
  }

  const openFolder = (folderId: string) => {
    setCurrentFolderId(folderId)
    setSearchQuery('')
  }

  const goToRoot = () => {
    setCurrentFolderId(null)
    setSearchQuery('')
  }

  const goBack = () => {
    if (breadcrumb.length > 1) {
      setCurrentFolderId(breadcrumb[breadcrumb.length - 2].id)
    } else {
      setCurrentFolderId(null)
    }
    setSearchQuery('')
  }

  // Filtrar por búsqueda
  const filteredFolders = folders.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  )
  const filteredFiles = files.filter((f) =>
    f.original_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Archivos</h1>
          {/* Breadcrumb */}
          <div className="flex items-center gap-1 mt-2 text-sm">
            <button
              onClick={goToRoot}
              className="flex items-center gap-1 text-blue-600 hover:text-blue-800 transition"
            >
              <Home className="w-3.5 h-3.5" />
              Inicio
            </button>
            {breadcrumb.map((item) => (
              <span key={item.id} className="flex items-center gap-1">
                <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                <button
                  onClick={() => setCurrentFolderId(item.id)}
                  className="text-blue-600 hover:text-blue-800 transition"
                >
                  {item.name}
                </button>
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {currentFolderId && (
            <button
              onClick={goBack}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Atrás
            </button>
          )}
          <button
            onClick={() => setShowNewFolder(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition"
          >
            <FolderPlus className="w-4 h-4" />
            Nueva carpeta
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {uploading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            Subir archivos
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleUpload}
            className="hidden"
          />
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar carpetas y archivos..."
          className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm transition"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* New Folder Modal */}
      {showNewFolder && (
        <div className="mb-4 bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-3">
          <Folder className="w-5 h-5 text-yellow-500" />
          <input
            type="text"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreateFolder()
              if (e.key === 'Escape') {
                setShowNewFolder(false)
                setNewFolderName('')
              }
            }}
            placeholder="Nombre de la carpeta"
            className="flex-1 px-3 py-1.5 rounded border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            autoFocus
          />
          <button
            onClick={handleCreateFolder}
            className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition"
          >
            Crear
          </button>
          <button
            onClick={() => {
              setShowNewFolder(false)
              setNewFolderName('')
            }}
            className="px-3 py-1.5 text-gray-500 text-sm hover:text-gray-700 transition"
          >
            Cancelar
          </button>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredFolders.length === 0 && filteredFiles.length === 0 ? (
        <div className="text-center py-20">
          <FolderPlus className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">
            {searchQuery ? 'No se encontraron resultados' : 'Esta carpeta está vacía'}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            Crea una carpeta o sube archivos para comenzar
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 text-left">
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                  Tamaño
                </th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider w-44">
                  Modificado
                </th>
                <th className="px-4 py-3 w-12" />
              </tr>
            </thead>
            <tbody>
              {/* Folders */}
              {filteredFolders.map((folder) => (
                <tr
                  key={folder.id}
                  className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer group transition"
                  onDoubleClick={() => openFolder(folder.id)}
                >
                  <td className="px-4 py-3">
                    <button
                      onClick={() => openFolder(folder.id)}
                      className="flex items-center gap-3 text-left"
                    >
                      <Folder className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                      <span className="text-sm text-gray-900 font-medium">{folder.name}</span>
                    </button>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400">&mdash;</td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {formatDate(folder.updated_at)}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setContextMenu({
                          type: 'folder',
                          id: folder.id,
                          name: folder.name,
                          x: e.clientX,
                          y: e.clientY,
                        })
                      }}
                      className="p-1 rounded hover:bg-gray-200 opacity-0 group-hover:opacity-100 transition"
                    >
                      <MoreVertical className="w-4 h-4 text-gray-400" />
                    </button>
                  </td>
                </tr>
              ))}

              {/* Files */}
              {filteredFiles.map((file) => {
                const Icon = getFileIcon(file.mime_type)
                return (
                  <tr
                    key={file.id}
                    className="border-b border-gray-50 hover:bg-gray-50 group transition"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5 text-blue-500 flex-shrink-0" />
                        <span className="text-sm text-gray-900">{file.original_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{formatSize(file.size)}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {formatDate(file.updated_at)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setContextMenu({
                            type: 'file',
                            id: file.id,
                            name: file.original_name,
                            x: e.clientX,
                            y: e.clientY,
                          })
                        }}
                        className="p-1 rounded hover:bg-gray-200 opacity-0 group-hover:opacity-100 transition"
                      >
                        <MoreVertical className="w-4 h-4 text-gray-400" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50 min-w-[160px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          {contextMenu.type === 'file' && (
            <button
              onClick={() => {
                handleDownload(contextMenu.id, contextMenu.name)
                setContextMenu(null)
              }}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
            >
              <Download className="w-4 h-4" />
              Descargar
            </button>
          )}
          <button
            onClick={() => {
              if (contextMenu.type === 'folder') {
                handleDeleteFolder(contextMenu.id, contextMenu.name)
              } else {
                handleDeleteFile(contextMenu.id, contextMenu.name)
              }
              setContextMenu(null)
            }}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
          >
            <Trash2 className="w-4 h-4" />
            Eliminar
          </button>
        </div>
      )}

      {/* Footer stats */}
      <div className="mt-4 text-xs text-gray-400 flex items-center gap-4">
        <span>{folders.length} carpeta(s)</span>
        <span>{files.length} archivo(s)</span>
      </div>
    </div>
  )
}
