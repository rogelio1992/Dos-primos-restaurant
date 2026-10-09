# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Restaurant site for "Dos Primos": public menu, online reservations and an admin panel. Next.js 14 (App Router) + Supabase, deployed on Vercel. The UI, code identifiers, DB tables/columns and user-facing messages are all in Spanish — keep new code consistent with that (`platillos`, `reservaciones`, `avisar`, etc.).

## Commands

- `npm run dev` — local dev server (needs `.env.local` copied from `.env.example`)
- `npm run build` — production build; also the main type check (`npx tsc --noEmit` for types only)
- `npm run lint` — `next lint` (no ESLint config is committed yet, so the first run prompts to set one up)

There is no test suite.

## Architecture

**Three Supabase clients in `lib/`, each with a distinct trust level — pick the right one:**
- `supabase.ts` → `getSupabaseClient()`: browser singleton with the anon key + user session. Used by `/admin` and `/admin/login` (client components). Admin reads/writes go straight from the browser to Supabase.
- `supabase-public.ts` → `getSupabasePublic()`: server-side, deliberately anonymous, `no-store` fetch. Used by server components like `/menu` so public data is still filtered by RLS. Returns `null` if env vars are missing; pages render an empty state instead of crashing.
- `supabase-admin.ts` → `getSupabaseAdmin()`: server-only, service-role key, bypasses RLS. Only used by `app/api/reservaciones/route.ts`. Never import it into a client component.

**Security model lives in `supabase/schema.sql` (RLS), not in the Next.js code.** The `/admin` page's role check (`profiles.role = 'admin'`) is only UX; the actual enforcement is the `public.is_admin()` function used by the RLS policies. Anonymous users can read `categorias` and available `platillos`; they cannot touch `reservaciones` at all — public reservations are inserted by the API route using the service role after server-side validation (honeypot field `website`, date ≥ today, hour must be in `RESTAURANTE.horasReserva`, party size ≤ `maxPersonas`).

**`lib/restaurante.ts` is the single source of restaurant config and shared types**: name, hours, timezone (`America/Havana`), currency (CUP, shown as `$8,900 CUP`), allowed reservation times, max party size, the `Categoria`/`Platillo`/`Reservacion` types, the `ESTADOS` map, and helpers `dinero()` (currency format) and `hoy()` (today as `YYYY-MM-DD` in the restaurant's timezone). Always use `hoy()` rather than `new Date()` for date comparisons.

**Schema changes are manual.** `supabase/schema.sql` is a one-shot setup script run in the Supabase SQL Editor (no migrations tooling). When changing the schema, update `schema.sql` (for fresh setups) and also add a dated one-shot script like `supabase/2026-10-09-destacados-y-fotos.sql` for the user to run on the live project; the app code must not assume it has been run until the user confirms. Keep DB constraints in sync with app-side values — e.g. `reservaciones.estado` check ↔ `ESTADOS`, `personas` check (1–30) ↔ `RESTAURANTE.maxPersonas`, and the `limite_destacados()` trigger (3) ↔ `RESTAURANTE.maxDestacados`.

**Site settings** live in the single-row table `ajustes` (read with `getAjustes()` from `lib/ajustes.ts`, cached per request; defaults to reservations on if the table is missing). When `reservaciones_activas` is false, every reservation entry point must disappear — header button, home hero/CTA, empty-menu link — `/reservar` redirects home, and `/api/reservaciones` returns 403. Any new link to `/reservar` needs the same check.

**Reviews** (`resenas`) are inserted only through `/api/resenas` (service role, honeypot, 3 per hour per hashed IP) and start as `pendiente`; the public sees only `publicada` rows. `anon` has a column-level grant that excludes `ip_hash`, so public queries must list columns explicitly (use `RESENA_COLUMNAS`), never `select("*")`.

**Images** live in public Storage buckets with admin-only writes (RLS on `storage.objects`): `platillos` (dish photos, ≤800 px) and `galeria` (venue photos, table `galeria`, stored twice: ≤1400 px full + ≤640 px `miniatura_url`). `/admin` compresses in the browser with `lib/imagenes.ts` before upload and deletes Storage objects when a photo is replaced or its row deleted. Public pages must show only the light version and load the full one on demand (the home gallery mosaic uses thumbnails; the full image loads only in the viewer) — many visitors are on expensive mobile data in Cuba.

## Environment

`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (the last must never get a `NEXT_PUBLIC_` prefix). Configured in Vercel for production.
