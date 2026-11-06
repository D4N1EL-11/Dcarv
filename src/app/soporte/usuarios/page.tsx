import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { DecisionSolicitud } from '@/components/soporte/DecisionSolicitud';
import { SelectorRol } from '@/components/soporte/SelectorRol';
import { EncabezadoPagina, TituloSeccion } from '@/components/ui/Encabezado';
import { Insignia } from '@/components/ui/Insignia';
import { DOMINIOS_SOPORTE, esSoporte } from '@/lib/auth/permisos';
import { soloSoporte } from '@/lib/auth/sesion';
import { listarUsuarios } from '@/lib/dataService';
import { formatearFecha, plural, textoAntiguedad } from '@/lib/formato';
import { diasEntre, hoyBogota } from '@/lib/reglas/fechas';

export const metadata: Metadata = { title: 'Cuentas y roles' };

// Solo administradores. Un cambio de rol (o una solicitud aprobada) da o quita permisos de gestión
// en la siguiente acción de esa cuenta (exigirSoporte lee el rol de la base), y su menú cambia en
// la siguiente página que abra (el layout renueva la sesión).
export default async function PaginaUsuarios() {
  const sesion = await soloSoporte();
  if (sesion.rol !== 'admin') redirect('/soporte');
  const usuarios = await listarUsuarios();
  const solicitudes = usuarios.filter((u) => u.solicitud);
  const deSoporte = usuarios.filter((u) => esSoporte(u.rol)).length;
  const hoy = hoyBogota();

  return (
    <>
      <EncabezadoPagina
        etiqueta="Administración"
        titulo="Cuentas y roles"
        descripcion={
          <>
            {plural(usuarios.length, 'cuenta', 'cuentas')}: {deSoporte} de soporte y {usuarios.length - deSoporte} de reporte.
            Toda cuenta nueva nace como cuenta de reporte. Las de correo @{DOMINIOS_SOPORTE[0]} además piden el acceso de
            soporte, que usted aprueba aquí: como el correo no se verifica, revise que sea una persona del equipo.
          </>
        }
      />

      <section id="solicitudes" aria-labelledby="titulo-solicitudes" className="grid scroll-mt-24 gap-4">
        <TituloSeccion id="titulo-solicitudes" titulo="Solicitudes de acceso de soporte">
          <span className="text-sm text-texto-suave">
            {solicitudes.length ? plural(solicitudes.length, 'pendiente', 'pendientes') : 'Ninguna pendiente'}
          </span>
        </TituloSeccion>
        {solicitudes.length ? (
          <ol className="divide-y divide-borde overflow-hidden rounded-xl border border-primario/40 bg-superficie">
            {solicitudes.map((u) => (
              <li key={u.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="grid min-w-0 gap-0.5">
                  <span className="break-all font-semibold text-texto">{u.email}</span>
                  <span className="text-xs text-texto-suave">
                    Pidió el acceso {textoAntiguedad(diasEntre(u.solicitud!, hoy))} · cuenta creada el {formatearFecha(u.creado)} ·{' '}
                    {plural(u.reportes, 'reporte', 'reportes')}
                  </span>
                </div>
                <DecisionSolicitud id={u.id} email={u.email} />
              </li>
            ))}
          </ol>
        ) : (
          <p className="rounded-xl border border-borde bg-superficie px-5 py-4 text-sm text-texto-suave">
            Cuando alguien con correo @{DOMINIOS_SOPORTE[0]} cree su cuenta o pida el acceso desde &quot;Mi cuenta&quot;, aparecerá aquí y
            le llegará un aviso a la campana.
          </p>
        )}
      </section>

      <section aria-labelledby="titulo-cuentas" className="grid gap-4">
        <TituloSeccion id="titulo-cuentas" titulo="Todas las cuentas" />
        <div className="overflow-x-auto rounded-xl border border-borde bg-superficie">
          <table className="w-full min-w-[40rem] text-sm">
            <thead>
              <tr className="border-b border-borde text-left text-[0.7rem] uppercase tracking-[0.18em] text-texto-suave">
                <th scope="col" className="px-5 py-3 font-medium">Correo</th>
                <th scope="col" className="px-5 py-3 font-medium">Tipo</th>
                <th scope="col" className="px-5 py-3 font-medium">Reportes</th>
                <th scope="col" className="px-5 py-3 font-medium">Creada</th>
                <th scope="col" className="w-56 px-5 py-3 font-medium">Rol</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-borde">
              {usuarios.map((usuario) => (
                <tr key={usuario.id}>
                  <td className="px-5 py-3 break-all text-texto">
                    {usuario.email}
                    {usuario.id === sesion.id ? <span className="ml-2 text-xs text-texto-suave">(usted)</span> : null}
                  </td>
                  <td className="px-5 py-3">
                    {usuario.solicitud ? (
                      <Insignia tono="reparacion" texto="Solicitud pendiente" />
                    ) : (
                      <Insignia tono={esSoporte(usuario.rol) ? 'funcional' : 'neutro'} texto={esSoporte(usuario.rol) ? 'Soporte' : 'Reporte'} />
                    )}
                  </td>
                  <td className="px-5 py-3 tabular-nums">{usuario.reportes}</td>
                  <td className="px-5 py-3 text-texto-suave">{formatearFecha(usuario.creado)}</td>
                  <td className="px-5 py-3">
                    <SelectorRol id={usuario.id} email={usuario.email} rol={usuario.rol} propia={usuario.id === sesion.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
