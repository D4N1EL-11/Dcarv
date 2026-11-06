# Changelog

## 0.5.0 - 2026-11-06

Seguridad:

- Un correo @usa.edu.co ya no da permisos de soporte por sí solo (el correo no se verifica): toda cuenta nace como cuenta de reporte y queda una solicitud que un administrador aprueba o rechaza en "Cuentas y roles". Migración M7.
- La sesión se renueva sola cuando cambia el rol en la base (aprobación, cambio o retiro de un rol), sin cerrar sesión.
- En producción, sin `JWT_SECRET` la app no firma ni acepta sesiones: se quitó la clave de reserva escrita en el código.
- Comentarios y reportes leen el rol vigente en la base, no el del token.

Limpieza:

- Se borró el código de la plantilla que el módulo no usaba: notas, `/dashboard`, `/users`, `/status`, `/change-password` (redirige a Mi cuenta), `/api/data`, `/api/admin/users`, `/api/auth/me`, el motor JSON (`data/`, `json-db`, `rbac`), el tema claro/oscuro sin uso y componentes duplicados (`button`, `card`, `badge`…). Dependencias quitadas: `bcryptjs`, `framer-motion`, `@vercel/kv`.

Funcionalidades:

- Ficha de cada caso con conversación entre soporte y quien reportó, y nota de solución al cerrar. Migración M8.
- Avisos dentro de la app (campana del menú y página "Avisos"). Migración M9.
- Categoría y prioridad de cada incidencia, con filtros, orden de atención y columnas en el CSV. Migración M10.
- Mantenimiento preventivo por sala, con aviso en el Panel. Migración M11.
- Informe mensual imprimible para la coordinación.
- App instalable (PWA): manifiesto, íconos, accesos directos, service worker sin datos y página "Sin conexión".

Pruebas: 150 unitarias, `probar:nuevas` contra la base y 15 de extremo a extremo.

## 0.4.0 - 2026-11-05

Cuentas de reporte, etiquetas QR, fotos de la falla, registro de cambios y freno de intentos en el login.

## 0.3.0 - 2026-11-04

Tema oscuro con dorado, panel con gráficos, búsqueda global, exportar CSV y cierre del plan P02 a P09.

## 0.2.0 - 2026-10-31

Módulo Soporte de Salas: datos, API e interfaz.

## 0.1.0 - 2026-09-12

- Scaffolding Next.js TypeScript.
- Motor JSON-DB con CRUD, backups y validación Zod.
- UI, temas, dashboard, notas y autenticación JWT.
