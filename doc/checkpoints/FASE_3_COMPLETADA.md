# Fase 3 completada · Servidor

Fecha: 2026-11-04

## Archivos

- `src/lib/db/conexion.ts`: pool `pg` con los parsers de la sección 10.7, `consultar`, `conTransaccion` y `cerrarConexion`. Variable: `Dcarv_POSTGRES_URL` en Vercel (pooler 6543) y `Dcarv_POSTGRES_URL_NON_POOLING` en local (5432). Quita `sslmode` de la URL para que `pg` respete `ssl: { rejectUnauthorized: false }`. Traduce los errores de Postgres con la tabla 9.4.
- `src/lib/auth/sesion.ts`: `obtenerSesion()` y `exigirSesion()` envuelven `getSession()` del login (cookie `dcarv_session`, JWT) sin modificarlo.
- `src/lib/http/respuestas.ts`: `responderOk`, `responderError`, `conManejoDeErrores`, `leerCuerpo`; todas con `Cache-Control: no-store`.
- `src/lib/validacion/esquemas.ts`: esquemas de la sección 11.4 más `esquemaFiltrosIncidencias`, con tipos `z.infer`.
- `src/lib/formato.ts`: `formatearFecha` (es-CO, medium, UTC) y etiquetas de estado reutilizando las reglas.
- `src/app/api/soporte/sesion/route.ts`: `GET` protegido que responde `{ email }`.

## Cambios en el login y la protección (diff resumido)

- `src/middleware.ts`: matcher `['/dashboard/:path*']` → `['/dashboard/:path*', '/soporte/:path*', '/api/soporte/:path*']`. Sin sesión, las páginas redirigen a `/login` y `/api/*` responde 401 con el formato de la sección 11.1.
- `src/app/(auth)/login/page.tsx:64`: `router.replace('/dashboard')` → `router.replace('/soporte')`. Ningún otro cambio en el login.

## Verificación

Servidor de producción local (`next start`), sin sesión, el 2026-11-04:

```text
GET  /soporte                -> 307 /login
GET  /soporte/equipos/PC-01  -> 307 /login
GET  /api/soporte/sesion     -> 401 {"ok":false,"error":{"codigo":"NO_AUTORIZADO","mensaje":"Debe iniciar sesión.","detalles":null}}
```

Con sesión, en producción (2026-11-04): `GET /api/soporte/sesion` → 200 `{"ok":true,"datos":{"email":"…"}}`. El paquete JavaScript de `/login` en producción ejecuta `router.replace("/soporte")` tras iniciar sesión.

`npm run build` y `npm test`: éxito.
