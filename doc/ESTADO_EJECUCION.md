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
### Push a GitHub (2026-11-04)

- Se instalaron Git y GitHub CLI (`winget`); inicio de sesión en GitHub (cuenta `D4N1EL-11`) por código de dispositivo.
- Repositorio: `D4N1EL-11/Dcarv` (público, rama `main`). Se clonó en una carpeta temporal, se copió esta carpeta encima (sin `node_modules`, `.next`, `.vercel` ni `.env.local`) y se comprobó que las diferencias reales eran solo las de estas sesiones: 33 archivos modificados y 17 nuevos. El resto eran finales de línea.
- Antes del commit se revisaron las líneas añadidas en busca de contraseñas, cadenas de conexión, tokens JWT, claves y correos: ninguno.
- Commit `cbb7643` "feat(soporte): cierre del plan y mejoras de la interfaz" (autor Daniel Carvajalino), push `b933501..cbb7643` a `main`.
- Vercel desplegó desde git: `dcarv-jmxi75g16`, Ready, Production, alias `https://dcarv.vercel.app`. Producción y GitHub quedaron alineados.
- Esta carpeta de OneDrive sigue sin ser un repositorio git; esta entrada de la bitácora es el único cambio pendiente de subir.- Después del push, esta carpeta se convirtió en repositorio git conectado a `D4N1EL-11/Dcarv` (`git init`, remoto `origin`, `git reset origin/main` sin tocar archivos, `main` sigue a `origin/main`). Al conectarla, la única diferencia real era esta bitácora. `.env.local`, `node_modules`, `.next` y `.vercel` siguen ignorados.

### Tema oscuro con dorado (2026-11-04, séptima parte)

- Pedido del estudiante: home, login y crear cuenta más minimalistas, con fondo oscuro y dorado en títulos y líneas. Se cambiaron los tokens de `globals.css` (toda la app hereda el tema), las fuentes (Cormorant Garamond para títulos, Inter para el texto, con `next/font`) y los componentes base. Login, registro y recuperación comparten `MarcoAcceso`. El registro pide confirmar la contraseña y avisa si hay que confirmar el correo.

### Mejoras técnicas por pestaña (2026-11-04, octava parte)

Pedido del estudiante: mejoras técnicas, no estéticas, en Panel, Incidencias, Salas, Técnicos y Alertas. Se mantuvieron el alcance (sección 4.3) y las reglas de capas (sección 10.3): reglas nuevas en `lib/reglas/`, SQL solo en `lib/datos/`, rutas con `exigirSesion()` primero, Zod en formulario y API, y sin cambios en el esquema de la base.

