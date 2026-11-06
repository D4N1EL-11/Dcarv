-- M7 · Solicitudes de acceso de soporte.
-- El correo no se verifica al registrarse, así que escribir una dirección @usa.edu.co ya no da
-- permisos de soporte por sí solo: la cuenta nace como cuenta de reporte con una solicitud
-- pendiente, y un administrador la aprueba o la rechaza en "Cuentas y roles"
-- (lib/datos/usuarios.ts). Mientras tanto, la cuenta puede reportar fallas.

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS solicitud_soporte timestamptz;

CREATE INDEX IF NOT EXISTS ix_users_solicitud_soporte
  ON public.users (solicitud_soporte)
  WHERE solicitud_soporte IS NOT NULL;

-- Las cuentas @usa.edu.co que hoy son de reporte quedan con su solicitud pendiente para que un
-- administrador decida. Las que ya son de soporte no se tocan.
UPDATE public.users
   SET solicitud_soporte = created_at
 WHERE role = 'viewer'
   AND lower(email) LIKE '%@usa.edu.co'
   AND solicitud_soporte IS NULL;
