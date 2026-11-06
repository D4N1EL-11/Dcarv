# Soporte de Salas (Dcarv)

Control de calidad y soporte técnico de las salas de cómputo: inventario de equipos por sala, reporte de incidencias con número de caso, estados de los equipos e historial de fallas.

Proyecto de Lógica y Programación (SIST0200), Universidad Sergio Arboleda, Santa Marta. Plan técnico completo: [doc/PLAN_SOPORTE_SALAS.md](doc/PLAN_SOPORTE_SALAS.md).

## Funcionalidades

Módulo mínimo:

- **F1 · Inventario por sala.** Registrar salas y equipos (código único, nace "Funcional"). El panel muestra por sala cuántos equipos están funcionales, en reparación y dados de baja.
- **F2 · Reportar incidencias.** Cada reporte recibe un número de caso consecutivo (`INC-0001`, `INC-0002`, …) y pone el equipo "En reparación", salvo que esté dado de baja. Todo ocurre en una sola transacción.
- **F3 · Cambiar el estado del equipo.** Funcional, En reparación o Dado de baja, sin secuencia obligatoria. Dar de baja pide confirmación.
- **F4 · Historial.** Las incidencias de cada equipo, de la más reciente a la más antigua, con opción de cerrarlas. Además, un listado general de incidencias con filtros.

Ayudas de la interfaz:

- **Panel de disponibilidad.** Indicadores de equipos disponibles (con porcentaje), en reparación, dados de baja e incidencias pendientes; cada uno abre la lista filtrada.
- **Tarjetas de sala con barra de disponibilidad.** Al pulsar una sala, el panel muestra solo sus equipos.
- **Filtros en la URL** que se aplican al instante, con conteo de resultados y "Limpiar filtros".
- **Registro de varios equipos a la vez** (prefijo + rango, por ejemplo PC-SALA1-01 a PC-SALA1-30), con informe de los códigos repetidos.
- **Ficha del equipo** con migas de pan, resumen (incidencias de 30 días, pendientes, último reporte), aviso de candidato a baja y antigüedad de cada incidencia pendiente.
- **Incidencias por pestañas** (Todas, Abierta, En revisión, Cerrada) con su conteo.
- **Alertas accionables:** cada candidato a baja se puede revisar o dar de baja desde la misma pantalla; el menú muestra cuántos hay.
- Pantallas de carga y de error propias, título por página, ícono y enlace "Saltar al contenido".

Herramientas de trabajo:

- **Panel con gráficos.** Actividad de los últimos 30 días (incidencias reportadas y cerradas por día, en columnas, con tooltip, navegación con teclado y tabla de datos), barra del estado del inventario y movimientos recientes.
- **Búsqueda global (Ctrl+K o "/").** Encuentra equipos, casos, salas y técnicos desde cualquier pantalla y se maneja con el teclado.
- **Exportar a CSV** el inventario y las incidencias, con los filtros aplicados (listo para Excel en español).
- **Hoja de vida del equipo:** historial en línea de tiempo, traslado a otra sala e impresión en blanco y negro (o PDF).
- **Gestión completa:** renombrar y eliminar salas vacías; activar, desactivar y renombrar técnicos (al desactivar, sus casos pasan al técnico con menos carga); cerrar incidencias con confirmación y opción de dejar el equipo funcional.
- **Paginación** (50 equipos y 25 incidencias por página) y búsqueda por texto de la falla o por técnico.
- **Notificaciones** tras cada acción, menú de cuenta (cambiar contraseña), página de **Ayuda y reglas** y pie de página con la hora de Colombia.
- **Sesión vencida:** se vuelve al login y, al entrar, a la misma página.
- **Tema oscuro con acentos dorados**, adaptado a celular.

Cuentas y seguridad:

- **Dos tipos de cuenta.** Toda cuenta nueva nace como **cuenta de reporte**: reporta fallas (con foto opcional), sigue sus casos en "Mis reportes" y conversa con soporte en cada caso. No cambia estados, no da de baja ni registra salas, equipos o técnicos. Las cuentas **de soporte** gestionan todo el módulo.
- **Solicitudes de acceso de soporte.** El correo no se verifica, así que un correo @usa.edu.co no da permisos por sí solo: abre una solicitud que un administrador aprueba o rechaza en "Cuentas y roles" (con aviso a la persona). También se pide desde "Mi cuenta". Al aprobar, cambiar o quitar un rol, la sesión de esa cuenta se renueva sola en la siguiente página.
- **Etiquetas QR por equipo**, para imprimir y pegar: al escanearlas se abre el reporte con ese equipo ya elegido.
- **Fotos de la falla** en un bucket privado de Supabase Storage; se ven con URLs firmadas de pocos minutos.
- **Registro de cambios:** quién hizo qué y cuándo (reportes, estados, asignaciones, cierres, traslados, salas, técnicos y roles).
- **Freno a la fuerza bruta:** tras 5 contraseñas incorrectas seguidas con el mismo correo, el login espera 15 minutos.
- **Contraseñas:** mostrar u ocultar, aviso de Bloq Mayús y medidor de seguridad.
- **Sin clave de reserva en producción:** sin `JWT_SECRET`, la app no firma ni acepta sesiones (antes usaba una clave escrita en el código, que es público).

