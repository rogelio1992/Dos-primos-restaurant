-- Dos Primos Restaurant: ejecutar una sola vez en el SQL Editor de un proyecto Supabase nuevo.

-- Administración: solo las cuentas listadas aquí pueden editar el menú y ver reservaciones.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  role text not null default 'admin' check (role in ('admin')),
  created_at timestamptz not null default now()
);

create table public.categorias (
  id bigint generated always as identity primary key,
  nombre text not null,
  orden integer not null default 0
);

create table public.platillos (
  id bigint generated always as identity primary key,
  categoria_id bigint not null references public.categorias(id) on delete restrict,
  nombre text not null,
  descripcion text not null default '',
  precio integer not null check (precio >= 0),
  foto_url text,
  disponible boolean not null default true,
  destacado boolean not null default false,
  orden integer not null default 0
);
create index platillos_categoria_idx on public.platillos (categoria_id, orden);

create table public.reservaciones (
  id bigint generated always as identity primary key,
  nombre text not null,
  telefono text not null,
  fecha date not null,
  hora time not null,
  personas integer not null check (personas between 1 and 30),
  estado text not null default 'pendiente' check (estado in ('pendiente', 'confirmada', 'cancelada', 'completada', 'no_asistio')),
  notas text not null default '',
  created_at timestamptz not null default now()
);
create index reservaciones_fecha_idx on public.reservaciones (fecha, hora);

create function public.is_admin() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

alter table public.profiles enable row level security;
alter table public.categorias enable row level security;
alter table public.platillos enable row level security;
alter table public.reservaciones enable row level security;

-- El menú es público; solo administración lo modifica.
create policy "menu publico categorias" on public.categorias for select to anon, authenticated using (true);
create policy "menu publico platillos" on public.platillos for select to anon, authenticated using (disponible or public.is_admin());
create policy "admin categorias" on public.categorias for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin platillos" on public.platillos for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Las reservaciones públicas entran por /api/reservaciones con la clave de servicio; solo administración las lee y cambia.
create policy "admin reservaciones" on public.reservaciones for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "perfil propio" on public.profiles for select to authenticated using (id = auth.uid());

grant usage on schema public to anon, authenticated, service_role;
grant select on public.categorias, public.platillos to anon;
grant select, insert, update, delete on public.categorias, public.platillos, public.reservaciones to authenticated;
grant select on public.profiles to authenticated;
grant usage, select on all sequences in schema public to authenticated;
grant select, insert on public.reservaciones to service_role;
grant usage, select on sequence public.reservaciones_id_seq to service_role;

-- Destacados de la portada: máximo 3 (igual a RESTAURANTE.maxDestacados).
create function public.limite_destacados() returns trigger language plpgsql as $$
begin
  if new.destacado and (select count(*) from public.platillos where destacado and id <> new.id) >= 3 then
    raise exception 'Ya hay 3 platillos destacados' using errcode = 'P0001';
  end if;
  return new;
end $$;

create trigger platillos_limite_destacados before insert or update of destacado on public.platillos
for each row execute function public.limite_destacados();

-- Fotos de platillos: carpeta pública (cualquiera las ve en el menú); solo administración sube, cambia o borra. Máximo 2 MB por foto.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('platillos', 'platillos', true, 2097152, array['image/webp', 'image/jpeg', 'image/png']);

create policy "admin sube fotos" on storage.objects for insert to authenticated with check (bucket_id = 'platillos' and public.is_admin());
create policy "admin cambia fotos" on storage.objects for update to authenticated using (bucket_id = 'platillos' and public.is_admin());
create policy "admin borra fotos" on storage.objects for delete to authenticated using (bucket_id = 'platillos' and public.is_admin());

-- Ajustes generales que se cambian desde /admin (tabla de una sola fila).
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

-- Galería de fotos del lugar (portada).
-- Cada foto se guarda en dos tamaños: la miniatura para el mosaico y la grande solo para cuando alguien la abre.
create table public.galeria (
  id bigint generated always as identity primary key,
  foto_url text not null,
  miniatura_url text not null,
  descripcion text not null default '',
  orden integer not null default 0,
  created_at timestamptz not null default now()
);
create index galeria_orden_idx on public.galeria (orden, id);

alter table public.galeria enable row level security;
create policy "galeria publica" on public.galeria for select to anon, authenticated using (true);
create policy "admin galeria" on public.galeria for all to authenticated using (public.is_admin()) with check (public.is_admin());

grant select on public.galeria to anon;
grant select, insert, update, delete on public.galeria to authenticated;
grant usage, select on sequence public.galeria_id_seq to authenticated;

-- Archivos: carpeta pública; solo administración sube, cambia o borra. Máximo 3 MB por archivo.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('galeria', 'galeria', true, 3145728, array['image/webp', 'image/jpeg', 'image/png']);

create policy "admin sube galeria" on storage.objects for insert to authenticated with check (bucket_id = 'galeria' and public.is_admin());
create policy "admin cambia galeria" on storage.objects for update to authenticated using (bucket_id = 'galeria' and public.is_admin());
create policy "admin borra galeria" on storage.objects for delete to authenticated using (bucket_id = 'galeria' and public.is_admin());

-- Reseñas del lugar o de un platillo; entran pendientes y se publican desde /admin.
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
-- Supabase da por defecto lectura de todas las columnas en tablas nuevas: quitarla y dar solo las públicas.
revoke select on public.resenas from anon, authenticated;
grant select (id, platillo_id, nombre, estrellas, comentario, estado, respuesta, respondida_at, created_at) on public.resenas to anon, authenticated;
grant update, delete on public.resenas to authenticated;
grant select, insert on public.resenas to service_role;
grant usage, select on sequence public.resenas_id_seq to service_role;

-- Menú de ejemplo para ver el sitio funcionando; editarlo desde /admin.
with c as (
  insert into public.categorias (nombre, orden) values ('Entradas', 1), ('Platos fuertes', 2), ('Bebidas', 3), ('Postres', 4)
  returning id, nombre
)
insert into public.platillos (categoria_id, nombre, descripcion, precio, orden)
select c.id, p.nombre, p.descripcion, p.precio, p.orden from c join (values
  ('Entradas', 'Guacamole con totopos', 'Aguacate, tomate, cebolla y cilantro.', 6500, 1),
  ('Platos fuertes', 'Tacos al pastor', 'Tres tacos con piña, cebolla y cilantro.', 8900, 1),
  ('Platos fuertes', 'Enchiladas verdes', 'Pollo, salsa verde, crema y queso.', 9500, 2),
  ('Bebidas', 'Agua de horchata', 'Vaso de 500 ml.', 2500, 1),
  ('Postres', 'Flan de la casa', 'Con caramelo.', 3900, 1)
) as p(categoria, nombre, descripcion, precio, orden) on p.categoria = c.nombre;

-- Después de crear tu cuenta en Authentication → Users, conviértela en administradora:
-- insert into public.profiles (id, full_name) select id, 'Rogelio' from auth.users where email = 'TU_CORREO';
