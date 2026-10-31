# Estado de ejecución · Soporte de Salas

| Prompt | Estado | Build | Tests | Fecha de cierre |
|---|---|---|---|---|
| P00 Auditoría | completado | éxito | no ejecutados | 2026-10-31 |
| P01 Base de datos | completado | éxito | no aplica | 2026-10-31 |
| P02 Reglas de negocio | pendiente | | | |
| P03 Servidor | pendiente | | | |
| P04 Datos | pendiente | | | |
| P05 API | pendiente | | | |
| P06 Interfaz base, panel y salas | pendiente | | | |
| P07 Equipos y cambio de estado | pendiente | | | |
| P08 Incidencias, historial y aceptación | pendiente | | | |
| P09 Opcionales: técnicos y alertas | pendiente | | | |

## Bitácora

### P00 · Auditoría

- Archivos creados: `doc/ESTADO_ACTUAL.md`, `.github/copilot-instructions.md`, `doc/ESTADO_EJECUCION.md`, `doc/checkpoints/FASE_0_COMPLETADA.md`.
- Archivos modificados: ninguno fuera de los documentos nuevos de P00.
- Comandos ejecutados:
  - `npm run build`: PowerShell bloqueó el shim `npm.ps1` por la política de ejecución de scripts.
  - `npm.cmd run build`: terminó con código 0; build de Next.js exitoso.
  - Inspección segura de variables: se registraron solo nombres; `.env.local` está ignorado y no versionado.
  - Consultas de solo lectura a Supabase con `limit=0`: `users` respondió HTTP 200; `salas`, `equipos`, `incidencias` y `tecnicos` respondieron HTTP 404 `PGRST205`. No se recuperaron filas.
- Problemas y resolución: se cambió al shim `npm.cmd` para sortear la restricción local de PowerShell, sin cambiar la política del equipo.
- Pendientes: si se esperaba que las tablas de soporte ya existieran, revisar el esquema/cache de PostgREST y verificar columnas antes de aplicar M1/M2. Actualmente no aparecen en el esquema REST. La variable local `Dcarv_POSTGRES_URL_NON_POOLING` existe. El usuario confirmó que cambió la contraseña expuesta en el plan funcional.

### P01 · Base de datos

- Archivos creados: `supabase/migrations/20261031000000_create_support_tables.sql`, `supabase/migrations/20261031000100_create_support_view_and_security.sql`, `scripts/migrar.mjs`, `scripts/verificar-bd.mjs`, `doc/checkpoints/FASE_1_COMPLETADA.md`.
- Archivos modificados: `package.json`, `package-lock.json`; agregada la dependencia de producción `pg` y los scripts `db:migrar` / `db:verificar`.
- Base Supabase: conexión directa verificada antes de migrar; las cuatro tablas, secuencia, vista y `_migrations` no existían. `public.users` y `public.sync_auth_user()` sí existían con las columnas esperadas, por lo que la migración previa `20261003000000_create_users_table.sql` se registró sin volver a ejecutarse.
- Comandos ejecutados:
  - `npm.cmd install pg`: exitoso; npm informó 65 vulnerabilidades en el árbol (1 baja, 34 moderadas, 26 altas, 4 críticas). No se ejecutó `npm audit fix`.
  - `npm.cmd run db:migrar`: exitoso; registró la migración existente y aplicó M1 y M2.
  - Segundo `npm.cmd run db:migrar`: exitoso e idempotente; omitió las tres migraciones ya registradas.
  - `npm.cmd run db:verificar`: exitoso; 0 fallas. Salida completa en `doc/checkpoints/FASE_1_COMPLETADA.md`.
  - `npm.cmd run build`: exitoso.
- Problemas y resolución: se ajustó el import CommonJS de `@next/env`; se corrigió el nombre de los savepoints para usar identificadores SQL válidos. El primer intento de verificación terminó en ROLLBACK y no dejó filas.
- Pendientes/riesgos: PostgreSQL no revierte `nextval()` aunque la transacción haga ROLLBACK; la prueba consumió `INC-0001`, aunque las cuatro tablas quedaron con 0 filas. Los números de caso pueden tener saltos, comportamiento normal de secuencias.
