-- M8 · Comentarios de cada incidencia: el técnico anota el avance ("se cambió la RAM", "falta el
-- repuesto") y quien reportó la falla lo lee y responde desde "Mis reportes".
-- tipo 'cierre': la nota de solución que se deja al cerrar el caso (misma transacción del cierre).

CREATE TABLE IF NOT EXISTS comentarios (
  id             bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  incidencia_id  uuid        NOT NULL REFERENCES incidencias (id) ON DELETE CASCADE,
  autor_id       uuid        REFERENCES public.users (id) ON DELETE SET NULL,
  autor          text        NOT NULL,          -- correo de quien escribió; se conserva si la cuenta se borra
  de_soporte     boolean     NOT NULL,          -- escribió como soporte (si no, es quien reportó)
  tipo           text        NOT NULL DEFAULT 'comentario',
  texto          text        NOT NULL,
  creado_en      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT comentarios_tipo_valido  CHECK (tipo IN ('comentario', 'cierre')),
  CONSTRAINT comentarios_texto_valido CHECK (char_length(btrim(texto)) BETWEEN 2 AND 1000)
);

CREATE INDEX IF NOT EXISTS ix_comentarios_incidencia ON comentarios (incidencia_id, creado_en);

ALTER TABLE comentarios ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON comentarios FROM anon, authenticated;
