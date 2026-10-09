-- Ejecutar una sola vez en el SQL Editor (arreglo de 2026-10-09-resenas.sql).
-- Supabase da por defecto lectura de todas las columnas a anon/authenticated en tablas nuevas,
-- así que el permiso por columnas no bastaba: hay que quitar el general y dejar solo las columnas públicas (sin ip_hash).
revoke select on public.resenas from anon, authenticated;
grant select (id, platillo_id, nombre, estrellas, comentario, estado, respuesta, respondida_at, created_at) on public.resenas to anon, authenticated;
