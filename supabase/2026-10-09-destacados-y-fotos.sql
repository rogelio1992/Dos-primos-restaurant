-- Ejecutar una sola vez en el SQL Editor del proyecto Supabase que ya está en uso.
-- Agrega platillos destacados (máximo 3, las tarjetas de la portada) y el almacenamiento para las fotos de platillos.

-- Destacados: la base de datos también impone el límite, por si alguien lo intenta saltar desde fuera del panel.
alter table public.platillos add column destacado boolean not null default false;

create function public.limite_destacados() returns trigger language plpgsql as $$
begin
  if new.destacado and (select count(*) from public.platillos where destacado and id <> new.id) >= 3 then
    raise exception 'Ya hay 3 platillos destacados' using errcode = 'P0001';
  end if;
  return new;
end $$;

create trigger platillos_limite_destacados before insert or update of destacado on public.platillos
for each row execute function public.limite_destacados();

-- Fotos: carpeta pública (cualquiera las ve en el menú); solo administración sube, cambia o borra. Máximo 2 MB por foto.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('platillos', 'platillos', true, 2097152, array['image/webp', 'image/jpeg', 'image/png']);

create policy "admin sube fotos" on storage.objects for insert to authenticated with check (bucket_id = 'platillos' and public.is_admin());
create policy "admin cambia fotos" on storage.objects for update to authenticated using (bucket_id = 'platillos' and public.is_admin());
create policy "admin borra fotos" on storage.objects for delete to authenticated using (bucket_id = 'platillos' and public.is_admin());
