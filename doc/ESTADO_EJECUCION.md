# Estado de ejecución · Soporte de Salas

| Prompt | Estado | Build | Tests | Fecha de cierre |
|---|---|---|---|---|
| P00 Auditoría | completado | éxito | no ejecutados | 2026-10-31 |
| P01 Base de datos | completado | éxito | no aplica | 2026-10-31 |
| P02 Reglas de negocio | completado | éxito | 46/46 | 2026-11-04 |
| P03 Servidor | completado | éxito | 46/46 | 2026-11-04 |
| P04 Datos | completado; `probar:flujo` 14/14 y `db:demo` cargado | éxito | 46/46 | 2026-11-04 |
| P05 API | completado | éxito | 46/46 | 2026-11-04 |
| P06 Interfaz base, panel y salas | completado | éxito | 46/46 | 2026-11-04 |
| P07 Equipos y cambio de estado | completado | éxito | 46/46 | 2026-11-04 |
| P08 Incidencias, historial y aceptación | completado; A-01 a A-14 cumplen en producción | éxito | 46/46 | 2026-11-04 |
| P09 Opcionales: técnicos y alertas | completado; A-15 y A-16 cumplen; `CRON_SECRET` creado | éxito | 46/46 | 2026-11-04 |

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

### P02 a P09 · Auditoría y cierre (2026-11-04)

Contexto: al retomar, el código de P02 a P09 ya existía en el repositorio, pero la bitácora solo registraba P00 y P01. En vez de reescribirlo, se auditó cada archivo contra el plan y los prompts, se corrigió lo que faltaba y se generó la documentación de cierre.

- Entorno: este equipo no tenía Node.js ni `node_modules`. Se instaló Node.js LTS 26.13.0 con `winget install OpenJS.NodeJS.LTS` y se ejecutó `npm install` (exitoso). Tampoco hay `.env.local` (no se sincroniza: está en `.gitignore`), así que **no se pudo ejecutar nada contra Supabase**.
- Auditoría sin hallazgos de fondo en: `lib/config`, `lib/reglas`, pruebas T-01 a T-21, `lib/db/conexion.ts`, `lib/auth/sesion.ts`, `lib/http/respuestas.ts`, `lib/validacion/esquemas.ts`, `lib/formato.ts`, `lib/datos/*`, `dataService.ts`, las 12 rutas de `api/soporte` + `api/cron/reasignar`, las 8 pantallas de `/soporte` y los componentes de `components/soporte` y `components/ui`. Detalle de la revisión de P08 TAREA 4 en `checkpoints/FASE_6_COMPLETADA.md`.
- Archivos modificados:
  - `src/app/page.tsx`: ya no muestra `HolaMundo`; redirige a `/soporte` (P06 TAREA 3, sección 5 del plan).
  - `next.config.mjs`: `redirects()` de `/` a `/soporte` (307). Motivo: con el `loading.tsx` de la raíz, `redirect()` en la página respondía 200 en streaming.
  - `src/components/soporte/FormularioIncidencia.tsx`: sangría.
  - `.gitignore`: `!.env.example`, porque la regla `.env*` lo excluía.
  - `.env.example`: nombres `Dcarv_POSTGRES_URL` y `Dcarv_POSTGRES_URL_NON_POOLING` (vacíos).
  - `README.md`: reescrito para Soporte de Salas (P08 TAREA 7).
- Archivos creados: `doc/ACEPTACION.md`, `doc/checkpoints/FASE_2_COMPLETADA.md` a `FASE_7_COMPLETADA.md`.
- Comandos y resultados:
  - `npm test`: 9 archivos, 46 pruebas, todas en verde.
  - `npm run build`: éxito (también tras cada cambio).
  - `npx tsc --noEmit`: sin errores.
  - `next start` y peticiones sin sesión: `/` → 307 `/soporte` → 307 `/login`; `/soporte/equipos/PC-01` → 307 `/login`; `GET /api/soporte/sesion`, `GET`/`POST /api/soporte/equipos`, `POST /api/soporte/salas`, `GET /api/cron/reasignar` → 401 `NO_AUTORIZADO`.
- Excepción documentada: `dataService.ts` reexporta `cerrarConexion` de `lib/db/conexion.ts` para los scripts.
- Pendientes (requieren `.env.local` o sesión):
  1. `npm run probar:flujo` (14 OK), `npm run db:demo`, `npm run probar:opcionales`.
  2. Con sesión: `/api/soporte/sesion` → 200 y el login lleva a `/soporte`.
  3. Revisión visual del panel, filtros, cambio de estado, salas, reporte e historial, incluido el móvil.
  4. Crear `CRON_SECRET` en las variables de Vercel.
  5. Commit, push y ejecutar A-01 a A-16 en Vercel (`doc/ACEPTACION.md`).
### Cierre de pendientes (2026-11-04, segunda parte)

