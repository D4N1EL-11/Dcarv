-- M12 · Mapa de cada sala.
-- Cada equipo puede tener una posición (fila y columna) dentro de su sala; cada sala, un ancho
-- (columnas del mapa). Un equipo sin posición se dibuja en el primer puesto libre
-- (lib/reglas/mapa.ts), así que los equipos anteriores aparecen sin hacer nada.

ALTER TABLE salas ADD COLUMN IF NOT EXISTS mapa_columnas smallint NOT NULL DEFAULT 6;
ALTER TABLE equipos ADD COLUMN IF NOT EXISTS fila smallint;
ALTER TABLE equipos ADD COLUMN IF NOT EXISTS columna smallint;

DO $$
BEGIN
  ALTER TABLE salas ADD CONSTRAINT salas_mapa_columnas_valido CHECK (mapa_columnas BETWEEN 2 AND 16);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Fila y columna van juntas: o las dos o ninguna.
DO $$
BEGIN
  ALTER TABLE equipos ADD CONSTRAINT equipos_posicion_valida CHECK (
    (fila IS NULL AND columna IS NULL)
    OR (fila BETWEEN 1 AND 40 AND columna BETWEEN 1 AND 16)
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Dos equipos de la misma sala no ocupan el mismo puesto. Al trasladar un equipo se borra su
-- posición (lib/datos/equipos.ts), así que no choca con los de la sala destino.
CREATE UNIQUE INDEX IF NOT EXISTS ux_equipos_puesto
  ON equipos (sala_id, fila, columna)
  WHERE fila IS NOT NULL;