- Transversal: la ventana de 30 días usa `inicioVentana(hoyBogota(), 30)` como parámetro SQL. La tabla del panel y la ficha del equipo contaban con `CURRENT_DATE` de la vista `v_equipos` (UTC) y podían no coincidir con las alertas entre las 19:00 y las 24:00 de Colombia. El contador del menú y la página comparten la consulta de alertas con React `cache` (antes, 2 consultas por carga). Sesión vencida: el middleware guarda `?siguiente=`, `llamarApi` lleva al login ante un 401 y el login vuelve a la página de origen (`rutaSegura` evita redirecciones abiertas). Ayudante `crearParametros()` para armar SQL parametrizado.
- Panel: paginación de equipos (50 por página, `COUNT(*) OVER ()` en la misma consulta). El total real reemplaza el tope silencioso de 500, y una página inexistente muestra un enlace a la primera.
- Incidencias: paginación (25), búsqueda por número de caso, código o texto de la falla (comodines escapados), filtro por técnico y conteos de las pestañas que respetan los demás filtros. Asignar exige elegir y pulsar "Asignar", y cerrar pide confirmación: ninguna de las dos tiene vuelta atrás. `cerrarIncidencia` ahora es una transacción (`FOR UPDATE` de la incidencia y su equipo) y ofrece, a pedido del usuario, devolver el equipo a funcional si era su última incidencia pendiente (`puedeReactivarseAlCerrar`). Los casos en revisión muestran cuánto falta para la reasignación automática (`diasHastaReasignacion`, RN-10).
- Salas: renombrar (`PATCH /api/soporte/salas/[id]`, SALA_DUPLICADA sin distinguir mayúsculas) y eliminar solo si no tiene equipos (`DELETE`, TIENE_DEPENDENCIAS en una transacción, con la llave foránea como respaldo).
- Técnicos: activar o desactivar (`PATCH /api/soporte/tecnicos/[id]`). Al desactivar, sus casos en revisión pasan en la misma transacción al activo con menos carga (`elegirConMenosCarga`, también usada por RN-10). Además: renombrar, validación del nombre en el servicio, casos cerrados por técnico, enlace "Ver sus casos" y los activos primero.
- Alertas: `listarCandidatosABaja` cuenta en la base con `GROUP BY`/`HAVING` sobre la ventana, en vez de traer todas las incidencias de la historia y contarlas en JavaScript. Cada candidato muestra su último reporte y sus incidencias pendientes, con un enlace a ellas.
- API: `GET /api/soporte/equipos` e `/incidencias` aceptan `?pagina=` (sin él responden la lista como antes). Un `[id]` mal formado responde 400, no 500. `POST …/cerrar` acepta un cuerpo opcional `{ equipoFuncional }`.
- Pruebas: `tests/reglas/mejoras.test.ts` (14 pruebas). `npm test` 72/72. Nuevo `npm run probar:mejoras` contra la base: 24 OK, 0 fallas. `probar:flujo` 14 OK y `probar:opcionales` 7 OK, sin cambios. `tsc`, ESLint y `npm run build` sin errores. Con `next dev` y una sesión de prueba firmada en memoria: las 11 páginas responden 200 sin error y las 10 comprobaciones de API dan el código esperado.
- Publicado a pedido del estudiante: commit `6f35001`, push `75b5abb..6f35001` a `main`. Antes se revisaron las líneas añadidas en busca de secretos: ninguno. Vercel: "Deployment has completed". Verificado en `https://dcarv.vercel.app`: `/login` y `/register` responden 200 con el tema nuevo; sin sesión, `/soporte/incidencias?estado=abierta` redirige a `/login?siguiente=…`, y `DELETE /api/soporte/salas/[id]` responde 401.
- CI de GitHub: fallaba desde antes de esta tarea (también en `cbb7643` y `75b5abb`) en `npm run lint`, con 39 errores `no-undef` en `scripts/*.mjs`, porque `eslint.config.mjs` solo declaraba las variables globales de Node para `.ts`/`.tsx`. Se agregó un bloque con `globals.node` para `**/*.{js,mjs,cjs}`: localmente, `npm run lint` queda sin errores.

### Mejoras técnicas y visuales de toda la página (2026-11-05)

Pedido del estudiante: mejoras visibles y útiles, técnicas y visuales, para entregar una aplicación web completa. Se respetaron el alcance (las estadísticas no pasan de la ventana de 30 días de RN-09) y las reglas de capas. No hubo cambios en el esquema de la base.

