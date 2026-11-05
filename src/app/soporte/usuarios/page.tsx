import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { SelectorRol } from '@/components/soporte/SelectorRol';
import { EncabezadoPagina } from '@/components/ui/Encabezado';
import { Insignia } from '@/components/ui/Insignia';
import { DOMINIOS_SOPORTE, esSoporte } from '@/lib/auth/permisos';
import { soloSoporte } from '@/lib/auth/sesion';
import { listarUsuarios } from '@/lib/dataService';
import { formatearFecha, plural } from '@/lib/formato';

export const metadata: Metadata = { title: 'Cuentas y roles' };

// Solo administradores. Un cambio de rol quita o da permisos de gestión en la siguiente acción
// de esa cuenta (exigirSoporte lee el rol de la base); el menú cambia al volver a iniciar sesión.
export default async function PaginaUsuarios() {
  const sesion = await soloSoporte();
  if (sesion.rol !== 'admin') redirect('/soporte');
  const usuarios = await listarUsuarios();
  const deSoporte = usuarios.filter((u) => esSoporte(u.rol)).length;

  return (
    <>
      <EncabezadoPagina
        etiqueta="Administración"
        titulo="Cuentas y roles"
        descripcion={
          <>
            {plural(usuarios.length, 'cuenta', 'cuentas')}: {deSoporte} de soporte y {usuarios.length - deSoporte} de reporte.
            Las cuentas nuevas con correo @{DOMINIOS_SOPORTE[0]} nacen como soporte; las demás, como cuentas de reporte, que
            solo reportan fallas y siguen sus casos. Como no se verifica el correo, revise aquí quién tiene permisos de soporte.
          </>
        }
      />
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
                  <Insignia tono={esSoporte(usuario.rol) ? 'funcional' : 'neutro'} texto={esSoporte(usuario.rol) ? 'Soporte' : 'Reporte'} />
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
    </>
  );
}
