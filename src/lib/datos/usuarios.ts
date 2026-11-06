import type { PoolClient } from 'pg';
import { conTransaccion, consultar } from '@/lib/db/conexion';
import { esRolValido, esSoporte, nombreRol, puedeSolicitarSoporte, type Rol } from '@/lib/auth/permisos';
import { avisoSolicitudAprobada, avisoSolicitudRechazada, avisoSolicitudSoporte } from '@/lib/reglas/avisos';
import { ErrorDeNegocio } from '@/lib/reglas/errores';
import { avisarA, avisarAAdministradores } from './avisos';
import { registrarEvento } from './eventos';

// Cuentas del sistema (public.users, sincronizada con auth.users por el disparador sync_auth_user).
//
// El correo no se verifica al registrarse, así que nadie obtiene permisos de soporte por escribir
// una dirección institucional: toda cuenta nace como cuenta de reporte y, si su correo es de un
// dominio institucional (DOMINIOS_SOPORTE), queda con una solicitud que un administrador aprueba
// o rechaza (M7).

export type FilaUsuario = {
  id: string;
  email: string;
  rol: Rol;
  creado: string;
  reportes: number;
  // Desde cuándo espera la aprobación de soporte (YYYY-MM-DD, Bogotá); null si no hay solicitud.
  solicitud: string | null;
};

export function listarUsuarios(): Promise<FilaUsuario[]> {
  return consultar<FilaUsuario>(
    `SELECT u.id, u.email, u.role AS rol, to_char(u.created_at AT TIME ZONE 'America/Bogota', 'YYYY-MM-DD') AS creado,
            (SELECT COUNT(*) FROM incidencias i WHERE i.reportado_por = u.id) AS reportes,
            to_char(u.solicitud_soporte AT TIME ZONE 'America/Bogota', 'YYYY-MM-DD') AS solicitud
       FROM public.users u
      ORDER BY (u.solicitud_soporte IS NULL), (u.role = 'viewer'), u.email`,
  );
}

// Rol vigente en la base. El token de sesión guarda el rol del momento del login: las acciones
// de gestión lo comprueban aquí para que quitar el rol de soporte surta efecto de inmediato.
export async function rolActual(id: string): Promise<Rol | null> {
  const [fila] = await consultar<{ role: string }>('SELECT role FROM public.users WHERE id = $1', [id]);
  return fila && esRolValido(fila.role) ? fila.role : null;
}

export type EstadoCuenta = { rol: Rol; solicitud: string | null };

// Para "Mi cuenta": el rol vigente y, si la hay, la solicitud de soporte pendiente.
export async function estadoDeCuenta(id: string): Promise<EstadoCuenta | null> {
  const [fila] = await consultar<{ role: string; solicitud: string | null }>(
    `SELECT role, to_char(solicitud_soporte AT TIME ZONE 'America/Bogota', 'YYYY-MM-DD') AS solicitud
       FROM public.users WHERE id = $1`,
    [id],
  );
  if (!fila || !esRolValido(fila.role)) return null;
  return { rol: fila.role, solicitud: fila.solicitud };
}

type CuentaBloqueada = { email: string; role: Rol; solicitud_soporte: string | null };

async function bloquearCuenta(tx: PoolClient, id: string): Promise<CuentaBloqueada> {
  const { rows } = await tx.query<CuentaBloqueada>(
    'SELECT email, role, solicitud_soporte FROM public.users WHERE id = $1 FOR UPDATE',
    [id],
  );
  if (!rows[0]) throw new ErrorDeNegocio('USUARIO_NO_ENCONTRADO');
  return rows[0];
}

async function abrirSolicitud(tx: PoolClient, id: string, email: string): Promise<void> {
  await tx.query('UPDATE public.users SET solicitud_soporte = now(), updated_at = now() WHERE id = $1', [id]);
  await registrarEvento(tx, { accion: 'solicitud_soporte', detalle: email });
  await avisarAAdministradores(tx, avisoSolicitudSoporte(email));
}

