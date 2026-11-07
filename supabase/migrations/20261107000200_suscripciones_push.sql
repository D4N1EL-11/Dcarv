-- M14 · Notificaciones push (app instalada o navegador). Cada navegador donde la persona activó
-- las notificaciones guarda aquí su suscripción. Cada aviso de la campana se envía además como
-- push a las suscripciones de su destinatario (lib/datos/push.ts). Una suscripción que el
-- navegador ya no acepta (404/410) se borra sola.

CREATE TABLE IF NOT EXISTS suscripciones_push (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  usuario_id  uuid        NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  endpoint    text        NOT NULL,
  p256dh      text        NOT NULL,
  auth        text        NOT NULL,
  creado_en   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT suscripciones_push_endpoint_unico UNIQUE (endpoint),
  CONSTRAINT suscripciones_push_endpoint_https CHECK (endpoint LIKE 'https://%')
);
CREATE INDEX IF NOT EXISTS ix_suscripciones_push_usuario ON suscripciones_push (usuario_id);

ALTER TABLE suscripciones_push ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON suscripciones_push FROM anon, authenticated;
