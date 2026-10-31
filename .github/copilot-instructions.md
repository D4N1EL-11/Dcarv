# Soporte de Salas · Instrucciones para Copilot

## Documentos rectores
- Plan técnico: `doc/PLAN_SOPORTE_SALAS.md`. Si una instrucción contradice el plan, prevalece el plan.
- Estado real del repositorio: `doc/ESTADO_ACTUAL.md`.
- Avance: `doc/ESTADO_EJECUCION.md`. Se actualiza al final de cada tarea.

## Stack
- Next.js App Router + TypeScript + Tailwind CSS. Despliegue en Vercel.
- Postgres de Supabase con el paquete `pg` (aún no instalado) y la variable `Dcarv_POSTGRES_URL_NON_POOLING`.
- Validación con Zod. Pruebas con Vitest.
- Login existente: Supabase Auth más JWT propio en la cookie HttpOnly `dcarv_session`; no se reescribe. Para Soporte de Salas funciona como puerta única, sin roles diferenciados.

## Convenciones
- Identificadores, comentarios, mensajes y textos de interfaz en español.
- Las rutas `app/`, `lib/` y `components/` del plan se ubican bajo `src/` en este repositorio: `src/app/`, `src/lib/` y `src/components/`.
- Reglas de negocio solo en `lib/reglas/`: funciones puras, sin pg, sin red, sin variables de entorno y sin reloj (excepto fechas.ts). Se prueban con Vitest.
- Solo `lib/datos/` importa `lib/db/conexion.ts`. Rutas y páginas importan datos únicamente desde `lib/dataService.ts`.
- Toda ruta en `app/api/soporte/` llama `await exigirSesion()` como primera instrucción.
- Al reportar una incidencia, el número de caso, la incidencia y el cambio del equipo a `en_reparacion` ocurren en una sola transacción. Un equipo `dado_de_baja` no pasa a `en_reparacion` por un reporte.
- El estado del equipo puede cambiar a cualquiera de los tres sin secuencia obligatoria.
- Entradas validadas con los esquemas de `lib/validacion/esquemas.ts`.
- Errores de negocio con `ErrorDeNegocio(codigo)`; respuestas con `lib/http/respuestas.ts`.
- El código del equipo y el nombre de la sala se normalizan antes de buscar o comparar.
- Fechas `YYYY-MM-DD` como texto entre capas. Zona horaria `America/Bogota`; "hoy" solo con `hoyBogota()`; las ventanas de días (30, 5) se calculan con `hoyBogota()`.
- En rutas dinámicas `params` es una Promise: `const { codigo } = await params`.
- SQL siempre con parámetros (`$1`, `$2`). Nunca concatenar valores.
- Un equipo no se elimina; se usa el estado `dado_de_baja`. Las incidencias no se borran.
- No instalar librerías de componentes (shadcn, MUI u otras). Usar `components/ui/`.
- Prefijo de imports para `lib`: `@/lib/...`.
- Archivo de protección de rutas: `middleware.ts` (actualmente solo cubre `/dashboard/:path*`; extender según el plan). Ruta de login: `/login`.

## Al terminar cada tarea
1. `npm run build` sin errores.
2. `npm test` sin fallas (desde que exista Vitest).
3. Actualizar `doc/ESTADO_EJECUCION.md`.
4. No hacer commit: el estudiante revisa y hace el commit.
