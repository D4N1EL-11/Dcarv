-- M16 · Calificación del servicio. Al cerrarse un caso, quien lo reportó puede calificar la
-- atención de 1 a 5 estrellas, con un comentario opcional, una sola vez.

ALTER TABLE incidencias ADD COLUMN IF NOT EXISTS calificacion            smallint;
ALTER TABLE incidencias ADD COLUMN IF NOT EXISTS calificacion_comentario text;
ALTER TABLE incidencias ADD COLUMN IF NOT EXISTS calificada_en           timestamptz;

DO $$
BEGIN
  ALTER TABLE incidencias ADD CONSTRAINT incidencias_calificacion_valida CHECK (
    (calificacion IS NULL AND calificada_en IS NULL)
    OR (calificacion BETWEEN 1 AND 5 AND calificada_en IS NOT NULL AND estado = 'cerrada')
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE incidencias ADD CONSTRAINT incidencias_calificacion_comentario_largo
    CHECK (calificacion_comentario IS NULL OR char_length(calificacion_comentario) <= 500);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS ix_incidencias_calificadas ON incidencias (calificada_en) WHERE calificacion IS NOT NULL;
