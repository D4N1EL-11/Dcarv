# Fase 6 completada · Revisión y pruebas

Fecha: 2026-11-04

## Revisión contra las secciones 8.1 y 15 (P08 TAREA 4)

| Comprobación | Resultado |
|---|---|
| Reporte transaccional con número de caso por secuencia | Cumple: `reportarIncidencia` en `conTransaccion` con `nextval('seq_numero_caso')` |
| Equipo dado de baja no pasa a `en_reparacion` al reportar | Cumple: condición explícita; lo cubre el paso 13 de `probar:flujo` |
| Rutas `/api/soporte/*` sin `exigirSesion` | Ninguna: las 15 funciones lo llaman primero; además el middleware cubre `/api/soporte/:path*` |
| "Hoy" con `new Date()` fuera de `fechas.ts` | Ninguno en `lib/reglas`, `lib/datos`, `app/soporte`, `app/api/soporte` ni `components/soporte` |
| SQL concatenado con valores | Ninguno. Los únicos `${…}` en SQL son fragmentos fijos y la constante `LIMITE_LISTADO` |
| Textos en inglés en la interfaz del módulo | Ninguno |
| Estado comunicado solo con color | No: `Insignia` siempre lleva texto |

## Credenciales (P08 TAREA 8)

- `.env.local` está cubierto por `.env*.local` y `.env*` en `.gitignore`.
- La regla `.env*` también ocultaba `.env.example`; se añadió `!.env.example` para versionarlo. Se revisó antes: solo contiene marcadores y valores inocuos (`development`, nombre y versión de la app).
- `.env.example` ahora lista (vacías) `Dcarv_POSTGRES_URL` y `Dcarv_POSTGRES_URL_NON_POOLING`.
- El repositorio local no es un repositorio git en este equipo, así que no se pudo revisar con `git ls-files`; la búsqueda de valores reales se hizo en P00.

## Pruebas

- `npm test`: 46/46 (incluidas T-01 a T-21).
- `npm run build`: éxito.
- `npm run probar:flujo` y `npm run db:limpiar -- --prueba`: **pendientes**; requieren `.env.local`.

## Aceptación

`doc/ACEPTACION.md` creado con A-01 a A-16. A-01 a A-14 se ejecutan en el despliegue de Vercel.

## README

Reescrito para Soporte de Salas: funcionalidades, requisitos, instalación, variables (solo nombres), scripts, estructura, el paso de `datos.json` a Postgres y notas de seguridad.