// Registro: deja la cuenta como cuenta de reporte y, con un correo institucional, abre su
// solicitud y avisa a los administradores. Devuelve si quedó una solicitud pendiente.
export async function prepararCuentaNueva(id: string): Promise<{ solicitud: boolean }> {
  return conTransaccion(async (tx) => {
    const cuenta = await bloquearCuenta(tx, id);
    // Una cuenta que ya tenía permisos (p. ej. activada de nuevo tras quedar pendiente) no se toca.
    if (esSoporte(cuenta.role)) return { solicitud: false };
    if (!puedeSolicitarSoporte(cuenta.email)) return { solicitud: false };
    if (!cuenta.solicitud_soporte) await abrirSolicitud(tx, id, cuenta.email);
    return { solicitud: true };
  });
}

// "Mi cuenta": una cuenta de reporte con correo institucional pide (o vuelve a pedir) el acceso.
export async function solicitarSoporte(id: string): Promise<void> {
  await conTransaccion(async (tx) => {
    const cuenta = await bloquearCuenta(tx, id);
    if (esSoporte(cuenta.role)) throw new ErrorDeNegocio('DATOS_INVALIDOS', 'Su cuenta ya es de soporte.');
    if (!puedeSolicitarSoporte(cuenta.email)) {
      throw new ErrorDeNegocio('SIN_PERMISO', 'Solo las cuentas con correo institucional pueden pedir el acceso de soporte.');
    }
    if (cuenta.solicitud_soporte) return; // ya está pendiente
    await abrirSolicitud(tx, id, cuenta.email);
  });
}

// Un administrador aprueba (la cuenta pasa a "Soporte técnico") o rechaza (sigue de reporte).
// En ambos casos la solicitud se cierra y la persona recibe un aviso.
export async function decidirSolicitud(id: string, aprobar: boolean): Promise<void> {
  await conTransaccion(async (tx) => {
    const cuenta = await bloquearCuenta(tx, id);
    if (!cuenta.solicitud_soporte) throw new ErrorDeNegocio('SIN_SOLICITUD');
    const rol: Rol = aprobar ? 'editor' : cuenta.role;
    await tx.query(
      'UPDATE public.users SET role = $1, solicitud_soporte = NULL, updated_at = now() WHERE id = $2',
      [rol, id],
    );
    await registrarEvento(tx, { accion: aprobar ? 'solicitud_aprobada' : 'solicitud_rechazada', detalle: cuenta.email });
    await avisarA(tx, id, aprobar ? avisoSolicitudAprobada() : avisoSolicitudRechazada());
  });
}

// Cambio manual de rol (selector de "Cuentas y roles"). Cierra cualquier solicitud pendiente:
// el administrador ya decidió.
export async function cambiarRol(id: string, rol: Rol, quienCambia: string): Promise<void> {
  if (id === quienCambia) throw new ErrorDeNegocio('SIN_PERMISO', 'No puede cambiar el rol de su propia cuenta.');
  await conTransaccion(async (tx) => {
    const usuario = await bloquearCuenta(tx, id);
    if (usuario.role === rol) return;
    if (usuario.role === 'admin') {
      const admins = await tx.query<{ total: number }>(`SELECT COUNT(*) AS total FROM public.users WHERE role = 'admin'`);
      if ((admins.rows[0]?.total ?? 0) <= 1) {
        throw new ErrorDeNegocio('SIN_PERMISO', 'Debe quedar al menos un administrador.');
      }
    }
    await tx.query(
      'UPDATE public.users SET role = $1, solicitud_soporte = NULL, updated_at = now() WHERE id = $2',
      [rol, id],
    );
    await registrarEvento(tx, {
      accion: 'rol_cambiado',
      detalle: `${usuario.email}: ${nombreRol(usuario.role)} → ${nombreRol(rol)}`,
    });
  });
}
