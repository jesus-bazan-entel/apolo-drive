-- ============================================
-- Apolo Drive - Schema SQL
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- 1. Tabla de perfiles de usuario
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  full_name text not null default '',
  role text not null default 'user' check (role in ('admin', 'user')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Tabla de carpetas
create table if not exists public.folders (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  parent_id uuid references public.folders(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint unique_folder_name_in_parent unique (name, parent_id)
);

-- 3. Tabla de archivos (metadatos, archivos reales en Supabase Storage)
create table if not exists public.files (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  original_name text not null,
  size bigint not null default 0,
  mime_type text,
  folder_id uuid references public.folders(id) on delete cascade,
  storage_path text not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================
-- Indices
-- ============================================
create index if not exists idx_folders_parent_id on public.folders(parent_id);
create index if not exists idx_files_folder_id on public.files(folder_id);
create index if not exists idx_profiles_role on public.profiles(role);

-- ============================================
-- Triggers updated_at
-- ============================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_profiles_updated
  before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger on_folders_updated
  before update on public.folders
  for each row execute function public.handle_updated_at();

create trigger on_files_updated
  before update on public.files
  for each row execute function public.handle_updated_at();

-- ============================================
-- Trigger: crear perfil automáticamente al registrar usuario
-- ============================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'user')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================
-- Row Level Security (RLS)
-- ============================================

-- Profiles: usuarios autenticados ven todos los perfiles, solo admin modifica
alter table public.profiles enable row level security;

create policy "Authenticated users can view profiles"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Admin can insert profiles"
  on public.profiles for insert
  to authenticated
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admin can update profiles"
  on public.profiles for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admin can delete profiles"
  on public.profiles for delete
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Folders: todos los autenticados pueden ver, crear, eliminar
alter table public.folders enable row level security;

create policy "Authenticated users can view folders"
  on public.folders for select
  to authenticated
  using (true);

create policy "Authenticated users can create folders"
  on public.folders for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update folders"
  on public.folders for update
  to authenticated
  using (true);

create policy "Authenticated users can delete folders"
  on public.folders for delete
  to authenticated
  using (true);

-- Files: todos los autenticados pueden ver, crear, eliminar
alter table public.files enable row level security;

create policy "Authenticated users can view files"
  on public.files for select
  to authenticated
  using (true);

create policy "Authenticated users can create files"
  on public.files for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update files"
  on public.files for update
  to authenticated
  using (true);

create policy "Authenticated users can delete files"
  on public.files for delete
  to authenticated
  using (true);

-- ============================================
-- Storage bucket para archivos
-- ============================================
insert into storage.buckets (id, name, public)
values ('apolo-drive', 'apolo-drive', false)
on conflict (id) do nothing;

-- Políticas de Storage
create policy "Authenticated users can upload files"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'apolo-drive');

create policy "Authenticated users can view files"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'apolo-drive');

create policy "Authenticated users can delete files"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'apolo-drive');
