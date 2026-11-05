-- M4 · Registro de cambios: quién hizo qué y cuándo (reportes, cambios de estado, asignaciones,
-- cierres, traslados y la administración de salas, equipos y técnicos).
-- Se escribe en la misma transacción que el cambio, desde lib/datos (registrarEvento).

CREATE TABLE IF NOT EXISTS eventos (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  momento       timestamptz NOT NULL DEFAULT now(),
  actor         text        NOT NULL,           -- correo de quien actuó, o 'sistema' (cron, scripts)
  accion        text        NOT NULL,           -- p. ej. 'incidencia_reportada', 'estado_equipo'
  equipo_codigo text,
  numero_caso   text,
  detalle       text        NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS ix_eventos_equipo  ON eventos (equipo_codigo, momento DESC);
CREATE INDEX IF NOT EXISTS ix_eventos_momento ON eventos (momento DESC);

ALTER TABLE eventos ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON eventos FROM anon, authenticated;
