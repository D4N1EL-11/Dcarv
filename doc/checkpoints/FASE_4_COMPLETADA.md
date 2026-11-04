# Fase 4 completada · Datos y API

Fecha: 2026-11-04

## Datos (P04)

- `src/lib/datos/tipos.ts`: tipos de la sección 10.6. `FilaSala` añade `funcionales`, `enReparacion` y `dadosDeBaja` para el resumen por sala del panel.
- `src/lib/datos/salas.ts`, `equipos.ts`, `incidencias.ts`, `tecnicos.ts`.
- `reportarIncidencia` sigue la sección 8.1 dentro de `conTransaccion`: valida la descripción, bloquea el equipo con `SELECT … FOR UPDATE`, inserta con `'INC-' || LPAD(nextval('seq_numero_caso')::text, 4, '0')`, estado `abierta`, `fecha = hoyBogota()`, y solo si el equipo no está `dado_de_baja` lo pasa a `en_reparacion`.
- `src/lib/dataService.ts`: fachada que reexporta las funciones y tipos del módulo.
- Scripts: `limpiar-prueba.mjs` (`db:limpiar`), `probar-flujo.ts` (`probar:flujo`, 14 pasos de la sección 16.2), `cargar-demo.ts` (`db:demo`), `probar-opcionales.ts` (`probar:opcionales`).

Excepción consciente a "solo `lib/datos/` importa `conexion.ts`": `dataService.ts` reexporta `cerrarConexion` para que los scripts puedan cerrar el pool. No expone SQL ni el pool.

## API (P05)

Rutas en `src/app/api/soporte/`: `sesion`, `salas`, `equipos`, `equipos/[codigo]`, `equipos/[codigo]/estado`, `equipos/[codigo]/incidencias`, `incidencias`, `incidencias/[numero]/cerrar` (y las opcionales de P09). Las 15 funciones exportadas llaman `await exigirSesion()` como primera instrucción, usan `conManejoDeErrores`, `await params`, `dynamic = 'force-dynamic'`, y los POST de creación responden 201.

## Verificación sin sesión (2026-11-04, servidor de producción local)

```text
GET  /api/soporte/equipos -> 401 NO_AUTORIZADO
POST /api/soporte/equipos -> 401 NO_AUTORIZADO
POST /api/soporte/salas   -> 401 NO_AUTORIZADO
```

## Verificación con sesión (2026-11-04, producción)

Por la API con sesión iniciada (detalle en `doc/ACEPTACION.md`):

| Operación | Resultado |
|---|---|
| Crear sala "Sala 2" / repetir "Sala 1" | 201 / 409 `SALA_DUPLICADA` |
| Crear equipos PC-SALA1-01 y PC-SALA1-02 / repetir código | 201 funcional / 409 `CODIGO_DUPLICADO` |
| Reportar "No enciende" | 201, `INC-0019`, equipo `en_reparacion` |
| Segunda incidencia | 201, `INC-0020`; historial `INC-0020` > `INC-0019` |
| Cambiar a funcional / a "roto" | 200 / 422 `ESTADO_INVALIDO` |
| Reportar con descripción vacía | 400 `DATOS_INVALIDOS` |
| Equipo inexistente | 404 `EQUIPO_NO_ENCONTRADO` |
| Reportar sobre un equipo dado de baja | 201, `INC-0022`; el equipo sigue `dado_de_baja` |
| Cerrar `INC-0019` | 200, `cerrada` |

## `npm run probar:flujo` (2026-11-04)

```text
OK    1. Crear sala
OK    2. Sala repetida con otra grafía
OK    3. Crear equipo funcional
OK    4. Código repetido
OK    5. Sala inexistente
OK    6. Reportar pone el equipo en reparación
OK    7. Segunda incidencia permitida
OK    8. Descripción vacía
OK    9. Equipo inexistente
OK    10. Cambiar a funcional sin secuencia
OK    11. Estado inválido
OK    12. Historial con la más reciente primero
OK    13. Equipo dado de baja sigue dado de baja al reportar
OK    14. Cerrar la primera incidencia
Fallas: 0
```

## `npm run db:demo` (2026-11-04)

```text
Borrados (Demo %): 0 incidencias, 0 equipos, 0 salas, 0 técnicos.
codigo      sala          estado          incidencias30d
DEMO-A-01   Demo Sala A   en_reparacion   3
DEMO-A-02   Demo Sala A   funcional       0
DEMO-A-03   Demo Sala A   funcional       0
DEMO-B-01   Demo Sala B   funcional       0
DEMO-B-02   Demo Sala B   en_reparacion   1
DEMO-B-03   Demo Sala B   funcional       0
```

`DEMO-A-01` queda como candidato a baja para probar las alertas.

## `npm run db:verificar` (2026-11-04)

0 fallas (objetos, restricciones, RLS en las cuatro tablas y los 7 casos de integridad). Estado final: 4 salas, 8 equipos, 8 incidencias, 1 técnico.

`npm run build` y `npm test`: éxito.
