-- M11 · Mantenimiento preventivo por sala.
-- Cada sala puede tener una frecuencia (cada N días). La próxima revisión se cuenta desde el último
-- mantenimiento registrado o, si aún no hay ninguno, desde el día en que se programó
-- (lib/reglas/mantenimiento.ts). Una sala sin frecuencia no tiene plan.

ALTER TABLE salas ADD COLUMN IF NOT EXISTS mantenimiento_cada_dias integer;
ALTER TABLE salas ADD COLUMN IF NOT EXISTS mantenimiento_desde date;

DO $$
BEGIN
  ALTER TABLE salas ADD CONSTRAINT salas_mantenimiento_valido
    CHECK (mantenimiento_cada_dias IS NULL OR mantenimiento_cada_dias BETWEEN 7 AND 365);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS mantenimientos (
  id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  sala_id         uuid        NOT NULL REFERENCES salas (id) ON DELETE CASCADE,
  fecha           date        NOT NULL,          -- día en que se hizo (Bogotá)
  notas           text        NOT NULL DEFAULT '',
  registrado_por  text        NOT NULL,          -- correo de quien lo registró
  creado_en       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT mantenimientos_notas_largo CHECK (char_length(notas) <= 500)
);

CREATE INDEX IF NOT EXISTS ix_mantenimientos_sala  ON mantenimientos (sala_id, fecha DESC);
CREATE INDEX IF NOT EXISTS ix_mantenimientos_fecha ON mantenimientos (fecha);

ALTER TABLE mantenimientos ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON mantenimientos FROM anon, authenticated;
