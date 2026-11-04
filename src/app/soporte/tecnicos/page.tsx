import type { Metadata } from 'next';
import Link from 'next/link';
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
  return (
    <>
      <div>
        <h1 className="text-2xl font-bold">Técnicos</h1>
        <p className="text-sm text-texto-suave">
          Se asignan a incidencias abiertas desde el{' '}
          <Link href="/soporte/incidencias?estado=abierta" className="text-primario underline">
            listado de incidencias
          </Link>{' '}
          o la ficha de un equipo. Una incidencia con más de {DIAS_REASIGNACION} días sin cambios
          pasa sola al técnico activo con menos casos.
        </p>
      </div>
      <Tarjeta className="grid gap-2">
        <h2 className="font-bold">Registrar un técnico</h2>
        <FormularioTecnico />
      </Tarjeta>
      {tecnicos.length ? (
        <ul className="grid gap-2 sm:grid-cols-2">
          {tecnicos.map((tecnico) => (
            <li key={tecnico.id}>
              <Tarjeta className="flex items-center justify-between gap-4">
                <div className="grid gap-1">
                  <span className="font-semibold">{tecnico.nombre}</span>
                  <span className="text-sm text-texto-suave">
                    {plural(tecnico.enRevision, 'caso en revisión', 'casos en revisión')}
                  </span>
                </div>
                <Insignia
                  tono={tecnico.activo ? 'funcional' : 'neutro'}
                  texto={tecnico.activo ? 'Activo' : 'Inactivo'}
                />
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
