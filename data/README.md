# /data

Persistencia local del sistema. Cada archivo JSON representa una colección con `_meta` y `records`.

## Crear una colección

1. Crear `data/nombre.json` con la metadata y un array `records`.
2. Crear el esquema Zod en `data/_schema/nombre.schema.ts`.
3. Registrar el esquema en `data/_schema/registry.ts`.
4. Consumir `/api/data/nombre` con GET, POST, PUT y DELETE.

Las escrituras usan una cola por colección, generan backup en `_backups/` y escriben mediante archivo temporal. En producción Vercel debe configurarse un almacenamiento externo; el modo local queda protegido como solo lectura.

| Código | Significado |
| --- | --- |
| `NOT_FOUND` | Colección o registro inexistente |
| `VALIDATION_ERROR` | El payload no cumple el esquema |
| `DUPLICATE_ID` | Identificador repetido |
| `READ_ONLY` | Escrituras locales bloqueadas en producción |
| `IO_ERROR` | Fallo de lectura o escritura |