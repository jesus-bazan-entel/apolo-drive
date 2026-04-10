# Apolo Drive - File Server

Repositorio web con gestión de archivos, carpetas y usuarios. Desplegable en **Vercel** (frontend) + **Render** (backend) + **Supabase** (base de datos y storage).

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | React + Vite + TypeScript + Tailwind CSS |
| Backend | FastAPI + Python |
| Base de datos | Supabase (PostgreSQL + Storage) |
| Autenticación | Supabase Auth + JWT |

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
cp .env.example .env      # Ajustar si es necesario
npm run dev
```

Abre http://localhost:5173

## Puesta en producción

### Paso 1: Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com) (plan gratuito)
2. Ve a **SQL Editor** y ejecuta el contenido de `supabase/schema.sql`
3. Copia las credenciales desde **Settings > API**:
   - `SUPABASE_URL`
   - `SUPABASE_KEY` (anon/public)
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_JWT_SECRET` (en Settings > API > JWT Settings)

### Paso 2: Crear usuario admin inicial

En el **SQL Editor** de Supabase, después de registrar tu primer usuario vía la API o dashboard de Supabase Auth:

```sql
UPDATE public.profiles SET role = 'admin' WHERE email = 'tu-email@ejemplo.com';
```

O usa el dashboard de Supabase Auth para crear el usuario, y luego actualiza su rol.

### Paso 3: Render (Backend)

1. Conecta tu repo en [render.com](https://render.com)
2. Crea un **Web Service**:
   - **Root directory**: `backend`
   - **Build command**: `pip install -r requirements.txt`
   - **Start command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
3. Agrega las **Environment Variables**:
   - `SUPABASE_URL`
   - `SUPABASE_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_JWT_SECRET`
   - `FRONTEND_URL` = tu URL de Vercel (paso 4)

### Paso 4: Vercel (Frontend)

1. Conecta tu repo en [vercel.com](https://vercel.com)
2. Configura:
   - **Root directory**: `frontend`
   - **Build command**: `npm run build`
   - **Output directory**: `dist`
3. Agrega **Environment Variable**:
   - `VITE_API_URL` = tu URL de Render (ej: `https://apolo-drive-api.onrender.com`)
4. Edita `frontend/vercel.json` y reemplaza `tu-backend.onrender.com` con tu URL real

### Paso 5: CORS

En Render, actualiza la variable `FRONTEND_URL` con tu URL de Vercel.

### Paso 6: Keep-alive (opcional)

Render free tier duerme tras 15 min de inactividad. Configura un cron en [cron-job.org](https://cron-job.org):
- URL: `https://tu-backend.onrender.com/api/health`
- Intervalo: cada 10 minutos

## Estructura del proyecto

```
apolo-drive/
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
└── supabase/
    └── schema.sql         # Tablas, RLS, triggers, storage bucket
```
