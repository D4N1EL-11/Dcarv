# API Reference

## Health

`GET /api/health` devuelve estado, versión, entorno, timestamp y uptime.

## Auth

`POST /api/auth/register`, `POST /api/auth/login` y `POST /api/auth/logout`. El login entrega una cookie `httpOnly` (`dcarv_session`) con duración de 24 horas, firmada con `JWT_SECRET`; en producción, sin esa variable la app no acepta ni firma sesiones.

- `POST /api/auth/register` `{ email, password }`: toda cuenta nace como **cuenta de reporte**. Con un correo @usa.edu.co además queda una solicitud de acceso de soporte que aprueba un administrador. Responde `{ success, data: { …usuario, sesionIniciada, rol, solicitud } }`.
- `POST /api/auth/sesion`: vuelve a firmar la sesión con el rol vigente en la base (lo llama el módulo cuando un administrador aprueba o cambia un rol). 401 sin sesión o si la cuenta ya no existe (borra la cookie).
- `POST /api/auth/recuperar`, `POST /api/auth/restablecer`, `POST /api/auth/change-password`: recuperación y cambio de contraseña.

## Soporte de Salas

Todas exigen sesión (401 `NO_AUTORIZADO` sin ella) y responden `{ ok: true, datos }` o `{ ok: false, error: { codigo, mensaje, detalles } }`. Los contratos base están en la sección 11 de `doc/PLAN_SOPORTE_SALAS.md`. Las rutas de gestión responden 403 `SIN_PERMISO` a una cuenta de reporte; las marcadas con **(todas)** las usa cualquier cuenta.

| Método y ruta | Cuerpo / parámetros | Respuesta y errores |
|---|---|---|
| `GET /api/soporte/equipos` **(todas)** | `salaId`, `estado`, `busqueda`; `pagina` opcional | Sin `pagina`: lista. Con `pagina`: `{ filas, total, pagina, paginas, tamano }` (50 por página) |
| `POST /api/soporte/equipos/[codigo]/incidencias` **(todas)** | `{ descripcion, categoria?, prioridad? }` | 201 `{ incidencia, estadoEquipo }`. `categoria`: `hardware`, `software`, `red`, `perifericos`, `otro` (por defecto `otro`). `prioridad` (`alta`, `media`, `baja`) solo cuenta si reporta soporte; si no, `media` |
| `GET /api/soporte/incidencias` | `estado`, `equipoCodigo`, `busqueda`, `tecnicoId`, `salaId`, `categoria`, `prioridad`; `pagina` opcional | Igual que equipos (25 por página). Cada fila trae `categoria`, `prioridad` y `comentarios` |
| `PATCH /api/soporte/incidencias/[numero]` | `{ categoria?, prioridad? }` (al menos uno) | `{ categoria, prioridad }`; queda en el registro de cambios. `INCIDENCIA_NO_ENCONTRADA`, 400 si el número no es `INC-0000` |
| `POST /api/soporte/incidencias/[numero]/cerrar` | Opcional `{ equipoFuncional: true, nota: "…" }` | `{ cerrada, estadoEquipo, equipoReactivado }`. La `nota` (2 a 1000 caracteres) queda como comentario de cierre y le llega a quien reportó |
| `GET /api/soporte/incidencias/[numero]/comentarios` **(todas)** | — | Conversación del caso, de la más antigua a la más reciente. Una cuenta de reporte solo ve sus casos (los ajenos responden 404) |
| `POST /api/soporte/incidencias/[numero]/comentarios` **(todas)** | `{ texto }` (2 a 1000 caracteres) | 201 con el comentario. Avisa a la otra parte. `INCIDENCIA_CERRADA` (409) si el caso está cerrado |
| `GET /api/soporte/avisos` **(todas)** | `limite` (1 a 50), `antesDe` (id), `soloSinLeer=1` | `{ sinLeer, avisos: [{ id, tipo, titulo, detalle, enlace, momento, leido }] }`, solo de la cuenta que pregunta |
| `POST /api/soporte/avisos/leidos` **(todas)** | Opcional `{ ids: [..] }`; sin cuerpo, todos | `{ marcados, sinLeer }`; nunca toca avisos de otra cuenta |
| `POST /api/soporte/cuenta/solicitud` **(todas)** | — | 201: pide el acceso de soporte (solo correo @usa.edu.co; si no, `SIN_PERMISO`) y avisa a los administradores |
| `POST /api/soporte/usuarios/[id]/solicitud` | `{ aprobar: boolean }` (solo administradores) | Aprobar → Soporte técnico; rechazar → sigue de reporte. Avisa a la persona. `SIN_SOLICITUD` (409) si no había una pendiente |
| `PATCH /api/soporte/usuarios/[id]` | `{ rol }` (solo administradores) | Cambia el rol y cierra cualquier solicitud pendiente. Nadie cambia el suyo; siempre queda un administrador |
| `GET /api/soporte/mantenimiento` | — | `{ plan: [{ salaId, sala, cadaDias, desde, ultimo, proximo, estado, … }], historial }`; `estado`: `vencido`, `proximo`, `al_dia`, `sin_plan` |
| `POST /api/soporte/mantenimiento` | `{ salaId, fecha: 'AAAA-MM-DD', notas? }` | 201 `{ id }`. `DATOS_INVALIDOS` si la fecha es futura o de hace más de un año |
| `POST /api/soporte/mantenimiento/plan` | `{ salaId, cadaDias }` (7 a 365) o `{ salaId, cadaDias: null }` | Programa o quita el plan de la sala |
| `PATCH /api/soporte/salas/[id]` | `{ nombre }` | `SALA_DUPLICADA`, `SALA_NO_ENCONTRADA`, 400 si el id no es UUID |
| `DELETE /api/soporte/salas/[id]` | — | `TIENE_DEPENDENCIAS` si tiene equipos, `SALA_NO_ENCONTRADA` |
| `PATCH /api/soporte/tecnicos/[id]` | `{ nombre }` y/o `{ activo }` | `{ actualizado, actividad: { activo, reasignadas, sinReasignar } \| null }`; `TECNICO_DUPLICADO`, `TECNICO_NO_ENCONTRADO` |
| `GET /api/soporte/alertas` | — | Cada candidato trae además `ultimaFecha` y `pendientes` |
| `GET /api/soporte/buscar?q=` | `q` de 2 a 60 caracteres | `{ equipos, incidencias, salas, tecnicos }`, 5 de cada uno; 400 si `q` es muy corto |
| `PATCH /api/soporte/equipos/[codigo]` | `{ salaId }` | Traslada el equipo: `{ sala }`; `EQUIPO_NO_ENCONTRADO`, `SALA_NO_ENCONTRADA` |
| `GET /api/soporte/exportar/equipos` | Mismos filtros que el panel | CSV (`;`, BOM UTF-8, CRLF), `equipos-AAAA-MM-DD.csv`, hasta 5000 filas |
| `GET /api/soporte/exportar/incidencias` | Mismos filtros que el listado | CSV con prioridad, tipo de falla, quién reportó y número de comentarios; hasta 5000 filas |

## App instalable

- `GET /manifest.webmanifest`: nombre, colores, íconos (192, 512 y *maskable*) y accesos directos.
- `GET /sw.js`: service worker. Solo guarda la página `/offline` (con sus estilos) y los íconos; nunca páginas con datos ni respuestas de la API. Se sirve con `Cache-Control: no-cache`.
- `GET /offline`: página "Sin conexión", pública y estática; funciona sin JavaScript.