Seguimiento de casos (versión del 6 de noviembre de 2026):

- **Ficha de cada caso** (`/soporte/incidencias/INC-0001`): la falla, su foto, detalles, el recorrido del caso en el registro de cambios y las acciones de soporte. Una cuenta de reporte abre solo las de sus casos.
- **Conversación en cada caso** entre soporte y quien reportó ("se cambió la RAM", "falta el repuesto"). Al cerrar, soporte deja la **solución aplicada**, que queda como último comentario.
- **Avisos (campana del menú)** sin depender del correo: a quien reportó cuando su caso se asigna, se reasigna, recibe un comentario o se cierra; a soporte cuando una cuenta de reporte reporta o comenta; a los administradores cuando llega una solicitud de soporte. Página "Avisos" con filtro de sin leer.
- **Categoría y prioridad** de cada falla: quien reporta elige el tipo (hardware, software, red, periféricos u otro); soporte fija la prioridad (alta, media, baja). "Requiere atención" pone primero la alta; el listado filtra por ambas y el CSV las incluye.
- **Mantenimiento preventivo** por sala: frecuencia (cada 7 a 365 días), registro de cada revisión con notas, estado Al día / Próximo / Vencido y aviso en el Panel.
- **Informe mensual** para la coordinación: casos reportados y cerrados (con la variación frente al mes anterior), tiempo medio de cierre, porcentaje cerrado a tiempo, lo que más falla por categoría y por sala, trabajo de cada técnico, equipos con más fallas, bajas y mantenimientos. Se imprime o se guarda como PDF.
- **App instalable (PWA)** en Android, iPhone y computador: manifiesto, íconos, accesos directos y página "Sin conexión". El service worker nunca guarda datos.

Opcionales:

- **F5 · Técnicos.** Registrar técnicos y asignarlos a incidencias abiertas (pasan a "En revisión"). Las incidencias con más de 5 días sin cambio de estado se reasignan solas a otro técnico (Vercel Cron diario).
- **F6 · Alertas.** Los equipos con 3 o más incidencias en los últimos 30 días aparecen como candidatos a baja.

## Requisitos

- Node.js 20 o superior.
- Un proyecto de Supabase (Postgres) y su cadena de conexión directa.
- Acceso al login existente de la aplicación (todas las rutas `/soporte` exigen sesión).

## Cómo correrlo en local

```bash
npm install
Copy-Item .env.example .env.local   # en macOS/Linux: cp .env.example .env.local
```

Complete en `.env.local` al menos estas variables (solo se listan los nombres; los valores salen de Supabase y Vercel):

| Variable | Para qué |
|---|---|
| `Dcarv_POSTGRES_URL_NON_POOLING` | Conexión directa a Postgres en local y en los scripts `db:*` |
| `Dcarv_POSTGRES_URL` | Conexión por el pooler de transacciones en Vercel |
| `JWT_SECRET` | Firma de la cookie de sesión del login. Obligatoria en producción; en local, una clave propia distinta de la de Vercel |
| `NEXT_PUBLIC_Dcarv_DCARVSUPABASE_URL`, `NEXT_PUBLIC_Dcarv_DCARVSUPABASE_ANON_KEY`, `Dcarv_SUPABASE_SERVICE_ROLE_KEY` | Login con Supabase Auth |
| `CRON_SECRET` | Protege `/api/cron/reasignar` (solo en Vercel) |

Con un proyecto ya enlazado a Vercel, `npx vercel env pull .env.local` trae las variables.

```bash
npm run db:migrar     # crea tablas, secuencia y vista (idempotente)
npm run db:demo       # opcional: 2 salas y 6 equipos de ejemplo
npm run dev           # http://localhost:3000 → /soporte
```

## Scripts

