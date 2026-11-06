# Cómo agregar una funcionalidad

El módulo Soporte de Salas separa las capas como el plan funcional original (datos, lógica y web). Una funcionalidad nueva recorre las mismas capas, en este orden:

1. **Migración** en `supabase/migrations/AAAAMMDDHHMMSS_nombre.sql`. Solo agrega (columnas con valor por defecto, tablas nuevas), activa RLS y revoca permisos a `anon` y `authenticated`. Se aplica con `npm run db:migrar`.
2. **Regla de negocio pura** en `src/lib/reglas/` (sin base, sin red) con su prueba en `tests/reglas/`.
3. **Acceso a datos** en `src/lib/datos/`: SQL parametrizado con `crearParametros`, transacción con `conTransaccion` cuando hay más de una escritura, `registrarEvento` para el registro de cambios y, si corresponde, un aviso con `avisarA` / `avisarASoporte` en la misma transacción.
4. **Fachada**: se exporta desde `src/lib/dataService.ts`; rutas y páginas solo importan de ahí.
5. **Validación** con Zod en `src/lib/validacion/esquemas.ts`.
6. **Ruta API** en `src/app/api/soporte/...` envuelta en `conManejoDeErrores`, con `exigirSoporte()` (gestión) o `exigirSesionVigente()` (cualquier cuenta, con el rol leído de la base).
7. **Permisos**: si una cuenta de reporte debe usarla, se agrega a `API_REPORTE` o a las páginas de `src/lib/auth/permisos.ts`, con su prueba en `tests/reglas/permisos.test.ts` y en `e2e/permisos.spec.ts`.
8. **Página** en `src/app/soporte/...` (componente de servidor) y componentes en `src/components/soporte/` (los interactivos con `'use client'` y `useRefrescar` tras escribir).
9. **Prueba contra la base** en un script `scripts/probar-*.ts` con datos que empiecen por "Prueba" (los borra `npm run db:limpiar -- --prueba`).
10. **Documentación**: `README.md`, `docs/api.md`, la página de Ayuda y una sección nueva en `doc/ESTADO_EJECUCION.md`.
