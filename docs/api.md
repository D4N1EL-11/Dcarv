# API Reference

## Health

`GET /api/health` devuelve estado, versión, entorno, timestamp y uptime.

## Colecciones

`GET /api/data/:collection` lista registros; acepta `id`, `limit`, `offset`, `sortBy` y `sortOrder`.

`POST /api/data/:collection` crea un registro validado. `PUT` recibe `{ id, ...campos }` y `DELETE` usa `?id=`. Las respuestas exitosas tienen `{ success: true, data, timestamp }`; los errores tienen `{ success: false, error, code, timestamp }`.

## Auth

`POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` y `POST /api/auth/logout`. Login entrega una cookie `httpOnly` con duración de 24 horas.