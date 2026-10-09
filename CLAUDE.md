# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Restaurant site for "Dos Primos": public menu, online reservations and an admin panel. Next.js 16 (App Router, Turbopack, React 19) + Supabase, deployed on Vercel. The UI, code identifiers, DB tables/columns and user-facing messages are all in Spanish — keep new code consistent with that (`platillos`, `reservaciones`, `avisar`, etc.).

## Commands

- `npm run dev` — local dev server (needs `.env.local` copied from `.env.example`)
- `npm run build` — production build (type-checks but no longer lints; `npx tsc --noEmit` for types only)
- `npm run lint` — ESLint 9 flat config (`eslint.config.mjs`, `eslint-config-next`). `next lint` no longer exists in Next 16. ESLint 10 is not yet compatible with the bundled `eslint-plugin-react`.
- Node 22 (`.nvmrc`; run `nvm use`).

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

**View transitions** (React `<ViewTransition>`, see `.claude/skills/vercel-react-view-transitions`): each public page wraps its root in `<TransicionPagina>` (fade; the header links are lateral, so no directional slides) — never add a layout-level VT around `{children}`, it silently disables the page ones. The header is pinned with `viewTransitionName: "encabezado"`. In `app/galeria.tsx` the thumbnail↔viewer morph relies on tiles dropping their `name` while the viewer is open (a name may be mounted only once), prev/next use `addTransitionType` for directional slides, and the full-size viewer image is `loading="lazy"` on purpose: otherwise React holds the transition until it downloads. All CSS classes live at the end of `globals.css`.

## Environment

`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (the last must never get a `NEXT_PUBLIC_` prefix). Configured in Vercel for production.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
