# Aceptación · Soporte de Salas

Pruebas de aceptación de la sección 16.3 del plan, ejecutadas **en producción** (`https://dcarv.vercel.app`) el 2026-11-04 con sesión iniciada (salvo A-01).

**Método:** peticiones HTTP con la cookie de sesión obtenida en `/api/auth/login`. Se usó la API de `/api/soporte` y se revisó el HTML que el servidor genera para `/soporte`, `/soporte/equipos/[codigo]` y `/soporte/alertas`. No se usó un navegador, así que los elementos que solo existen en el cliente (por ejemplo, el modal de confirmación de A-09) se verificaron en el código.

| ID | Acción | Resultado esperado | Resultado obtenido | Evidencia | Observación |
|---|---|---|---|---|---|
| A-01 | Abrir `/soporte` sin sesión | Redirección al login | Cumple | `GET /soporte` → 307 `/login`; `/api/soporte/sesion` → 401 | |
| A-02 | Crear la sala "Sala 1" y la sala "Sala 2" | Aparecen con 0 equipos | Cumple | "Sala 1" → 409 `SALA_DUPLICADA`; "Sala 2" → 201; listado: "sala 1" y "Sala 2" con 0 equipos | Ya existía "sala 1" (minúscula). El 409 es correcto: los nombres no distinguen mayúsculas (`ux_salas_nombre`). Se usó la sala existente |
| A-03 | Registrar "PC-SALA1-01" y "PC-SALA1-02" en Sala 1 | Aparecen como funcionales; Sala 1 muestra 2 equipos | Cumple | Ambos POST → 201; los dos `funcional`; la sala muestra 2 equipos | |
| A-04 | Registrar "PC-SALA1-01" otra vez | Rechazo por código duplicado | Cumple | 409 `CODIGO_DUPLICADO`: "Ya existe un equipo con ese código." | |
| A-05 | Reportar "No enciende" en "PC-SALA1-01" | Incidencia con número de caso; el equipo pasa a "En reparación" | Cumple | 201, caso `INC-0019` abierta; equipo `en_reparacion` | |
| A-06 | Reportar una segunda incidencia en el mismo equipo | Se permite; ambas en el historial | Cumple | 201, caso `INC-0020` | RN-08 |
| A-07 | Ver el historial de "PC-SALA1-01" | Dos incidencias, la más reciente primero | Cumple | API: `INC-0020` > `INC-0019`; en la página del equipo `INC-0020` aparece antes | RN-14 |
| A-08 | Cambiar "PC-SALA1-01" a "Funcional" | Estado actualizado sin exigir cerrar la incidencia | Cumple | PATCH → 200; `funcional` con 2 incidencias aún abiertas | RN-07 |
| A-09 | Cambiar "PC-SALA1-02" a "Dado de baja" | Estado actualizado (con confirmación) | Cumple | PATCH → 200; `dado_de_baja` | La confirmación es un modal del navegador (`SelectorEstadoEquipo`, texto de la sección 12.1); verificada en el código |
| A-10 | En el panel, filtrar por estado "Funcional" | Muestra solo los funcionales | Cumple | `/soporte?estado=funcional` muestra PC-SALA1-01 y oculta PC-SALA1-02 y PC-DBG | |
| A-11 | En el panel, ver el resumen de Sala 1 | Cuántos funcionales, en reparación y dados de baja | Cumple | "sala 1": 1 funcional, 0 en reparación, 1 dado de baja; el resumen aparece en `/soporte` | |
| A-12 | Reportar con descripción vacía | Rechazo con mensaje | Cumple | 400 `DATOS_INVALIDOS`: "Revise los datos ingresados." | En la interfaz el formulario además muestra "La descripción debe tener al menos 3 caracteres." |
| A-13 | Cerrar una incidencia | Pasa a "Cerrada" | Cumple | `INC-0019` → 200, estado `cerrada` | |
| A-14 | Cerrar el navegador y volver a entrar | Los datos persisten (base de datos, no JSON) | Cumple | Sesión nueva (login 200): PC-SALA1-01 sigue `funcional` con 2 incidencias | |
| A-15 | (Opcional) Registrar un técnico y asignarlo a una incidencia abierta | La incidencia pasa a "En revisión" con el técnico | Cumple | Técnico "Técnico Aceptación" → 201; asignar `INC-0020` → 200, queda `en_revision` con ese técnico; asignarla otra vez → 409 `INCIDENCIA_NO_ASIGNABLE` | RN-11 |
| A-16 | (Opcional) Generar 3 incidencias en un equipo y ver alertas | El equipo aparece como candidato a baja | Cumple | Tercera incidencia `INC-0021`; `/api/soporte/alertas`: PC-SALA1-01 (3); aparece en `/soporte/alertas` y el panel muestra el aviso | RN-09 |

## Comprobaciones adicionales en producción

| Comprobación | Resultado |
|---|---|
| Reportar sobre un equipo dado de baja (paso 13 de `probar:flujo`, sección 4.4) | `INC-0022` sobre PC-SALA1-02 → 201; el equipo **sigue** `dado_de_baja` |
| Estado inválido ("roto") | 422 `ESTADO_INVALIDO` |
| Equipo inexistente (consultar y reportar) | 404 `EQUIPO_NO_ENCONTRADO` |
| `/api/soporte/sesion` con sesión | 200 con el correo del usuario |
| Redirección tras el login | El paquete de `/login` en producción ejecuta `router.replace("/soporte")` |

## Datos que quedaron en producción

Por A-14 (persistencia), los datos se conservan: la sala "Sala 2", los equipos PC-SALA1-01 (en reparación, candidato a baja) y PC-SALA1-02 (dado de baja) en "sala 1", las incidencias `INC-0019` a `INC-0022` y el técnico "Técnico Aceptación". La sala de depuración "Prueba Dbg" (con PC-DBG) se borró después, con la limpieza `--prueba` de los scripts. Además, `npm run db:demo` cargó "Demo Sala A" y "Demo Sala B" con 6 equipos; DEMO-A-01 es candidato a baja.
