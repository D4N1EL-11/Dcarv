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
| `JWT_SECRET` | Firma de la cookie de sesión del login |
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
| `lint` / `type-check` | ESLint y verificación de tipos |

## Estructura

```text
src/
├── app/
│   ├── soporte/              # pantallas: panel, salas, equipos, incidencias, técnicos, alertas
│   ├── api/soporte/          # API protegida con sesión
│   └── api/cron/reasignar/   # reasignación automática (Vercel Cron)
├── components/
│   ├── soporte/              # componentes del módulo
│   └── ui/                   # botones, campos, insignias, modal… (sin librerías externas)
└── lib/
    ├── reglas/               # reglas de negocio puras (se prueban con Vitest)
    ├── datos/                # SQL y casos de uso con transacciones
    ├── dataService.ts        # fachada única que usan rutas y páginas
    ├── db/conexion.ts        # pool de Postgres (solo lo usa lib/datos)
    ├── validacion/           # esquemas Zod
    ├── http/                 # formato de respuestas y errores de la API
    └── auth/sesion.ts        # adaptador sobre el login existente
supabase/migrations/          # SQL de las tablas, la vista y la seguridad
scripts/                      # migrar, verificar, limpiar, demo y pruebas de flujo
tests/reglas/                 # pruebas T-01 a T-21
doc/                          # plan, prompts, estado, aceptación y checkpoints
```

## De datos.json a Postgres

El plan funcional original guardaba todo en `datos.json` con Flask. Vercel tiene un sistema de archivos efímero, así que los datos ahora viven en Postgres (Supabase). Se conservó la separación que el plan ya buscaba: datos (`lib/datos/`, antes `modelos.py`), lógica (`lib/reglas/`, antes `sistema.py`) y web (`app/`, antes `app.py`). Así las reglas se prueban sin base de datos ni interfaz.

## Seguridad

- Nunca escriba credenciales ni valores de variables en archivos del repositorio. `.env.local` está en `.gitignore`.
- Las tablas tienen RLS activo sin políticas y permisos revocados para `anon` y `authenticated`: la clave pública de Supabase no puede leerlas. Todo el acceso pasa por el servidor.
- Toda ruta `/api/soporte/*` exige sesión; sin ella responde 401.
- El SQL siempre va parametrizado y los errores internos no se muestran al usuario.

## Calidad

```bash
npm run lint
npm run type-check
npm test
npm run build
```
