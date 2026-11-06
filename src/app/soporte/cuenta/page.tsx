import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { ChangePasswordForm } from '@/components/auth/ChangePasswordForm';
import { BotonCerrarSesion } from '@/components/soporte/BotonCerrarSesion';
import { SolicitarSoporte } from '@/components/soporte/SolicitarSoporte';
import { Aviso } from '@/components/ui/Aviso';
import { EncabezadoPagina } from '@/components/ui/Encabezado';
import { Icono, type NombreIcono } from '@/components/ui/Icono';
import { Tarjeta } from '@/components/ui/Tarjeta';
import { esRolValido, esSoporte, nombreRol, puedeSolicitarSoporte } from '@/lib/auth/permisos';
import { getSession } from '@/lib/auth/session';
import { estadoDeCuenta } from '@/lib/dataService';
import { formatearFecha, formatearHora } from '@/lib/formato';
import { hoyBogota, sumarDias } from '@/lib/reglas/fechas';

export const metadata: Metadata = { title: 'Mi cuenta' };

// Cuándo vence la sesión, en palabras: "hoy a las 3:45 p. m." o "mañana a las 9:10 a. m.".
function textoVencimiento(exp: number | undefined): string {
  if (!exp) return 'en 24 horas';
  const vence = new Date(exp * 1000);
  const hoy = hoyBogota();
  const dia = hoyBogota(vence);
  const cuando = dia === hoy ? 'hoy' : dia === sumarDias(hoy, 1) ? 'mañana' : `el ${dia}`;
  return `${cuando} a las ${formatearHora(vence)}`;
}

function Dato({ icono, etiqueta, children }: { icono: NombreIcono; etiqueta: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-borde bg-superficie-alta text-primario">
        <Icono nombre={icono} />
      </span>
      <div className="grid min-w-0 gap-0.5">
        <dt className="text-xs uppercase tracking-wider text-texto-suave">{etiqueta}</dt>
        <dd className="text-sm text-texto [overflow-wrap:anywhere]">{children}</dd>
      </div>
    </div>
  );
}

export default async function PaginaCuenta() {
  const sesion = await getSession();
  if (!sesion) redirect('/login?siguiente=%2Fsoporte%2Fcuenta');
  const inicial = sesion.email.charAt(0).toUpperCase();
  // El rol vigente (no el del token): muestra al instante una solicitud aprobada o rechazada.
  const estado = await estadoDeCuenta(sesion.userId).catch(() => null);
  const rol = estado?.rol ?? (esRolValido(sesion.role) ? sesion.role : 'viewer');
  const soporte = esSoporte(rol);
  const puedePedir = !soporte && puedeSolicitarSoporte(sesion.email);
  return (
    <>
      <EncabezadoPagina
        etiqueta="Cuenta"
        titulo="Mi cuenta"
        descripcion="Tus datos de acceso y el cambio de contraseña. La sesión dura 24 horas; al vencer se pide iniciar sesión de nuevo."
      />
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <Tarjeta className="grid gap-6">
          <div className="flex items-center gap-4">
            <span className="grid size-14 shrink-0 place-items-center rounded-full border border-primario/50 font-titulo text-2xl font-semibold text-primario">
              {inicial}
            </span>
            <div className="grid min-w-0 gap-0.5">
              <h2 className="text-2xl font-medium">Sesión activa</h2>
              <p className="text-sm text-texto-suave [overflow-wrap:anywhere]">{sesion.email}</p>
            </div>
          </div>
          <dl className="grid gap-4">
            <Dato icono="reloj" etiqueta="La sesión vence">{textoVencimiento(sesion.exp)}</Dato>
            <Dato icono="escudo" etiqueta={`Acceso · ${nombreRol(rol)}`}>
              {soporte
                ? 'Panel completo de salas, equipos, incidencias, técnicos y mantenimiento'
                : 'Reportar fallas y seguir sus casos en "Mis reportes"'}
            </Dato>
          </dl>
          {estado?.solicitud ? (
            <Aviso tipo="info">
              Su solicitud de acceso de soporte está pendiente desde el {formatearFecha(estado.solicitud)}. Un administrador la
              revisará; le llegará un aviso a la campana con la respuesta.
            </Aviso>
          ) : puedePedir ? (
            <div className="grid gap-3 rounded-lg border border-borde bg-superficie-alta/40 p-4">
              <p className="text-sm text-texto-suave">
                Su correo es institucional: puede pedir entrar al equipo de soporte. Un administrador lo aprueba.
              </p>
              <div>
                <SolicitarSoporte />
              </div>
            </div>
          ) : null}
          <div className="border-t border-borde pt-5">
            <BotonCerrarSesion />
          </div>
        </Tarjeta>
        <Tarjeta className="grid gap-5">
          <div className="grid gap-1">
            <h2 className="text-2xl font-medium">Cambiar contraseña</h2>
            <p className="text-sm text-texto-suave">
              Necesitas la contraseña actual. Elige una que no uses en otros sitios.
            </p>
          </div>
          <ChangePasswordForm email={sesion.email} />
        </Tarjeta>
      </div>
    </>
  );
}
