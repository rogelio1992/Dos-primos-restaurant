# Dos Primos Restaurant

Sitio del restaurante con menú, reservaciones en línea y panel de administración. Next.js 14 + Supabase, publicado en Vercel. La estructura viene del proyecto Divas Beauty Salon Spa.

## Páginas

- `/` inicio con horario y ubicación
- `/menu` menú por categorías, leído de Supabase
- `/reservar` formulario de reservación (entra por `/api/reservaciones`)
- `/admin` reservaciones del día y edición del menú (solo cuentas administradoras)

Los datos fijos del restaurante (nombre, horario, dirección, WhatsApp, horas de reserva, zona horaria y moneda) están en `lib/restaurante.ts`.

## Puesta en marcha

1. Crear un proyecto nuevo en Supabase y ejecutar `supabase/schema.sql` en el SQL Editor. Crea las tablas `categorias`, `platillos` y `reservaciones` con un menú de ejemplo.
2. En Supabase → Authentication → Users, crear tu usuario (correo y contraseña) y ejecutar la última línea comentada de `schema.sql` con tu correo para hacerlo administrador.
3. En Vercel, importar este repositorio y configurar las tres variables de `.env.example` (están en Supabase → Project Settings → API). `SUPABASE_SERVICE_ROLE_KEY` es privada: nunca con prefijo `NEXT_PUBLIC_`.
4. Para desarrollo local: `npm install`, copiar `.env.example` a `.env.local`, `npm run dev`.

## Permisos

- El menú (platillos disponibles) es público. Solo administración lo crea, edita o borra.
- Las reservaciones públicas se guardan desde el servidor con la clave de servicio; nadie sin sesión de administración puede leerlas.
- Un usuario es administrador si tiene fila en `profiles` con `role = 'admin'`.
