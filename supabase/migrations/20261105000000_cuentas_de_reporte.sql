-- M3 · Cuentas de reporte.
-- Las cuentas @usa.edu.co son de soporte (rol admin o editor); las demás, de reporte (viewer):
-- solo reportan fallas y siguen sus propios casos (lib/auth/permisos.ts).

-- Quién reportó cada incidencia ("Mis reportes"). Las incidencias anteriores quedan en NULL.
ALTER TABLE incidencias
  ADD COLUMN IF NOT EXISTS reportado_por uuid REFERENCES public.users (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS ix_incidencias_reportado_por ON incidencias (reportado_por, created_at DESC);

-- Las cuentas @usa.edu.co que quedaron como viewer pasan a soporte. Las demás no se tocan:
-- un admin puede cambiar cualquier rol después.
UPDATE public.users
   SET role = 'editor', updated_at = now()
 WHERE role = 'viewer' AND lower(email) LIKE '%@usa.edu.co';
