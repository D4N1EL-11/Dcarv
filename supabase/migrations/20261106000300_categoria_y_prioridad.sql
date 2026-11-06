-- M10 · Categoría y prioridad de cada incidencia.
-- Categoría: qué tipo de falla es (la elige quien reporta; soporte puede corregirla).
-- Prioridad: qué tan urgente es (la decide soporte; quien reporta no la elige).
-- Las incidencias anteriores quedan como 'otro' y 'media'.

ALTER TABLE incidencias ADD COLUMN IF NOT EXISTS categoria text NOT NULL DEFAULT 'otro';
ALTER TABLE incidencias ADD COLUMN IF NOT EXISTS prioridad text NOT NULL DEFAULT 'media';

DO $$
BEGIN
  ALTER TABLE incidencias ADD CONSTRAINT incidencias_categoria_valida
    CHECK (categoria IN ('hardware', 'software', 'red', 'perifericos', 'otro'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE incidencias ADD CONSTRAINT incidencias_prioridad_valida
    CHECK (prioridad IN ('alta', 'media', 'baja'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS ix_incidencias_categoria ON incidencias (categoria);
CREATE INDEX IF NOT EXISTS ix_incidencias_pendientes_prioridad
  ON incidencias (prioridad, fecha)
  WHERE estado <> 'cerrada';
