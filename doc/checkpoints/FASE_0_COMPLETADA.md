# Fase 0 completada · Auditoría

Fecha: 2026-10-31

## Compilación

`npm.cmd run build`: **éxito**, código de salida 0. Se compiló la aplicación Next.js y se validaron tipos. `npm run build` no se pudo iniciar porque la política de PowerShell bloquea `npm.ps1`; `npm.cmd` permitió ejecutar el mismo script sin cambiar dicha política.

## Conexión a Postgres

La variable `Dcarv_POSTGRES_URL_NON_POOLING` existe y tiene valor configurado en `.env.local`; también están configuradas `Dcarv_POSTGRES_URL` y `Dcarv_POSTGRES_PRISMA_URL`. No se registraron valores. `.env.local` está ignorado y no versionado. El usuario confirmó que cambió la contraseña que estaba expuesta en el plan funcional.

## Login y protección

- Login en `/login`; autentica con Supabase Auth y emite un JWT propio en la cookie HttpOnly `dcarv_session`.
- `getSession()` devuelve el payload validado o `null`.
- El login redirige actualmente a `/dashboard`.
- Existe `middleware.ts`, con matcher `/dashboard/:path*`; el flujo de soporte deberá extender la protección de acuerdo con el plan.
- El cierre de sesión elimina la cookie mediante `POST /api/auth/logout`.

## Decisiones derivadas

- Conexión Postgres de `conexion.ts`: `Dcarv_POSTGRES_URL_NON_POOLING`.
- Migraciones: no hay aplicador ni tabla de control existentes; se usará el script `npm run db:migrar` indicado en el plan.
- M1: `20261031000000_create_support_tables.sql`.
- M2: `20261031000100_create_support_view_and_security.sql`.
- Prefijo de importación: `@/lib/...`.
- Next.js instalado: 15.5.25; el archivo de protección vigente es `middleware.ts`.
- No se encontraron migraciones locales de las tablas de soporte. En consulta remota de solo lectura con `limit=0`, `users` respondió HTTP 200 y `salas`, `equipos`, `incidencias` y `tecnicos` respondieron HTTP 404 `PGRST205`; no se recuperaron filas. La API no reconoce las tablas de soporte en el esquema expuesto. Si se esperaba que ya estuvieran creadas, revisar PostgREST y confirmar columnas antes de ejecutar P01.