- Panel: gráfico de actividad de 30 días (reportadas y cerradas por día; `serieActividad` es una sola consulta con `UNION ALL`, y `completarSerie` rellena los días sin movimiento). Se usaron columnas agrupadas: con líneas, dos series iguales se tapaban, como se vio en la captura. Hay tooltip por día, navegación con flechas y tabla de datos. Barra segmentada del inventario (`repartirPorcentajes`: los porcentajes suman 100) y movimientos recientes (`actividadReciente`, sin tabla de auditoría: reporte y último cambio de estado). La paleta de las series se validó con el script de dataviz sobre la superficie oscura (`#bd8a1e`, `#8a78ee`: luminosidad, croma, ΔE 29 para daltonismo y contraste ≥ 3:1), sin reutilizar los colores de estado. Las cifras grandes van en sans.
- Búsqueda global (Ctrl+K o "/"): `GET /api/soporte/buscar` (4 consultas en paralelo, comodines escapados) y un combobox accesible con espera de 200 ms, cancelación (`AbortController`), teclado y enlace directo a cada caso (`/soporte/equipos/X#INC-0001`, resaltado con `:target`).
- Exportar CSV del inventario y de las incidencias con los filtros activos (`lib/csv.ts`: `;`, BOM, CRLF y neutralización de fórmulas).
- Ficha del equipo como "hoja de vida": línea de tiempo, traslado a otra sala (`trasladarEquipo`, transacción) e impresión (`@media print` en blanco y negro, sin navegación).
- Interfaz común: íconos SVG propios, encabezado compartido en todas las pestañas, notificaciones (`ProveedorAvisos`, con regiones vivas para lectores de pantalla), menú de cuenta, `/soporte/cuenta` (cambio de contraseña dentro del módulo; `/change-password` redirige ahí), `/soporte/ayuda` (flujo, estados, reglas con las cifras de `config`, atajos y preguntas frecuentes), pie de página y esqueletos de carga propios por pestaña. Cifras alineadas (`lining-nums`) en los títulos serif.
- Seguridad y SEO: encabezados HTTP (`X-Frame-Options`, CSP `frame-ancestors 'none'`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, HSTS), sin `X-Powered-By`, `robots.txt` y `sitemap.xml` con la URL real (antes `example.com`) y `noindex` en el módulo.
- Pruebas: `tests/reglas/panel.test.ts` (12 pruebas). `npm test` 84/84. `probar:mejoras` amplió a 30 OK; `probar:flujo` 14 OK; `probar:opcionales` 7 OK. Por HTTP, 36 comprobaciones de páginas, API, CSV y encabezados OK. Capturas con Edge sin interfaz (panel, búsqueda, ficha, impresión, incidencias, técnicos, salas, ayuda y celular de 390 px), sin errores de consola. Se revisaron las capturas y se corrigieron las líneas que se tapaban, las cifras antiguas de Cormorant y el ícono de la llave.

### Número de alertas del menú (2026-11-05)

Pedido del estudiante: que el número de alertas deje de salir cuando los equipos se dan de baja o cuando ya se vieron las alertas.

- Causa 1 (número viejo): el menú vive en el layout, y Next no lo vuelve a dibujar al navegar ni al refrescar tras una acción (`useRefrescar`). Ahora `NavegacionSoporte` pide `/api/soporte/alertas` al cambiar de página y cuando `useRefrescar` emite `soporte:datos-cambiaron`. Si dos consultas se cruzan, vale la última.
- Causa 2 (sin "visto"): al abrir `/soporte/alertas`, `MarcarAlertasVistas` guarda en la cookie `dcarv_alertas_vistas` los códigos que había en pantalla. El número del menú y el aviso del panel cuentan solo los candidatos que no están en esa lista (`contarSinVer`, en `lib/alertasVistas.ts`, puro y con 5 pruebas). El servidor lee la cookie, así que el número sale bien desde el primer dibujo, sin parpadeo. Un candidato nuevo vuelve a mostrar el número. La cookie no es sensible (solo códigos de equipos) y está limitada a 60 códigos.
- Verificado de punta a punta con Edge sin interfaz y datos "Prueba" (borrados al final): el número aparece sin haber visto las alertas; desaparece al abrir Alertas; sigue oculto al volver y al recargar; reaparece con un candidato nuevo; y desaparece sin recargar al dar de baja ese equipo desde la tabla (8/8). `npm test` 89/89; `tsc` y ESLint sin errores.

### Acabado profesional (2026-11-05)

Pedido del estudiante: que la página se vea más profesional. Solo cambios de presentación; sin cambios de datos ni de reglas.

