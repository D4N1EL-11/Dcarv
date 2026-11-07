# Changelog

## 0.6.0 - 2026-11-07

Funcionalidades:

- Mapa de cada sala (`/soporte/mapa`): los equipos en su puesto con el color de su estado; "Organizar puestos" mueve o intercambia equipos y cambia el ancho del mapa. Migración M12.
- Modo monitor (`/monitor`): pantalla sin menú para la oficina de soporte, con cifras grandes, casos pendientes y estado de las salas; se actualiza cada 30 s y tiene pantalla completa.
- Tiempos de atención (SLA): meta por prioridad (alta 24 h, media 72 h, baja 168 h), insignia en cada caso y sección en el informe mensual con el cumplimiento por prioridad y por técnico.
- Tema claro, desde el menú de usuario (se recuerda en el navegador, sin destello al cargar).
- Repuestos (`/soporte/repuestos`): existencias, mínimo y entradas; cada pieza usada en un caso se descuenta de la bodega. Aviso en el panel de lo que hay que comprar. Migración M13.
- Notificaciones push: cada aviso de la campana llega también al celular o al escritorio (solo si el cambio se confirmó). Requiere `NEXT_PUBLIC_VAPID_PUBLIC_KEY` y `VAPID_PRIVATE_KEY`. Migración M14.

Mejoras técnicas:

- `conTransaccion` admite tareas "después de confirmar" (`despuesDeConfirmar`).
- Al trasladar un equipo se libera su puesto en el mapa de la sala anterior.

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
