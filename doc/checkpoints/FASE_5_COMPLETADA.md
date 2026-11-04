# Fase 5 completada · Interfaz

Fecha: 2026-11-04

## P06 · Interfaz base, panel y salas

- Tokens de color de la sección 13 en el bloque `@theme` de `src/app/globals.css` (Tailwind 4), sin borrar estilos previos.
- `src/components/ui/`: `Boton`, `Campo`, `Selector`, `Tarjeta`, `Insignia`, `Aviso`, `Modal`, `EstadoVacio`. Conviven con los componentes en inglés del proyecto base, que no se tocaron.
- `/` redirige a `/soporte`: `redirects()` en `next.config.mjs` (307 desde el servidor) y `redirect()` de respaldo en `src/app/page.tsx`. El componente `HolaMundo` sigue en el repositorio pero ya no se usa.
- `src/app/soporte/layout.tsx` con `NavegacionSoporte` (Panel, Incidencias, Salas, Técnicos, Alertas, correo y cerrar sesión; menú en móvil).
- Panel `/soporte`: resumen por sala, `FiltrosEquipos` (en la URL), `TablaEquipos` con `SelectorEstadoEquipo` en línea y confirmación al dar de baja con el texto de la sección 12.1; tarjetas apiladas bajo 640 px.
- `/soporte/salas` con `FormularioSala` y la lista con totales.

## P07 · Registro y detalle de equipos

- `/soporte/equipos/nuevo` con `FormularioEquipo` (valida con `esquemaEquipo`, aviso con enlace si no hay salas, navega al detalle al guardar).
- `/soporte/equipos/[codigo]`: código, sala, insignia, selector de estado y conteo de incidencias de 30 días; `notFound()` si no existe.

## P08 · Incidencias e historial

- `FormularioIncidencia` en un modal con validación en vivo; tras reportar muestra el número de caso y el estado resultante del equipo.
- `HistorialIncidencias` (más reciente primero, insignia, técnico, acción "Cerrar") y `/soporte/incidencias` con filtros por estado y equipo.

## Correcciones de esta sesión

- `src/app/page.tsx`: antes mostraba `HolaMundo`; ahora redirige (P06 TAREA 3). Primero se probó con `redirect()` en la página, pero el `loading.tsx` de la raíz hace que Next responda 200 en streaming; por eso la redirección principal quedó en `next.config.mjs`.
- `FormularioIncidencia.tsx`: sangría corregida.

## Verificación

`npm run build`, `npm test` y `tsc --noEmit`: éxito. La verificación visual con datos (panel, filtros, cambio de estado, salas duplicadas, móvil) queda **pendiente del estudiante**: requiere sesión y base de datos.