- Acceso (login, registro, recuperación): pantalla dividida en escritorio, con un panel de marca a la izquierda (qué hace el sistema, cuatro funciones con íconos y el crédito del proyecto) y el formulario a la derecha. En celular, solo el formulario.
- Navegación: barra de progreso dorada arriba al cambiar de página (`BarraProgreso`: el App Router no tiene eventos de navegación, así que se detectan los clics en enlaces internos, los formularios GET y los avisos de `router.push`) y una entrada suave en cada página (`TransicionPagina`, que solo cambia de clave con la ruta para no reiniciar formularios tras una acción).
- Componentes: insignias de estado con punto de color, listas desplegables con flecha propia y versión compacta en tablas, diálogos con botón ✕ y animación, migas de pan con chevrones y estados vacíos con ícono.
- Incidencias: listado compacto con divisores (ícono del estado, caso, insignia, equipo, descripción y una línea de datos con fecha, técnico y plazo de reasignación). La ficha del equipo conserva la línea de tiempo.
- Técnicos: avatar con iniciales, cifras en recuadros y barra de carga relativa.
- Marca y detalles: favicon con el monograma dorado (antes el ícono azul de la plantilla), 404 y error 500 con la identidad de la app, fecha larga en el panel ("jueves, 5 de noviembre de 2026") y sin el botón flotante de desarrollo de Next (`devIndicators: false`).
- Defecto encontrado en las capturas y corregido: la animación de entrada dejaba un `transform` aplicado (`fill-mode: both`) y el fondo de los diálogos no cubría la barra superior. Ahora es `backwards`.
- Verificado con capturas en Edge (login de escritorio y de celular, panel, incidencias, técnicos, diálogo y 404), sin errores de consola. `npm test` 89/89; `tsc` y ESLint sin errores.

### Publicación (2026-11-05)

- A pedido del estudiante, dos commits sobre `main`: `517a21b` (corrección del CI en `eslint.config.mjs`) y `5b9b676` (las tres rondas de mejoras). Push `6f35001..5b9b676`. Antes se revisaron las líneas añadidas en busca de secretos: ninguno.
- GitHub Actions: por primera vez todos los pasos en verde (lint, type-check, test y build).
- Vercel: "Deployment has completed". Verificado en `https://dcarv.vercel.app`: `/login` responde 200 con la pantalla dividida; encabezados de seguridad presentes; sin sesión, `/soporte/alertas` redirige a `/login?siguiente=…` y `/api/soporte/buscar` responde 401; `robots.txt` con la URL real; favicon dorado; 404 con la identidad de la app.
### Registro sin correo de confirmación (2026-11-05)

Reporte del estudiante: al crear una cuenta, la app decía "Te enviamos un correo para confirmar", el correo nunca llegaba y no se podía entrar.

