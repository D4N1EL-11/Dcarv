# Estado actual del repositorio · Soporte de Salas

Auditoría P00 realizada el 2026-10-31. No se copiaron valores de variables de entorno.

## 1. Versiones

Versiones declaradas en `package.json`:

| Paquete | Versión declarada |
|---|---|
| next | `^15.5.4` (el build resolvió Next.js 15.5.25) |
| react | `^19.1.0` |
| typescript | `^5.9.2` |
| tailwindcss | `^4.1.13` |
| pg | No existe |
| zod | `^4.1.5` |
| @supabase/supabase-js | `^2.117.2` |
| vitest | `^3.2.4` |

## 2. Scripts de `package.json`

| Script | Comando |
|---|---|
| `dev` | `node scripts/tokenVercel.mjs && next dev` |
| `build` | `next build` |
| `start` | `next start` |
| `lint` | `eslint .` |
| `format` | `prettier --write "src/**/*.{ts,tsx,css}"` |
| `type-check` | `tsc --noEmit` |
| `test` | `vitest run` |
| `test:watch` | `vitest` |
| `test:coverage` | `vitest run --coverage` |

No existen scripts `db:migrar` ni `db:verificar`.

## 3. Estructura

El proyecto usa `src/`; no hay carpetas raíz `app/`, `lib/` ni `components/`.

```text
src/
├── app/
│   ├── (auth)/                 # login, registro y recuperación de contraseña
│   ├── (dashboard)/            # panel, usuarios, notas, estado y cambio de contraseña
│   ├── api/
│   │   ├── admin/users/
│   │   ├── auth/
│   │   ├── data/[collection]/
│   │   └── health/
│   ├── dashboard/              # layout y página
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── auth/
│   ├── dashboard/
│   ├── home/
│   ├── layout/
│   ├── notes/
│   ├── theme/
│   └── ui/                     # badge, button, card, container, input, spinner, typography
├── hooks/                      # use-collection.ts
├── lib/
│   ├── __tests__/
│   ├── auth/                   # hash, jwt, rbac, session
│   ├── supabase/
│   └── servicios y utilidades  # dataService, json-db, correo, storage, etc.
├── modules/notes/
├── styles/                     # tokens.ts
└── test/                       # setup.ts

supabase/
├── migrations/
│   └── 20261003000000_create_users_table.sql
└── restablecimientos_contrasena.sql

scripts/
└── tokenVercel.mjs
```

## 4. Alias de importación

En `tsconfig.json`:

- `@/*` → `./src/*`
- `@data/*` → `./data/*`

Vitest también configura esos dos alias.

## 5. Autenticación

- Login: ruta `/login`, implementada en `src/app/(auth)/login/page.tsx`.
- Mecanismo: el endpoint `src/app/api/auth/login/route.ts` autentica con Supabase Auth (`signInWithPassword`), consulta el perfil `users`, genera un JWT propio y lo guarda en la cookie HttpOnly `dcarv_session` por 24 horas.
- Lectura de sesión: `getSession()` en `src/lib/auth/session.ts` obtiene la cookie y verifica el JWT; devuelve `SessionPayload` o `null`.
- Después de iniciar sesión, la interfaz redirige a `/dashboard` en `src/app/(auth)/login/page.tsx:64`. El plan de Soporte de Salas prevé `/soporte`; deberá cambiarse al implementar ese flujo.
- Protección existente: `middleware.ts` valida el JWT y redirige a `/login`; su matcher es `/dashboard/:path*`. No protege actualmente `/soporte` ni `/api/soporte`.
- Cierre de sesión: `POST /api/auth/logout` elimina la cookie `dcarv_session`.

## 6. Acceso a datos

- `src/lib/supabase/server.ts` expone un cliente Supabase con clave pública, que puede recibir el token de sesión, y un cliente administrativo con clave privada.
- Existe `src/lib/dataService.ts`; el proyecto también incluye una capa local JSON en `src/lib/json-db.ts`.
- El paquete `pg` y un pool de Postgres no existen todavía.
- `.env.local` contiene las variables `Dcarv_POSTGRES_URL`, `Dcarv_POSTGRES_URL_NON_POOLING` y `Dcarv_POSTGRES_PRISMA_URL`, con valores configurados. Para el acceso directo que requiere `pg`, la variable elegida es `Dcarv_POSTGRES_URL_NON_POOLING`.

## 7. Migraciones

- Carpeta: `supabase/migrations/`.
- Migración local existente: `20261003000000_create_users_table.sql`, que crea `public.users` con `id`, `email`, `role`, `created_at` y `updated_at`, activa RLS y configura la sincronización con `auth.users`.
- No se encontró una tabla de control `_migrations`, un script que aplique migraciones ni una página que las aplique.
- Mecanismo derivado para las próximas migraciones: crear el script `npm run db:migrar` definido por el plan, registrando la migración previa solo si se confirma que ya fue aplicada.

