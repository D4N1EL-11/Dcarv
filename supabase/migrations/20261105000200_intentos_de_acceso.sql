-- M5 · Intentos de inicio de sesión: frenan la prueba de contraseñas por fuerza bruta.
-- Tras varios intentos fallidos seguidos con el mismo correo, el login espera unos minutos
-- (lib/reglas/acceso.ts). No se guarda la contraseña probada.

CREATE TABLE IF NOT EXISTS intentos_acceso (
  id      bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email   text        NOT NULL,
  exito   boolean     NOT NULL,
  momento timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_intentos_acceso_email ON intentos_acceso (email, momento DESC);

ALTER TABLE intentos_acceso ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON intentos_acceso FROM anon, authenticated;
