# Fase 2 completada · Reglas de negocio

Fecha: 2026-11-04

## Archivos

- `src/lib/config/soporte.ts`: contenido exacto de la sección 10.4.
- `src/lib/reglas/`: `errores.ts`, `fechas.ts`, `equipo.ts`, `incidencia.ts`, `alertas.ts` con las firmas de la sección 10.5. Ninguna importa `pg`, red, `next` ni `process.env`; solo `hoyBogota()` usa `new Date()` como parámetro por defecto.
- `tests/reglas/`: `ayudas.ts` (`esperarCodigo`), `equipo.test.ts` (T-01 a T-06), `incidencia.test.ts` (T-07 a T-14), `alertas.test.ts` (T-15 a T-21 y una prueba adicional de `hoyBogota` con UTC-5).

## Decisiones

- T-01: `normalizarCodigo` recorta y **conserva la grafía** (`' pc-sala1-03 '` → `'pc-sala1-03'`), como dicen la sección 10.5 y el prompt P02. La prueba lo documenta.
- `vitest.config.ts` ya existía con entorno `jsdom` para las pruebas del login. No se cambió para no romperlas: los archivos de `tests/reglas/` declaran `// @vitest-environment node` y el `include` abarca `tests/**/*.test.ts`.

## Salida resumida de `npm test`

```text
 ✓ tests/reglas/equipo.test.ts (6 tests)
 ✓ tests/reglas/incidencia.test.ts (8 tests)
 ✓ tests/reglas/alertas.test.ts (8 tests)
 ✓ src/lib/__tests__/rbac.test.ts (3 tests)
 ✓ src/lib/__tests__/json-db.test.ts (3 tests)
 ✓ src/app/api/health/route.test.ts (1 test)
 ✓ src/app/api/auth/restablecer/route.test.ts (4 tests)
 ✓ src/app/api/auth/change-password/route.test.ts (8 tests)
 ✓ src/app/api/auth/recuperar/route.test.ts (5 tests)

 Test Files  9 passed (9)
      Tests  46 passed (46)
```

Las 21 pruebas T-01 a T-21 pasan (22 con la adicional de `hoyBogota`).

## Compilación

`npm run build`: éxito, código de salida 0.
