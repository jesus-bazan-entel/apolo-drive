# Apolo Drive - File Server

Repositorio web con gestión de archivos, carpetas y usuarios. Desplegable en **Vercel** (frontend + backend serverless) + **Supabase** (base de datos y storage).

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | React + Vite + TypeScript + Tailwind CSS |
| Backend | FastAPI + Python (Vercel Serverless Functions) |
| Base de datos | Supabase (PostgreSQL + Storage) |
| Autenticación | Supabase Auth + JWT |
| Hosting | Vercel (todo en uno) |

## Funcionalidades

- Login de usuarios con credenciales proporcionadas por el administrador
- Panel de administración para crear, activar/desactivar y eliminar usuarios
- Explorador de archivos con navegación por carpetas (breadcrumb)
- Crear carpetas (con subcarpetas ilimitadas)
- Subir archivos (múltiples a la vez)
- Descargar archivos
- Eliminar archivos y carpetas
- Búsqueda en tiempo real
- Roles: `admin` (gestión de usuarios + archivos) y `user` (solo archivos)

## Desarrollo local

### 1. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env      # Editar con tus credenciales de Supabase
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Abre http://localhost:5173 (el proxy de Vite redirige `/api` al backend en puerto 8000)

## Puesta en producción (solo Vercel + Supabase)

### Paso 1: Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com) (plan gratuito)
2. Ve a **SQL Editor** y ejecuta el contenido de `supabase/schema.sql`
3. Copia las credenciales desde **Settings > API**:
   - `SUPABASE_URL`
   - `SUPABASE_KEY` (anon/public)
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_JWT_SECRET` (en Settings > API > JWT Settings)

### Paso 2: Crear usuario admin inicial

En **Supabase Dashboard > Authentication > Users**, crea tu primer usuario. Luego en **SQL Editor**:

```sql
UPDATE public.profiles SET role = 'admin' WHERE email = 'tu-email@ejemplo.com';
```

### Paso 3: Vercel

1. Conecta tu repo en [vercel.com](https://vercel.com)
2. No cambies el root directory (dejar la raíz `/`)
3. Vercel detectará automáticamente el `vercel.json` que:
   - Construye el frontend con `cd frontend && npm install && npm run build`
   - Sirve el frontend desde `frontend/dist`
   - Ejecuta el backend FastAPI como serverless function en `/api`
4. Agrega las **Environment Variables** en Vercel:
   - `SUPABASE_URL`
   - `SUPABASE_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_JWT_SECRET`
   - `FRONTEND_URL` = tu URL de Vercel (ej: `https://apolo-drive.vercel.app`)

### Paso 4: Dominio personalizado (opcional)

En Vercel > Settings > Domains, agrega tu dominio `drive.apolonext.com` y configura el DNS.

## Estructura del proyecto

```
apolo-drive/
├── api/
│   └── index.py           # Entry point: importa FastAPI para Vercel Serverless
├── frontend/              # React + Vite + TypeScript
│   ├── src/
│   │   ├── components/    # Layout, Sidebar
│   │   ├── pages/         # Login, Dashboard, Admin
│   │   ├── hooks/         # useAuth
│   │   ├── lib/           # API client (axios)
│   │   └── types/         # TypeScript interfaces
│   └── ...
├── backend/               # FastAPI + Python
│   ├── app/
│   │   ├── main.py        # FastAPI app + CORS
│   │   ├── auth.py        # JWT verification + middleware
│   │   ├── config.py      # Settings from env
│   │   ├── models.py      # Pydantic models
│   │   └── routes/        # auth, users, folders, files
│   └── ...
├── supabase/
│   └── schema.sql         # Tablas, RLS, triggers, storage bucket
├── vercel.json            # Config de build + routing
└── requirements.txt       # Dependencias Python (Vercel las instala automáticamente)
```
