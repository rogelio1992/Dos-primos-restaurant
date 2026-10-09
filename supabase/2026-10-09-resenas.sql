-- Ejecutar una sola vez en el SQL Editor del proyecto Supabase que ya está en uso.
-- Reseñas del lugar (platillo_id vacío) o de un platillo. Entran como 'pendiente' y solo se ven publicadas.

create table public.resenas (
  id bigint generated always as identity primary key,
  platillo_id bigint references public.platillos(id) on delete cascade,
  nombre text not null check (char_length(nombre) between 1 and 60),
  estrellas smallint not null check (estrellas between 1 and 5),
  comentario text not null check (char_length(comentario) between 1 and 600),
  estado text not null default 'pendiente' check (estado in ('pendiente', 'publicada', 'oculta')),
  respuesta text not null default '',
  respondida_at timestamptz,
  -- Huella anónima de la conexión, solo para limitar reseñas seguidas. Nunca se muestra.
  ip_hash text not null default '',
  created_at timestamptz not null default now()
);
create index resenas_estado_idx on public.resenas (estado, created_at desc);
create index resenas_ip_idx on public.resenas (ip_hash, created_at);

alter table public.resenas enable row level security;
create policy "resenas publicadas" on public.resenas for select to anon, authenticated using (estado = 'publicada');
create policy "admin resenas" on public.resenas for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- El público solo puede leer estas columnas (no ip_hash). Las reseñas nuevas entran por /api/resenas con la clave de servicio.
grant select (id, platillo_id, nombre, estrellas, comentario, estado, respuesta, respondida_at, created_at) on public.resenas to anon;
grant select, update, delete on public.resenas to authenticated;
grant select, insert on public.resenas to service_role;
grant usage, select on sequence public.resenas_id_seq to service_role;
