# Guía de módulos

Un módulo nuevo debe vivir en `src/modules/<nombre>` y contener `types.ts`, `schema.ts`, `service.ts`, `components/` y `__tests__/`. Registra su colección JSON y su esquema en `data/_schema/registry.ts`, expón rutas desde `src/app` y reutiliza `useCollection` en componentes cliente.