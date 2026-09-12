# Deploy

1. Ejecuta los cuatro comandos de calidad local.
2. Importa el repositorio en Vercel con framework Next.js.
3. Configura `NEXT_PUBLIC_APP_NAME`, `NEXT_PUBLIC_APP_VERSION`, `JWT_SECRET` y las variables del proveedor de almacenamiento elegido.
4. Usa `main` como rama de producción y `develop` para previews.

El filesystem de Vercel es efímero. El proyecto selecciona `VercelKVAdapter` cuando `VERCEL=1`; configura `KV_REST_API_URL` y `KV_REST_API_TOKEN` antes de habilitar escrituras en producción.