- Vercel CLI: inicio de sesión por código de dispositivo (cuenta `d4n1el-11`) y `vercel link` al proyecto `daniel-carvajalino/dcarv`. Se creó `.vercel/` (ignorado). Vercel añadió `.vercel` y `.env*` al final del `.gitignore`; la línea `.env*` repetida se quitó para que `!.env.example` siga funcionando.
- Variables: el entorno Development de Vercel no tiene variables (`vercel env pull` solo trae `VERCEL_OIDC_TOKEN`). Las de Postgres y `JWT_SECRET` existen en Production (y Preview). **No existe `CRON_SECRET`.**
- Bloqueado por permisos de seguridad del agente (no se intentó rodear):
  - descargar los valores de producción a un archivo local (necesario para `probar:flujo`, `db:demo` y `probar:opcionales`);
  - crear `CRON_SECRET` en Vercel.
- Producción (`https://dcarv.vercel.app`, despliegue del 2026-10-31 desde la rama `main`) ya tiene el módulo de P02 a P09: `/soporte` → 307 `/login`; `/api/soporte/sesion`, `/api/soporte/equipos`, `/api/cron/reasignar` → 401. Le faltan solo los cambios de hoy (`/` todavía muestra `HolaMundo`).
- No se desplegó a producción desde la CLI: el proyecto está conectado a git, y este equipo no tiene git ni repositorio; un despliegue directo quedaría por delante de `main`. Se hizo un **despliegue preview** con el código local: `https://dcarv-jzm3xuxa2-daniel-carvajalino.vercel.app`, estado Ready. Verificado: `/` → 307 `/soporte` → 307 `/login`; `/api/soporte/sesion` → 401.
- Aceptación: A-01 cumple en producción. A-02 a A-16 requieren iniciar sesión en el navegador.
### Pruebas de aceptación en producción (2026-11-04, tercera parte)

- El estudiante entregó sus credenciales en el chat para las pruebas. Se usaron solo en `POST /api/auth/login`. No se escribieron en ningún archivo, y la cookie temporal se borró al terminar. **Se recomienda cambiar la contraseña.**
- Bloqueado por permisos del agente: el despliegue a producción con `vercel deploy --prod`. Producción sigue con el despliegue del 2026-10-31 (rama `main`); le faltan los cambios de esta sesión, que se suben con commit y push desde el equipo con git.
- A-01 a A-16: **16/16 cumplen** en `https://dcarv.vercel.app` (detalle y evidencia en `doc/ACEPTACION.md`). Casos creados: `INC-0019` a `INC-0022`.
- Adicionales: reportar sobre un equipo dado de baja lo deja `dado_de_baja` (`INC-0022`); "roto" → 422; equipo inexistente → 404; `/api/soporte/sesion` con sesión → 200; el login de producción redirige a `/soporte`.
- A-02: ya existía "sala 1"; crear "Sala 1" dio 409 `SALA_DUPLICADA` (correcto) y se usó la existente.
- Datos que quedan en producción: "Sala 2", PC-SALA1-01, PC-SALA1-02, `INC-0019` a `INC-0022` y "Técnico Aceptación".
- Siguen pendientes, por permisos: `CRON_SECRET` en Vercel; `probar:flujo`, `db:demo` y `probar:opcionales` (requieren `.env.local`); el despliegue a producción.
### CRON_SECRET, variables locales y despliegue (2026-11-04, cuarta parte)

Con autorización explícita del estudiante:

- `CRON_SECRET`: creado en Vercel Production como variable sensible, con 48 bytes aleatorios. El primer intento añadió un salto de línea (la tubería de PowerShell lo agrega) y el despliegue falló con "contains leading or trailing whitespace". Se borró y se volvió a crear enviando el valor desde un archivo sin salto de línea, que se borró de inmediato. El valor nunca se mostró.
- Despliegue a producción: `vercel deploy --prod` desde esta carpeta → `dcarv-a0d7ontop-daniel-carvajalino.vercel.app`, READY, con alias `https://dcarv.vercel.app`. Verificado: `/` → 307 `/soporte`; `/soporte` → 307 `/login`; `/api/soporte/sesion` y `/api/cron/reasignar` → 401; `vercel crons ls` → `/api/cron/reasignar 0 13 * * *`.
  - Nota: el proyecto está conectado a la rama `main` de GitHub. Este despliegue salió de la CLI, no de git; el próximo push a `main` lo reemplazará, así que esos cambios deben estar en el repositorio.
- Variables locales: `vercel env pull --environment=preview` trajo todas las variables del proyecto con el valor literal `[SENSITIVE]`. Vercel no devuelve el valor de las variables sensibles, por diseño. `db:verificar` falló con `ERR_INVALID_URL` y no tocó la base. Se quitaron de `.env.local` los marcadores y las variables de sistema (`VERCEL`, `TURBO_*`…); queda solo `VERCEL_OIDC_TOKEN`.
- Por eso `probar:flujo`, `db:demo` y `probar:opcionales` siguen sin ejecutarse: falta el valor real de `Dcarv_POSTGRES_URL_NON_POOLING`.
- `.gitignore`: Vercel volvió a añadir `.env*` al final; se quitó para conservar `!.env.example`.
### Scripts contra la base de datos (2026-11-04, quinta parte)

