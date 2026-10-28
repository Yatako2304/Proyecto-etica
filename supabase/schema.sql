-- ExamBank PUCP — esquema de base de datos
-- Ejecutar completo en Supabase → SQL Editor (una sola vez), y luego seed.sql.

-- ─── Tablas ─────────────────────────────────────────────────────────────────

create table public.faculties (
  id serial primary key,
  slug text not null unique,
  name text not null
);

create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text not null unique,
  alias text not null unique check (alias ~ '^[A-Za-z0-9_.-]{3,24}$'),
  created_at timestamptz not null default now()
);

create table public.courses (
  id serial primary key,
  faculty_id int not null references public.faculties on delete restrict,
  code text not null unique check (code ~ '^[A-Z0-9]{3,10}$'),
  name text not null check (char_length(name) between 3 and 120),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  proposed_by uuid references public.profiles on delete set null,
  created_at timestamptz not null default now()
);

create table public.resources (
  id uuid primary key default gen_random_uuid(),
  course_id int not null references public.courses on delete cascade,
  uploader_id uuid not null references public.profiles on delete cascade,
  -- Un solucionario apunta al examen/lab/tarea que resuelve
  parent_id uuid references public.resources on delete set null,
  type text not null check (type in ('examen', 'solucionario', 'apuntes', 'laboratorio', 'tarea')),
  evaluation text check (char_length(evaluation) <= 40),
  term text not null check (term ~ '^[0-9]{4}-[0-2]$'),
  professor text check (char_length(professor) <= 80),
  title text not null check (char_length(title) between 3 and 140),
  description text check (char_length(description) <= 2000),
  file_path text not null unique,
  file_mime text not null check (file_mime in ('application/pdf', 'image/jpeg', 'image/png')),
  file_size int not null check (file_size > 0 and file_size <= 20971520),
  is_anonymous boolean not null default false,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reject_reason text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create index resources_course_status_idx on public.resources (course_id, status);
create index resources_parent_idx on public.resources (parent_id);
create index resources_uploader_idx on public.resources (uploader_id);

create table public.votes (
  resource_id uuid not null references public.resources on delete cascade,
  user_id uuid not null references public.profiles on delete cascade,
  value smallint not null check (value in (-1, 1)),
  created_at timestamptz not null default now(),
  primary key (resource_id, user_id)
);

-- ─── Registro: solo correos @pucp.edu.pe ───────────────────────────────────
-- Se ejecuta incluso si alguien llama a la API de Auth directamente.

create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  new_alias text := coalesce(nullif(new.raw_user_meta_data ->> 'alias', ''),
                             'usuario-' || substr(new.id::text, 1, 8));
begin
  if lower(new.email) not like '%@pucp.edu.pe' then
    raise exception 'Solo se permiten correos @pucp.edu.pe';
  end if;
  insert into public.profiles (id, email, alias) values (new.id, lower(new.email), new_alias);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── Vistas públicas (para usuarios autenticados) ──────────────────────────
-- Las vistas corren con permisos del dueño: exponen solo lo aprobado,
-- ocultan el autor de los anónimos y nunca exponen la ruta del archivo.

create view public.resource_feed as
select
  r.id, r.course_id, r.parent_id, r.type, r.evaluation, r.term, r.professor,
  r.title, r.description, r.file_mime, r.file_size, r.created_at,
  case when r.is_anonymous then null else p.alias end as author_alias,
  coalesce(v.score, 0) as score,
  coalesce(v.upvotes, 0) as upvotes,
  coalesce(v.downvotes, 0) as downvotes
from public.resources r
join public.profiles p on p.id = r.uploader_id
left join (
  select resource_id,
         sum(value)::int as score,
         (count(*) filter (where value = 1))::int as upvotes,
         (count(*) filter (where value = -1))::int as downvotes
  from public.votes
  group by resource_id
) v on v.resource_id = r.id
where r.status = 'approved';

create view public.course_summary as
select
  c.id, c.code, c.name, c.faculty_id,
  f.slug as faculty_slug, f.name as faculty_name,
  (select count(*) from public.resources r
    where r.course_id = c.id and r.status = 'approved')::int as resource_count
from public.courses c
join public.faculties f on f.id = c.faculty_id
where c.status = 'approved';

revoke all on public.resource_feed, public.course_summary from anon, public;
grant select on public.resource_feed, public.course_summary to authenticated;

-- ─── Row Level Security ─────────────────────────────────────────────────────

alter table public.faculties enable row level security;
alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.resources enable row level security;
alter table public.votes enable row level security;

create policy "faculties: leer" on public.faculties
  for select to authenticated using (true);

create policy "profiles: leer el propio" on public.profiles
  for select to authenticated using (id = auth.uid());

create policy "courses: leer aprobados o propuestos por mí" on public.courses
  for select to authenticated using (status = 'approved' or proposed_by = auth.uid());

create policy "courses: proponer" on public.courses
  for insert to authenticated
  with check (proposed_by = auth.uid() and status = 'pending');

-- Los recursos aprobados se leen vía resource_feed; aquí solo los propios.
create policy "resources: leer los propios" on public.resources
  for select to authenticated using (uploader_id = auth.uid());

create policy "resources: subir pendiente en mi carpeta" on public.resources
  for insert to authenticated
  with check (
    uploader_id = auth.uid()
    and status = 'pending'
    and reviewed_at is null
    and reject_reason is null
    and file_path like auth.uid()::text || '/%'
  );

-- Tope de subidas por cuenta, como respaldo de los límites de la app (más estrictos)
-- para quien llame a la API directamente. No aplica al service role (auth.uid() nulo).
create function public.enforce_upload_limits()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  if auth.uid() is null then
    return new;
  end if;
  if (select count(*) from public.resources
      where uploader_id = new.uploader_id and status = 'pending') >= 30 then
    raise exception 'Demasiados aportes en revisión';
  end if;
  if (select count(*) from public.resources
      where uploader_id = new.uploader_id and created_at > now() - interval '1 day') >= 50 then
    raise exception 'Límite diario de subidas alcanzado';
  end if;
  return new;
end;
$$;

create trigger resources_upload_limits
  before insert on public.resources
  for each row execute function public.enforce_upload_limits();

-- Las subconsultas dentro de una política respetan el RLS de la otra tabla, y un
-- usuario solo puede leer sus propios recursos. Por eso la verificación corre
-- con permisos del dueño: si no, solo se podría votar el material propio.
-- Además impide votar el material que uno mismo subió.
create function public.can_vote_resource(resource uuid)
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select exists (
    select 1 from public.resources r
    where r.id = resource and r.status = 'approved' and r.uploader_id <> auth.uid()
  );
$$;

revoke execute on function public.can_vote_resource(uuid) from public, anon;
grant execute on function public.can_vote_resource(uuid) to authenticated;

create policy "votes: leer los propios" on public.votes
  for select to authenticated using (user_id = auth.uid());

create policy "votes: votar recursos aprobados" on public.votes
  for insert to authenticated
  with check (user_id = auth.uid() and public.can_vote_resource(resource_id));

create policy "votes: cambiar mi voto" on public.votes
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and public.can_vote_resource(resource_id));

create policy "votes: quitar mi voto" on public.votes
  for delete to authenticated using (user_id = auth.uid());

-- ─── Storage: bucket privado ───────────────────────────────────────────────
-- Cada usuario sube solo a la carpeta <su uid>/. No hay política de lectura:
-- las descargas se hacen con URLs firmadas generadas en el servidor.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('resources', 'resources', false, 20971520,
        array['application/pdf', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;

create policy "storage: subir a mi carpeta" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'resources' and (storage.foldername(name))[1] = auth.uid()::text);