| Script | Propósito |
|---|---|
| `dev` / `build` / `start` | Servidor de desarrollo, compilación y producción de Next.js |
| `test` / `test:ver` | Pruebas unitarias de las reglas (Vitest), una vez o en modo observación |
| `db:migrar` | Aplica en orden las migraciones de `supabase/migrations/` y las registra en `_migrations` |
| `db:verificar` | Comprueba tablas, restricciones, RLS e integridad (en una transacción que siempre se revierte) |
| `db:limpiar` | Borra los datos de prueba (`--prueba`) o de demostración (`--demo`) |
| `db:demo` | Carga datos de demostración, incluido un equipo candidato a baja |
| `probar:flujo` | Recorre los 14 pasos del flujo completo contra la base y limpia al final |
| `probar:opcionales` | Prueba técnicos, asignación, reasignación y alertas contra la base |
| `probar:mejoras` | Prueba contra la base paginación, búsquedas, cierre con reactivación, gestión de salas y técnicos, traslado, gráfico, alertas, quién reportó, registro de cambios, fotos, intentos de acceso y roles (43 comprobaciones) |
| `probar:nuevas` | Prueba contra la base solicitudes de soporte, comentarios, avisos, categoría y prioridad, mantenimiento e informe mensual |
| `e2e` | Pruebas de extremo a extremo con Playwright (acceso, barrera de permisos y app instalable, sin base de datos) |
| `lint` / `type-check` | ESLint y verificación de tipos |

## Estructura

```text
src/
├── app/
│   ├── soporte/              # pantallas: panel, salas, equipos, incidencias y ficha del caso, técnicos, alertas, mantenimiento,
│   │                         #   informe, avisos, reportar, mis reportes, etiquetas, registro, cuentas
│   ├── offline/              # página "Sin conexión" de la app instalable
│   ├── manifest.ts           # manifiesto de la app instalable (PWA)
│   ├── api/soporte/          # API protegida con sesión
│   └── api/cron/reasignar/   # reasignación automática (Vercel Cron)
├── components/
│   ├── soporte/              # componentes del módulo
│   ├── pwa/                  # registro del service worker y opción "Instalar la app"
│   └── ui/                   # botones, campos, insignias, modal… (sin librerías externas)
└── lib/
    ├── reglas/               # reglas de negocio puras (se prueban con Vitest)
    ├── datos/                # SQL y casos de uso con transacciones
    ├── dataService.ts        # fachada única que usan rutas y páginas
    ├── db/conexion.ts        # pool de Postgres (solo lo usa lib/datos)
    ├── validacion/           # esquemas Zod
    ├── http/                 # formato de respuestas y errores de la API
    └── auth/                 # sesión, permisos por rol (permisos.ts) y contexto de la petición
supabase/migrations/          # SQL de las tablas, la vista y la seguridad (M1 a M11)
public/                       # service worker (sw.js) e íconos de la app instalable
scripts/                      # migrar, verificar, limpiar, demo y pruebas de flujo
tests/reglas/                 # pruebas T-01 a T-21 y de las mejoras (npm test: 150 en total)
e2e/                          # pruebas de extremo a extremo (Playwright)
doc/                          # plan, prompts, estado, aceptación y checkpoints
```

## De datos.json a Postgres

El plan funcional original guardaba todo en `datos.json` con Flask. Vercel tiene un sistema de archivos efímero, así que los datos ahora viven en Postgres (Supabase). Se conservó la separación que el plan ya buscaba: datos (`lib/datos/`, antes `modelos.py`), lógica (`lib/reglas/`, antes `sistema.py`) y web (`app/`, antes `app.py`). Así las reglas se prueban sin base de datos ni interfaz.

## Seguridad

- Nunca escriba credenciales ni valores de variables en archivos del repositorio. `.env.local` está en `.gitignore`.
- Las tablas tienen RLS activo sin políticas y permisos revocados para `anon` y `authenticated`: la clave pública de Supabase no puede leerlas. Todo el acceso pasa por el servidor.
- Toda ruta `/api/soporte/*` exige sesión; sin ella responde 401. Los permisos por rol se comprueban en el middleware y otra vez en cada ruta (`exigirSoporte`, que lee el rol vigente de la base); una cuenta de reporte recibe 403.
- Sin correo verificado, cualquiera puede registrarse con una dirección @usa.edu.co inventada; por eso esa dirección solo abre una solicitud, y los permisos de soporte los da un administrador después de revisarla.
- Los avisos solo enlazan dentro del módulo (restricción en la base) y cada cuenta solo lee y marca los suyos. Una cuenta de reporte que pide la conversación o la ficha de un caso ajeno recibe "no existe".
- El SQL siempre va parametrizado y los errores internos no se muestran al usuario.
- Encabezados HTTP de seguridad en todas las respuestas: `X-Frame-Options: DENY` y `frame-ancestors 'none'` (sin iframes ajenos), `nosniff`, `Referrer-Policy`, `Permissions-Policy` y HSTS; sin `X-Powered-By`.
- El regreso tras iniciar sesión solo acepta rutas internas de `/soporte` (sin redirecciones abiertas).
- Los CSV neutralizan las celdas que empiezan por `=`, `+`, `-` o `@` (inyección de fórmulas en Excel).
- El módulo no se indexa en buscadores (`robots.txt` y `noindex`).

## Calidad

```bash
npm run lint
npm run type-check
npm test
npm run build
```
