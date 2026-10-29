-- Ejecutar una sola vez en el SQL Editor del proyecto Supabase que ya está en uso.
-- Agregos (ingredientes extra con su precio) de una categoría, p. ej. jamón o queso extra para las pizzas.
-- Se muestran en el menú al final de su categoría y se administran desde /admin → Menú.
create table public.agregos (
  id bigint generated always as identity primary key,
  categoria_id bigint not null references public.categorias(id) on delete cascade,
  nombre text not null check (char_length(nombre) between 1 and 60),
  precio integer not null check (precio >= 0),
  disponible boolean not null default true,
  orden integer not null default 0
);
create index agregos_categoria_idx on public.agregos (categoria_id, orden);

alter table public.agregos enable row level security;
create policy "agregos publicos" on public.agregos for select to anon, authenticated using (disponible or public.is_admin());
create policy "admin agregos" on public.agregos for all to authenticated using (public.is_admin()) with check (public.is_admin());

grant select on public.agregos to anon;
grant select, insert, update, delete on public.agregos to authenticated;
grant usage, select on sequence public.agregos_id_seq to authenticated;
