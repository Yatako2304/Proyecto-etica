-- ExamBank PUCP — migración 2 (para bases creadas antes de este cambio).
-- Ejecutar una vez en Supabase → SQL Editor, después de fix-votos.sql.
--
-- 1. Impide votar el material propio.
-- 2. Tope de subidas por cuenta (30 pendientes / 50 por día) como respaldo de los
--    límites de la app (10 / 20) para quien llame a la API directamente.

-- ─── 1. Votos: no al material propio ────────────────────────────────────────

create or replace function public.can_vote_resource(resource uuid)
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

drop policy if exists "votes: votar recursos aprobados" on public.votes;
create policy "votes: votar recursos aprobados" on public.votes
  for insert to authenticated
  with check (user_id = auth.uid() and public.can_vote_resource(resource_id));

drop policy if exists "votes: cambiar mi voto" on public.votes;
create policy "votes: cambiar mi voto" on public.votes
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and public.can_vote_resource(resource_id));

-- La función anterior ya no la usa ninguna política.
drop function if exists public.is_approved_resource(uuid);

-- ─── 2. Tope de subidas ─────────────────────────────────────────────────────

create or replace function public.enforce_upload_limits()
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

drop trigger if exists resources_upload_limits on public.resources;
create trigger resources_upload_limits
  before insert on public.resources
  for each row execute function public.enforce_upload_limits();