## 8. Variables de entorno

Solo nombres; ningún valor:

- `.env.local`: `NEXT_PUBLIC_Dcarv_DCARVSUPABASE_ANON_KEY`, `NEXT_PUBLIC_Dcarv_DCARVSUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_Dcarv_DCARVSUPABASE_URL`, `Dcarv_POSTGRES_DATABASE`, `Dcarv_POSTGRES_HOST`, `Dcarv_POSTGRES_PASSWORD`, `Dcarv_POSTGRES_PRISMA_URL`, `Dcarv_POSTGRES_URL`, `Dcarv_POSTGRES_URL_NON_POOLING`, `Dcarv_POSTGRES_USER`, `Dcarv_SUPABASE_JWT_SECRET`, `Dcarv_SUPABASE_SECRET_KEY`, `Dcarv_SUPABASE_SERVICE_ROLE_KEY`, `Dcarv_SUPABASE_URL`, `VERCEL_OIDC_TOKEN`.
- `.env.example`: `NODE_ENV`, `NEXT_PUBLIC_APP_NAME`, `NEXT_PUBLIC_APP_VERSION`, `NEXT_PUBLIC_SITE_URL`, `DATA_DIR`, `JWT_SECRET`, `KV_REST_API_URL`, `KV_REST_API_TOKEN`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`.

La conexión directa existe localmente como `Dcarv_POSTGRES_URL_NON_POOLING`; no hace falta obtener otra para continuar P00. `.env.local` está excluido por `.gitignore` y no está versionado. La comparación textual de valores locales contra archivos versionados detectó solo coincidencias parciales de las variables de usuario/base de datos dentro del nombre y la URL del paquete PostgREST en `package-lock.json`; no son asignaciones de entorno. No se detectaron coincidencias para las demás variables. Los valores no se imprimieron. Confirmación del usuario: la contraseña expuesta en el plan funcional ya fue cambiada.

## 9. Estilos

- Tailwind CSS `^4.1.13`; `src/app/globals.css` importa `tailwindcss`.
- No se importa una fuente web. La pila CSS usa `'Avenir Next', 'Segoe UI', sans-serif`.
- `globals.css` define `--bg-primary`, `--bg-secondary`, `--text-primary`, `--text-secondary`, `--line`, `--accent` y `--accent-soft`.
- `src/styles/tokens.ts` define colores `primary`, `accent`, `success`, `warning`, `error` e `info`, además de radio, espaciado y tipografía.
- No se encontró una librería de íconos instalada ni imports de una en `src/`.

## 10. Pruebas

Vitest `^3.2.4`, configurado en `vitest.config.ts` con entorno jsdom. Hay pruebas en `src/lib/__tests__/` y en rutas API. El build de P00 no ejecutó la suite de pruebas.

## 11. Conflictos con el plan

- `src/app/soporte`: no existe.
- `src/app/api/soporte`: no existe.
- `src/lib/dataService.ts`: existe.
- `src/components/ui/`: existe y contiene componentes compartidos.
- `src/app/page.tsx`: muestra el componente `HolaMundo`.
- La única migración local crea `public.users`; no declara `salas`, `equipos`, `incidencias` ni `tecnicos`.
- **Esquema remoto (verificación de solo lectura el 2026-10-31):** el endpoint Supabase respondió HTTP 404 `PGRST205` al consultar con `limit=0` cada una de las tablas `salas`, `equipos`, `incidencias` y `tecnicos`; la API no las reconoce en el esquema expuesto. La consulta de control a `users` respondió HTTP 200. No se leyeron filas. La estructura de las cuatro tablas no está disponible; si se esperaba que existieran, revisar el esquema/cache de PostgREST antes de aplicar M1/M2.

## 12. Decisiones derivadas

- Ruta de login: `/login`.
- Archivo de protección: `middleware.ts` (Next.js 15); existe y su matcher actual es `/dashboard/:path*`.
- Mecanismo de migraciones: no hay aplicador existente; usar el script `npm run db:migrar` del plan, después de comprobar el estado de la migración actual.
- Variable para `conexion.ts`: `Dcarv_POSTGRES_URL_NON_POOLING` (ya configurada localmente).
- M1: `20261031000000_create_support_tables.sql`.
- M2: `20261031000100_create_support_view_and_security.sql`.
- Prefijo de imports para `lib`: `@/lib/...`.

## 13. Compilación de base

- Comando ejecutado: `npm.cmd run build` (el alias `npm` de PowerShell no pudo ejecutarse por la política local de scripts; se usó el shim de Windows).
- Resultado: **éxito**, código de salida 0. Next.js compiló, validó tipos y generó las páginas estáticas.
- No se instalaron dependencias ni se modificó código para obtener este resultado.
