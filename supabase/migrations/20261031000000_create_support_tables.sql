-- M1: tablas de Soporte de Salas

CREATE TABLE IF NOT EXISTS salas (
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      VARCHAR(80)   NOT NULL,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT salas_nombre_minimo CHECK (char_length(btrim(nombre)) >= 1)   -- RN-12
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_salas_nombre ON salas (lower(btrim(nombre)));

CREATE TABLE IF NOT EXISTS equipos (
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo      VARCHAR(40)   NOT NULL,
  sala_id     UUID          NOT NULL REFERENCES salas(id) ON DELETE RESTRICT,
  estado      VARCHAR(16)   NOT NULL DEFAULT 'funcional',
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT equipos_codigo_unico  UNIQUE (codigo),                        -- RN-01
  CONSTRAINT equipos_codigo_minimo CHECK (char_length(btrim(codigo)) >= 1),-- RN-12
  CONSTRAINT equipos_estado_valido CHECK (estado IN ('funcional', 'en_reparacion', 'dado_de_baja'))  -- RN-07
);
CREATE INDEX IF NOT EXISTS idx_equipos_sala   ON equipos (sala_id);
CREATE INDEX IF NOT EXISTS idx_equipos_estado ON equipos (estado);

-- Secuencia para el número de caso legible (RN-05)
CREATE SEQUENCE IF NOT EXISTS seq_numero_caso START 1;

CREATE TABLE IF NOT EXISTS tecnicos (          -- usado por la funcionalidad opcional (F5)
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      VARCHAR(100)  NOT NULL,
  activo      BOOLEAN       NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT tecnicos_nombre_minimo CHECK (char_length(btrim(nombre)) >= 2)
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_tecnicos_nombre ON tecnicos (lower(btrim(nombre)));

CREATE TABLE IF NOT EXISTS incidencias (
  id             UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_caso    VARCHAR(16)   NOT NULL,                 -- 'INC-0001' (RN-05)
  equipo_id      UUID          NOT NULL REFERENCES equipos(id) ON DELETE RESTRICT,   -- RN-15
  descripcion    TEXT          NOT NULL,
  estado         VARCHAR(12)   NOT NULL DEFAULT 'abierta',
  tecnico_id     UUID          REFERENCES tecnicos(id) ON DELETE SET NULL,           -- opcional (F5)
  fecha          DATE          NOT NULL,                 -- fecha de reporte (RN-04)
  fecha_estado   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),   -- último cambio de estado (para RN-10)
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT incidencias_numero_unico   UNIQUE (numero_caso),
  CONSTRAINT incidencias_desc_minima    CHECK (char_length(btrim(descripcion)) >= 3),  -- RN-13
  CONSTRAINT incidencias_estado_valido  CHECK (estado IN ('abierta', 'en_revision', 'cerrada'))
);
CREATE INDEX IF NOT EXISTS idx_incidencias_equipo ON incidencias (equipo_id, created_at DESC);  -- RN-14
CREATE INDEX IF NOT EXISTS idx_incidencias_fecha  ON incidencias (fecha);
CREATE INDEX IF NOT EXISTS idx_incidencias_estado ON incidencias (estado);

CREATE OR REPLACE FUNCTION ss_actualizar_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_equipos_updated_at ON equipos;
CREATE TRIGGER trg_equipos_updated_at BEFORE UPDATE ON equipos
  FOR EACH ROW EXECUTE FUNCTION ss_actualizar_updated_at();
