-- M9 · Avisos dentro de la app (la campana del menú). No dependen del correo: el proyecto no
-- tiene un canal que entregue a cualquier dirección. Se escriben en la misma transacción que el
-- cambio que los origina (lib/datos/avisos.ts), así que no hay aviso de un cambio revertido.

CREATE TABLE IF NOT EXISTS avisos (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  usuario_id  uuid        NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  tipo        text        NOT NULL,
  titulo      text        NOT NULL,
  detalle     text        NOT NULL DEFAULT '',
  enlace      text        NOT NULL,
  creado_en   timestamptz NOT NULL DEFAULT now(),
  leido_en    timestamptz,
  CONSTRAINT avisos_tipo_valido CHECK (tipo IN (
    'reporte_nuevo', 'caso_asignado', 'caso_reasignado', 'caso_cerrado', 'comentario',
    'solicitud_soporte', 'solicitud_aprobada', 'solicitud_rechazada'
  )),
  -- Solo enlaces dentro del módulo: un aviso nunca lleva a otro sitio.
  CONSTRAINT avisos_enlace_interno CHECK (enlace LIKE '/soporte%')
);

CREATE INDEX IF NOT EXISTS ix_avisos_usuario  ON avisos (usuario_id, creado_en DESC);
CREATE INDEX IF NOT EXISTS ix_avisos_sin_leer ON avisos (usuario_id) WHERE leido_en IS NULL;

ALTER TABLE avisos ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON avisos FROM anon, authenticated;