- Causa: el registro usaba `supabase.auth.signUp`, que exige confirmar el correo. Supabase sí intentaba enviarlo (`confirmation_sent_at` lleno en `auth.users`), pero su servicio de correo integrado es solo para pruebas: entrega únicamente a los miembros del equipo del proyecto y unos pocos por hora. Resend tampoco sirve: sin un dominio verificado (no hay `RESEND_FROM` en Vercel) solo entrega al dueño de la cuenta de Resend. El proyecto no tiene hoy ningún canal que llegue a cualquier correo. Además, el login respondía "Correo o contraseña incorrectos" a una cuenta sin confirmar.
- Corrección: `POST /api/auth/register` crea la cuenta con la API de administración ya confirmada (`email_confirm: true`) e inicia la sesión; la página de registro lleva directo a `/soporte`. Si el correo ya tiene una cuenta activa responde 409 `EMAIL_EXISTS`, sin tocarla.
- Cuentas que quedaron esperando el correo (había 1): se activan solas al volver a registrarse con ese correo (toma la contraseña nueva) o al iniciar sesión con su contraseña. Se comprobó contra Supabase que `email_not_confirmed` solo aparece cuando la contraseña es correcta; con una equivocada responde `invalid_credentials` y no se activa nada.
- Archivos: nuevo `src/lib/auth/acceso.ts` (inicio de sesión, cookie y activación, compartidos por login y registro); `src/app/api/auth/login/route.ts` y `src/app/api/auth/register/route.ts` lo usan; `src/app/(auth)/register/page.tsx` sin el mensaje del correo. Pruebas nuevas: `register/route.test.ts` (5) y `lib/auth/acceso.test.ts` (4).
- Verificación: `npm test` 98/98, `tsc` y ESLint sin errores. Con `next dev` contra la base real: 14/14 comprobaciones HTTP (registro nuevo con sesión y acceso a `/soporte`, correo repetido, cuenta pendiente con clave buena y mala, registro sobre una pendiente, datos inválidos) y el formulario en Edge sin interfaz (lleva al panel; el correo repetido muestra el aviso), sin errores de consola. Las cuentas de prueba se borraron.
- Pendiente para el estudiante: la recuperación de contraseña por correo tiene el mismo límite de Resend; para que llegue a cualquier dirección hace falta un dominio propio verificado en Resend y `RESEND_FROM` en Vercel.

### Mejoras de acceso y de cada pestaña (2026-11-05)

Pedido del estudiante: mejoras en login, crear cuenta, recuperación de contraseña, inicio y cada pestaña. Sin cambios en el esquema de la base; las estadísticas nuevas no pasan de la ventana de 30 días de RN-09 y las reglas nuevas están en `lib/reglas/` con pruebas.

- Acceso: `CampoContrasena` (mostrar u ocultar y aviso de Bloq Mayús; se oculta el botón nativo de Edge, que duplicaba el ojo) en login, registro, restablecimiento y cuenta. `MedidorContrasena` con `evaluarContrasena` (`lib/reglas/contrasena.ts`: nivel, requisitos y rechazo de contraseñas comunes o con el correo; el servidor sigue exigiendo solo 8 caracteres). Registro: aviso de que las contraseñas coinciden y, si el correo ya existe, enlaces a iniciar sesión y a recuperar. Recuperación: pantalla de confirmación con instrucciones y "Reenviar" con espera de 60 s. Botones con indicador de carga sin cambiar el texto (antes "Cargando..." / "Procesando...").
- Mi cuenta: el correo deja de ser un campo editable; muestra cuándo vence la sesión (hora de Colombia) y un botón "Cerrar sesión".
- Panel: bloque "Requiere atención" con lo pendiente de lo más antiguo a lo más reciente (`incidenciasPendientes`), en rojo lo que supera `DIAS_REASIGNACION`.
- Incidencias: filtro por sala (`salaId` en el esquema, el listado, los conteos y el CSV), "Quitar todos" los filtros y franja de resumen con los mismos filtros (`resumenCierres`: pendientes, la que más espera, cerradas y tiempo medio de cierre en 30 días). Las cerradas muestran el día de cierre y cuánto tardaron (`textoResolucion`), también en la ficha del equipo.
- Salas y Técnicos: formulario en una fila con ejemplo; cada sala enlaza a sus incidencias.
- Alertas: sección "En observación" (`listarEnObservacion`, `estaEnObservacion`: equipos a una falla del umbral; solo informa). Ayuda: dos preguntas nuevas.
- Pruebas: `tests/reglas/contrasena.test.ts` (9). `npm test` 107/107; `probar:mejoras` 35 OK (5 nuevas: sala, resumen, pendientes y observación), `probar:flujo` y `probar:opcionales` sin fallas. `tsc`, ESLint y `next build` sin errores. Capturas en Edge (escritorio y 390 px) sin errores de consola; se corrigieron el ojo duplicado, una palabra cortada en Mi cuenta y la fila de acciones de las salas. Los datos "Prueba Visual" usados para las capturas se borraron.

