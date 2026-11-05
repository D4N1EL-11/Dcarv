# API Reference

## Health

`GET /api/health` devuelve estado, versión, entorno, timestamp y uptime.

## Colecciones

`GET /api/data/:collection` lista registros; acepta `id`, `limit`, `offset`, `sortBy` y `sortOrder`.

`POST /api/data/:collection` crea un registro validado. `PUT` recibe `{ id, ...campos }` y `DELETE` usa `?id=`. Las respuestas exitosas tienen `{ success: true, data, timestamp }`; los errores tienen `{ success: false, error, code, timestamp }`.

## Auth

`POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` y `POST /api/auth/logout`. Login entrega una cookie `httpOnly` con duración de 24 horas.

## Soporte de Salas

Todas exigen sesión (401 `NO_AUTORIZADO` sin ella) y responden `{ ok: true, datos }` o `{ ok: false, error: { codigo, mensaje, detalles } }`. Los contratos base están en la sección 11 de `doc/PLAN_SOPORTE_SALAS.md`. Esta tabla resume las rutas agregadas o ampliadas.

| Método y ruta | Cuerpo / parámetros | Respuesta y errores |
|---|---|---|
| `GET /api/soporte/equipos` | `salaId`, `estado`, `busqueda`; `pagina` opcional | Sin `pagina`: lista. Con `pagina`: `{ filas, total, pagina, paginas, tamano }` (50 por página) |
| `GET /api/soporte/incidencias` | `estado`, `equipoCodigo`, `busqueda` (caso, código o descripción), `tecnicoId`; `pagina` opcional | Igual que equipos (25 por página) |
| `POST /api/soporte/incidencias/[numero]/cerrar` | Opcional `{ equipoFuncional: true }` | `{ cerrada, estadoEquipo, equipoReactivado }`; `INCIDENCIA_NO_ENCONTRADA` |
| `PATCH /api/soporte/salas/[id]` | `{ nombre }` | `SALA_DUPLICADA`, `SALA_NO_ENCONTRADA`, 400 si el id no es UUID |
| `DELETE /api/soporte/salas/[id]` | — | `TIENE_DEPENDENCIAS` si tiene equipos, `SALA_NO_ENCONTRADA` |
| `PATCH /api/soporte/tecnicos/[id]` | `{ nombre }` y/o `{ activo }` | `{ actualizado, actividad: { activo, reasignadas, sinReasignar } \| null }`; `TECNICO_DUPLICADO`, `TECNICO_NO_ENCONTRADO` |
| `GET /api/soporte/alertas` | — | Cada candidato trae además `ultimaFecha` y `pendientes` |