# Fase 7 completada · Opcionales (código)

Fecha: 2026-11-04

## F5 · Técnicos y asignación

- `src/lib/datos/tecnicos.ts`: `listarTecnicos()` (con su carga en revisión), `crearTecnico()` (`TECNICO_DUPLICADO` por `ux_tecnicos_nombre`), `asignarTecnico()` en transacción con `FOR UPDATE`: exige `abierta` (`puedeAsignarse`, RN-11, si no `INCIDENCIA_NO_ASIGNABLE`), exige técnico activo (`TECNICO_NO_ENCONTRADO`), pasa a `en_revision` y actualiza `fecha_estado`.
- Rutas: `GET`/`POST /api/soporte/tecnicos`, `POST /api/soporte/incidencias/[numero]/asignar`.
- Pantalla `/soporte/tecnicos`; selector "Asignar técnico" en `AccionesIncidencia` para incidencias abiertas (detalle del equipo y listado general).

## F5 · Reasignación automática (RN-10)

- `reasignarIncidenciasVencidas()`: toma las incidencias `en_revision` con `diasEntre(fecha_estado en hora de Bogotá, hoyBogota()) > DIAS_REASIGNACION` y las pasa al técnico activo con menos casos en revisión, distinto del actual. Si no hay otro técnico activo, la deja como está.
- **Mecanismo elegido: Vercel Cron.** `vercel.json` llama `GET /api/cron/reasignar` todos los días a las 13:00 UTC (8:00 en Bogotá). La ruta exige `Authorization: Bearer <CRON_SECRET>`; el secreto vive solo en las variables de Vercel. **Hay que crear `CRON_SECRET` en Vercel** para que funcione.

## F6 · Alertas de candidatos a baja (RN-09)

- `esCandidatoABaja` con T-19 a T-21 en verde.
- `listarCandidatosABaja()`: equipos no dados de baja, cuenta las incidencias con `dentroDeVentana(fecha, hoyBogota(), 30)` y devuelve las que llegan a 3.
- `GET /api/soporte/alertas`, pantalla `/soporte/alertas` con `PanelAlertas`, y aviso en el panel principal con enlace cuando hay candidatos.

## Verificación

- `npm test`, `npm run build`: éxito. `GET /api/cron/reasignar` sin secreto → 401.
- En producción, con sesión (2026-11-04): técnico "Técnico Aceptación" creado; asignado a `INC-0020`, que pasó a `en_revision`; volver a asignarla → 409 `INCIDENCIA_NO_ASIGNABLE`. PC-SALA1-01, con 3 incidencias, aparece en `/api/soporte/alertas` y en `/soporte/alertas`, y el panel muestra el aviso. A-15 y A-16 cumplen (`doc/ACEPTACION.md`).
- `CRON_SECRET` creado en Vercel (Production, sensible, 64 caracteres aleatorios) el 2026-11-04. Desplegado a producción; `vercel crons ls` muestra `/api/cron/reasignar` con `0 13 * * *`. Sin el secreto, la ruta responde 401.
- `npm run probar:opcionales` (2026-11-04):

```text
OK    Técnico duplicado rechazado
OK    Asignar pasa a en revisión con técnico
OK    Asignar una en revisión falla
OK    Sin vencidas no reasigna
OK    Vencida reasignada a otro técnico
OK    Dos incidencias no son alerta
OK    Tres incidencias generan alerta
Fallas: 0
```
