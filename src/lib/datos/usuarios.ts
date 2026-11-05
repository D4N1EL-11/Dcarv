import { conTransaccion, consultar } from '@/lib/db/conexion';
import { esRolValido, nombreRol, type Rol } from '@/lib/auth/permisos';
import { ErrorDeNegocio } from '@/lib/reglas/errores';
import { registrarEvento } from './eventos';

// Cuentas del sistema (public.users, sincronizada con auth.users por el disparador sync_auth_user).

export type FilaUsuario = { id: string; email: string; rol: Rol; creado: string; reportes: number };

export function listarUsuarios(): Promise<FilaUsuario[]> {
  return consultar<FilaUsuario>(
    `SELECT u.id, u.email, u.role AS rol, to_char(u.created_at AT TIME ZONE 'America/Bogota', 'YYYY-MM-DD') AS creado,
            (SELECT COUNT(*) FROM incidencias i WHERE i.reportado_por = u.id) AS reportes
       FROM public.users u
      ORDER BY (u.role = 'viewer'), u.email`,
  );
}

// Rol vigente en la base. El token de sesión guarda el rol del momento del login: las acciones
// de gestión lo comprueban aquí para que quitar el rol de soporte surta efecto de inmediato.
export async function rolActual(id: string): Promise<Rol | null> {
  const [fila] = await consultar<{ role: string }>('SELECT role FROM public.users WHERE id = $1', [id]);
  return fila && esRolValido(fila.role) ? fila.role : null;
}

export async function cambiarRol(id: string, rol: Rol, quienCambia: string): Promise<void> {
  if (id === quienCambia) throw new ErrorDeNegocio('SIN_PERMISO', 'No puede cambiar el rol de su propia cuenta.');
  await conTransaccion(async (tx) => {
    const { rows } = await tx.query<{ email: string; role: Rol }>(
      'SELECT email, role FROM public.users WHERE id = $1 FOR UPDATE',
      [id],
    );
    const usuario = rows[0];
    if (!usuario) throw new ErrorDeNegocio('USUARIO_NO_ENCONTRADO');
    if (usuario.role === rol) return;
    if (usuario.role === 'admin') {
      const admins = await tx.query<{ total: number }>(`SELECT COUNT(*) AS total FROM public.users WHERE role = 'admin'`);
      if ((admins.rows[0]?.total ?? 0) <= 1) {
        throw new ErrorDeNegocio('SIN_PERMISO', 'Debe quedar al menos un administrador.');
      }
    }
    await tx.query('UPDATE public.users SET role = $1, updated_at = now() WHERE id = $2', [rol, id]);
    await registrarEvento(tx, {
      accion: 'rol_cambiado',
      detalle: `${usuario.email}: ${nombreRol(usuario.role)} → ${nombreRol(rol)}`,
    });
  });
}