### Cuentas de reporte, QR, fotos, registro de cambios y freno de intentos (2026-11-05)

Pedido del estudiante: hacer las mejoras sugeridas; en la de "limitar quién se registra", que los correos que no sean @usa.edu.co sean cuentas que solo reportan fallas, sin dar de baja ni registrar salas.

- Migraciones M3 a M6 (solo agregan): `incidencias.reportado_por` y `incidencias.foto`, tablas `eventos` e `intentos_acceso` (RLS activo y permisos revocados) y el bucket privado `incidencias` de Storage (3 MB, JPG/PNG/WebP). Aplicadas con `db:migrar`; `db:verificar` sin fallas.
- Roles (`lib/auth/permisos.ts`, puro y probado): admin y editor son soporte; viewer es cuenta de reporte. El registro asigna el rol por dominio exacto (@usa.edu.co → editor). Tres barreras: el middleware (páginas y API por rol), cada ruta de gestión (`exigirSoporte`, que relee el rol en la base: quitarlo surte efecto en la siguiente acción) y las páginas (`soloSoporte`). Error nuevo `SIN_PERMISO` (403). La cuenta de prueba de la plantilla con correo example.com que era admin pasó a cuenta de reporte (queda en el registro como "El sistema").
- Cuenta de reporte: menú propio ("Reportar falla", "Mis reportes"), formulario con sala → equipo, aviso de casos sin cerrar del equipo para no duplicar, foto opcional (se reduce en el navegador) y confirmación con el número de caso. "Mis reportes" en solo lectura.
- Administración: "Cuentas y roles" (`/soporte/usuarios`, solo admin; nadie cambia su propio rol y siempre queda un admin) y "Registro de cambios" (`/soporte/actividad`, filtro por persona) más una sección en la ficha del equipo. El actor sale del contexto de la petición (`lib/auth/contexto.ts`, AsyncLocalStorage abierto por `conManejoDeErrores`); cada evento se escribe en la misma transacción que el cambio.
- Etiquetas QR (`/soporte/etiquetas`, librería `qrcode`): una por equipo en servicio; llevan a `/soporte/reportar?equipo=…`. El login y el registro conservan `?siguiente=` para volver ahí.
- Fotos: `POST/GET /api/soporte/incidencias/[numero]/foto`; tipo validado por su contenido (`lib/reglas/foto.ts`); una cuenta de reporte solo ve y sube las de sus casos; se sirven con URL firmada de 5 minutos.
- Freno de intentos (`lib/reglas/acceso.ts`): 5 fallos seguidos con el mismo correo → 15 minutos de espera (429), contados con el reloj de la base (con el del servidor web, la diferencia de relojes cambiaba la espera calculada). El login avisa cuántos intentos quedan.
- Pruebas: `npm test` 129/129 (permisos, intentos, fotos y texto del registro); `probar:mejoras` 43 OK; `probar:flujo` y `probar:opcionales` sin fallas; Playwright (`npm run e2e`, también en GitHub Actions) 10/10. Flujo HTTP real con cuentas de prueba: 29/29 (registro por dominio, reporte con foto, propiedad de las fotos, bloqueos de la cuenta de reporte, etiquetas, registro con el actor real, pérdida inmediata del rol, freno de intentos). Capturas en Edge (escritorio y 390 px) sin errores de consola. `tsc`, ESLint y `next build` sin errores.
- Pendiente para el estudiante: borrar 3 cuentas de prueba (prueba-reporte@example.com, prueba-reporte2@example.com, prueba-soporte@usa.edu.co), la foto de prueba en Storage y el evento "cambió el rol de prueba-soporte…" (la herramienta no permitió esa limpieza; los datos "Prueba" sí se borraron). Como no se verifica el correo, cualquiera puede registrarse con una dirección @usa.edu.co inventada: revisar "Cuentas y roles" y el registro de cambios.
