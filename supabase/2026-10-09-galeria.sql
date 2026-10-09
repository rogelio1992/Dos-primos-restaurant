-- Ejecutar una sola vez en el SQL Editor del proyecto Supabase que ya está en uso.
-- Galería de fotos del lugar para la portada, administrable desde /admin → Galería.

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
