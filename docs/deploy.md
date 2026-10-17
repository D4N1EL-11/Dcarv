# Deploy

1. Ejecuta los cuatro comandos de calidad local.
2. Importa el repositorio en Vercel con framework Next.js.
3. Configura `NEXT_PUBLIC_APP_NAME`, `NEXT_PUBLIC_APP_VERSION`, `JWT_SECRET` y las variables del proveedor de almacenamiento elegido.
4. Usa `main` como rama de producción y `develop` para previews.

## Recuperación de contraseña

Configura `APP_URL` con el origen público de la aplicación si necesitas fijarlo. En Supabase, agrega `{origen}/restablecer-contrasena` a **Authentication > URL Configuration > Redirect URLs** para cada entorno. El enlace de recuperación vuelve a esa ruta para guardar la nueva contraseña.

El filesystem de Vercel es efímero. El proyecto selecciona `VercelKVAdapter` cuando `VERCEL=1`; configura `KV_REST_API_URL` y `KV_REST_API_TOKEN` antes de habilitar escrituras en producción.