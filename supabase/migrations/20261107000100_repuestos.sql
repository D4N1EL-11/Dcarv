-- M13 · Repuestos: piezas en bodega y las que se usan en cada reparación.
-- Las existencias bajan al usar un repuesto en un caso y suben al registrar una entrada
-- (lib/datos/repuestos.ts). El mínimo solo sirve para avisar que hay que comprar.

CREATE TABLE IF NOT EXISTS repuestos (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre       varchar(80) NOT NULL,
  existencias  integer     NOT NULL DEFAULT 0,
  minimo       integer     NOT NULL DEFAULT 0,
  creado_en    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT repuestos_nombre_minimo CHECK (char_length(btrim(nombre)) >= 2),
  CONSTRAINT repuestos_existencias_validas CHECK (existencias >= 0),
  CONSTRAINT repuestos_minimo_valido CHECK (minimo >= 0)
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_repuestos_nombre ON repuestos (lower(btrim(nombre)));

CREATE TABLE IF NOT EXISTS repuestos_usados (
  id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  incidencia_id   uuid        NOT NULL REFERENCES incidencias (id) ON DELETE CASCADE,
  repuesto_id     uuid        NOT NULL REFERENCES repuestos (id) ON DELETE RESTRICT,
  cantidad        integer     NOT NULL,
  registrado_por  text        NOT NULL,          -- correo de quien lo registró
  creado_en       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT repuestos_usados_cantidad_valida CHECK (cantidad BETWEEN 1 AND 100)
);
CREATE INDEX IF NOT EXISTS ix_repuestos_usados_caso  ON repuestos_usados (incidencia_id);
CREATE INDEX IF NOT EXISTS ix_repuestos_usados_fecha ON repuestos_usados (creado_en);

ALTER TABLE repuestos ENABLE ROW LEVEL SECURITY;
ALTER TABLE repuestos_usados ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON repuestos FROM anon, authenticated;
REVOKE ALL ON repuestos_usados FROM anon, authenticated;
