-- M6 · Foto opcional de cada incidencia (por ejemplo, la pantalla con el error).
-- La imagen vive en Supabase Storage, bucket privado "incidencias"; aquí solo su ruta.
-- Se sirve con una URL firmada de corta duración tras comprobar la sesión (nunca pública).

ALTER TABLE incidencias ADD COLUMN IF NOT EXISTS foto text;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('incidencias', 'incidencias', false, 3145728, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;
