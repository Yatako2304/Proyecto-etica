-- ExamBank PUCP — corrección de votos para bases ya creadas con una versión
-- anterior de schema.sql. Ejecutar una vez en Supabase → SQL Editor.
--
-- Problema: la política de inserción consultaba public.resources, cuyo RLS solo
-- deja leer los recursos propios, así que votar material de otros fallaba.

create or replace function public.is_approved_resource(resource uuid)
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select exists (select 1 from public.resources r where r.id = resource and r.status = 'approved');
$$;

revoke execute on function public.is_approved_resource(uuid) from public, anon;
grant execute on function public.is_approved_resource(uuid) to authenticated;

drop policy if exists "votes: votar recursos aprobados" on public.votes;
create policy "votes: votar recursos aprobados" on public.votes
  for insert to authenticated
  with check (user_id = auth.uid() and public.is_approved_resource(resource_id));

drop policy if exists "votes: cambiar mi voto" on public.votes;
create policy "votes: cambiar mi voto" on public.votes
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and public.is_approved_resource(resource_id));