- El estudiante copió las claves en `.env.local` (incluido `Dcarv_POSTGRES_URL_NON_POOLING`). Se comprobaron solo nombres y formato, nunca los valores.
- `npm run db:verificar`: 0 fallas. El caso e) consumió `INC-0023` (la secuencia no se revierte con ROLLBACK).
- `npm run probar:flujo`: 14 OK, 0 fallas.
- `npm run probar:opcionales`: 7 OK, 0 fallas (técnico duplicado, asignación, no reasignar dos veces, reasignación de una vencida, umbral de alertas).
- `npm run db:demo`: "Demo Sala A" y "Demo Sala B" con DEMO-A-01..03 y DEMO-B-01..03; DEMO-A-01 con 3 incidencias (candidato a baja).
- La limpieza `--prueba` de los scripts borró también la sala de depuración antigua "Prueba Dbg" con PC-DBG (sigue la convención de prefijos del plan).
- Estado final de la base: 4 salas, 8 equipos, 8 incidencias, 1 técnico.
- **No queda ningún pendiente técnico.** Solo falta llevar los cambios de esta carpeta al repositorio git (commit y push a `main`), para que el próximo despliegue desde GitHub no los revierta.
### Mejoras de la interfaz (2026-11-04, sexta parte)

Pedido del estudiante: mejorar la página según los objetivos del plan. Se mantuvo el alcance de la sección 4.3 (sin roles, repuestos ni reportes más allá de los 30 días) y las reglas de la sección 10.3.

- Panel (`/soporte`): indicadores (disponibles con %, en reparación, dados de baja, incidencias pendientes), cada uno enlazado a su filtro; tarjetas de sala con barra de disponibilidad que filtran el panel al pulsarlas; fecha del día (`hoyBogota()`); bienvenida cuando no hay salas.
- Filtros: se aplican al cambiar la sala o el estado (`router.push`, siguen en la URL), muestran el conteo de resultados y ofrecen "Limpiar filtros".
- Tabla de equipos: columna "Incidencias (30 días)" con la insignia "Candidato a baja" (`esCandidatoABaja`); confirmación visible "Ahora: …" tras cambiar un estado.
- Registro: sala preseleccionada desde la tarjeta de sala (`?salaId=`); nuevo `FormularioVariosEquipos` (prefijo + rango, hasta `MAXIMO_LOTE_EQUIPOS` = 50) que usa la misma API y validaciones, y lista los códigos omitidos.
- Ficha del equipo: migas de pan, resumen (sala, incidencias de 30 días, pendientes, último reporte), aviso de candidato a baja, y en el formulario de reporte se anticipa el efecto en el estado del equipo (RN-06) más un contador de caracteres. Página propia de equipo no encontrado.
- Historial: "reportada hoy / ayer / hace N días" en las incidencias pendientes (con `diasEntre` y `hoyBogota`).
- Incidencias: pestañas por estado con conteo (`contarIncidenciasPorEstado`) y filtro por equipo que conserva la pestaña.
- Alertas: ordenadas de más a menos crítico; cada candidato muestra su estado y se puede dar de baja ahí mismo (con la confirmación de la sección 12.1). El menú muestra el número de alertas.
- Técnicos: insignia Activo/Inactivo y explicación de la reasignación (RN-10).
- General: `loading.tsx` y `error.tsx` de `/soporte`, títulos por página (`… · Soporte de Salas`), `icon.svg`, enlace "Saltar al contenido", barra superior fija. El `Modal` ahora enfoca solo al abrir, se cierra al pulsar el fondo, bloquea el desplazamiento y devuelve el foco.
- Datos: `FilaEquipo.salaId`, `FilaCandidato.estado`, `contarIncidenciasPorEstado()` (en `lib/datos/incidencias.ts`, exportada por `dataService`).
- Reglas y formato puros con pruebas: `generarCodigos` (en `lib/reglas/equipo.ts`, 8 pruebas), `textoAntiguedad`, `porcentaje` y `plural` (en `lib/formato.ts`, `tests/formato.test.ts`).
- Resultados: `tsc --noEmit` sin errores; `npm test` 58/58; `npm run build` exitoso. Con `next start` contra la base real y sesión iniciada, las 12 páginas revisadas responden 200 con el contenido esperado. El equipo inexistente responde 200 con `noindex` y la página "No existe un equipo con ese código": es el comportamiento de Next con streaming (`loading.tsx`).
- No desplegado todavía.- Publicado en producción el 2026-11-04 (`dcarv-rerkkv8zk-daniel-carvajalino.vercel.app`, alias `https://dcarv.vercel.app`), a pedido del estudiante. Verificado: sin sesión `/` y `/soporte` → 307 y `/api/soporte/sesion` → 401; con sesión, las 12 páginas responden 200 con el contenido esperado.