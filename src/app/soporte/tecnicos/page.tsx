import type { Metadata } from 'next';
import Link from 'next/link';
import { AccionesTecnico } from '@/components/soporte/AccionesTecnico';
import { FormularioTecnico } from '@/components/soporte/FormularioTecnico';
import { EstadoVacio } from '@/components/ui/EstadoVacio';
import { Insignia } from '@/components/ui/Insignia';
import { Tarjeta } from '@/components/ui/Tarjeta';
import { DIAS_REASIGNACION } from '@/lib/config/soporte';
import { listarTecnicos } from '@/lib/dataService';
import { plural } from '@/lib/formato';

export const metadata: Metadata = { title: 'Técnicos' };

export default async function PaginaTecnicos() {
  const tecnicos = await listarTecnicos();
  const activos = tecnicos.filter((t) => t.activo).length;
  return (
    <>
      <div>
        <h1 className="text-2xl font-bold">Técnicos</h1>
        <p className="text-sm text-texto-suave">
          {plural(activos, 'técnico activo', 'técnicos activos')} de {tecnicos.length}. Se asignan a
          incidencias abiertas desde el{' '}
          <Link href="/soporte/incidencias?estado=abierta" className="text-primario underline">
            listado de incidencias
          </Link>{' '}
          o la ficha de un equipo. Una incidencia con más de {DIAS_REASIGNACION} días sin cambios
          pasa sola al técnico activo con menos casos. Un técnico inactivo no recibe casos.
        </p>
      </div>
      <Tarjeta className="grid gap-2">
        <h2 className="font-bold">Registrar un técnico</h2>
        <FormularioTecnico />
      </Tarjeta>
      {tecnicos.length ? (
        <ul className="grid gap-3 sm:grid-cols-2">
          {tecnicos.map((tecnico) => (
            <li key={tecnico.id}>
              <Tarjeta className={`grid h-full gap-3 ${tecnico.activo ? '' : 'opacity-70'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="grid gap-1">
                    <span className="font-semibold">{tecnico.nombre}</span>
                    <span className="text-sm text-texto-suave">
                      {plural(tecnico.enRevision, 'caso en revisión', 'casos en revisión')} ·{' '}
                      {plural(tecnico.cerradas, 'cerrado', 'cerrados')}
                    </span>
                  </div>
                  <Insignia
                    tono={tecnico.activo ? 'funcional' : 'neutro'}
                    texto={tecnico.activo ? 'Activo' : 'Inactivo'}
                  />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-borde pt-3">
                  <Link
                    href={`/soporte/incidencias?tecnicoId=${tecnico.id}`}
                    className="text-sm font-medium text-primario underline-offset-4 hover:underline"
                  >
                    Ver sus casos
                  </Link>
                  <AccionesTecnico
                    id={tecnico.id}
                    nombre={tecnico.nombre}
                    activo={tecnico.activo}
                    enRevision={tecnico.enRevision}
                  />
                </div>
              </Tarjeta>
            </li>
          ))}
        </ul>
      ) : (
        <EstadoVacio titulo="Aún no hay técnicos">
          Registre el primero con el formulario de arriba.
        </EstadoVacio>
      )}
    </>
  );
}
