import { z } from 'zod';
import { exigirSoporte } from '@/lib/auth/sesion';
import { cambiarRol } from '@/lib/dataService';
import { conManejoDeErrores, leerCuerpo, responderOk } from '@/lib/http/respuestas';
import { ErrorDeNegocio } from '@/lib/reglas/errores';
import { esquemaId } from '@/lib/validacion/esquemas';

export const dynamic = 'force-dynamic';

type Contexto = { params: Promise<{ id: string }> };

const esquemaRol = z.object({ rol: z.enum(['admin', 'editor', 'viewer']) });

// Solo un administrador cambia roles. Nadie cambia el suyo y siempre queda al menos un admin.
export const PATCH = conManejoDeErrores(async (request, { params }: Contexto) => {
  const sesion = await exigirSoporte();
  if (sesion.rol !== 'admin') throw new ErrorDeNegocio('SIN_PERMISO', 'Solo un administrador puede cambiar roles.');
  const id = esquemaId.parse((await params).id);
  const { rol } = esquemaRol.parse(await leerCuerpo(request));
  await cambiarRol(id, rol, sesion.id);
  return responderOk({ actualizado: true });
});
