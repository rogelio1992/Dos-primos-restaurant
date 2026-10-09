-- Ejecutar una sola vez en el SQL Editor del proyecto Supabase que ya está en uso.
-- Ajustes generales del sitio que se cambian desde /admin. Es una tabla de una sola fila (id siempre true).

create table public.ajustes (
  id boolean primary key default true check (id),
  reservaciones_activas boolean not null default true
);
insert into public.ajustes default values;

alter table public.ajustes enable row level security;
-- Todos los leen (el sitio decide si muestra las reservaciones); solo administración los cambia.
create policy "ajustes publicos" on public.ajustes for select to anon, authenticated using (true);
create policy "admin ajustes" on public.ajustes for update to authenticated using (public.is_admin()) with check (public.is_admin());

grant select on public.ajustes to anon, authenticated, service_role;
grant update on public.ajustes to authenticated;
