import type { Metadata } from 'next';
import Link from 'next/link';
import { AccionesTecnico } from '@/components/soporte/AccionesTecnico';
import { FormularioTecnico } from '@/components/soporte/FormularioTecnico';
import { EncabezadoPagina } from '@/components/ui/Encabezado';
import { EstadoVacio } from '@/components/ui/EstadoVacio';
import { Insignia } from '@/components/ui/Insignia';
import { Tarjeta } from '@/components/ui/Tarjeta';
import { DIAS_REASIGNACION } from '@/lib/config/soporte';
import { listarTecnicos } from '@/lib/dataService';
import { plural } from '@/lib/formato';
import { soloSoporte } from '@/lib/auth/sesion';

export const metadata: Metadata = { title: 'Técnicos' };

// "Técnico Aceptación" → "TA"; un solo nombre → sus dos primeras letras.
function iniciales(nombre: string): string {
  const palabras = nombre.trim().split(/\s+/).filter(Boolean);
  const texto = palabras.length > 1 ? `${palabras[0]![0]}${palabras.at(-1)![0]}` : (palabras[0] ?? '?').slice(0, 2);
  return texto.toUpperCase();
}

export default async function PaginaTecnicos() {
  await soloSoporte();
  const tecnicos = await listarTecnicos();
  const activos = tecnicos.filter((t) => t.activo).length;
  const mayorCarga = Math.max(1, ...tecnicos.map((t) => t.enRevision));
  return (
    <>
      <EncabezadoPagina
        etiqueta="Equipo de soporte"
        titulo="Técnicos"
        descripcion={
          <>
            {plural(activos, 'técnico activo', 'técnicos activos')} de {tecnicos.length}. Se asignan a
            incidencias abiertas desde el{' '}
            <Link href="/soporte/incidencias?estado=abierta" className="text-primario underline-offset-4 hover:underline">
              listado de incidencias
            </Link>{' '}
            o la ficha de un equipo. Una incidencia con más de {DIAS_REASIGNACION} días sin cambios
            pasa sola al técnico activo con menos casos. Un técnico inactivo no recibe casos.
          </>
        }
      />
      {/* En pantallas anchas: formulario fijo a la izquierda y listado al lado. */}
      <div className="grid items-start gap-10 xl:grid-cols-[22rem_minmax(0,1fr)] xl:gap-8 2xl:grid-cols-[26rem_minmax(0,1fr)]">
        <Tarjeta className="grid gap-3 xl:sticky xl:top-24">
          <h2 className="text-xl font-medium">Registrar un técnico</h2>
          <FormularioTecnico />
        </Tarjeta>
        {tecnicos.length ? (
          <ul className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
            {tecnicos.map((tecnico) => (
              <li key={tecnico.id}>
                <Tarjeta className={`grid h-full gap-4 ${tecnico.activo ? '' : 'opacity-70'}`}>
                  <div className="flex items-start gap-4">
                    <span
                      aria-hidden="true"
                      className="grid size-11 shrink-0 place-items-center rounded-full border border-primario/40 bg-primario-suave font-titulo text-lg font-semibold text-primario"
                    >
                      {iniciales(tecnico.nombre)}
                    </span>
                    <div className="grid min-w-0 flex-1 gap-1">
                      <span className="truncate font-semibold">{tecnico.nombre}</span>
                      <span className="justify-self-start">
                        <Insignia
                          tono={tecnico.activo ? 'funcional' : 'neutro'}
                          texto={tecnico.activo ? 'Activo' : 'Inactivo'}
                        />
                      </span>
                    </div>
                  </div>
                  <dl className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-superficie-alta px-3 py-2">
                      <dt className="text-[0.65rem] uppercase tracking-[0.15em] text-texto-suave">En revisión</dt>
                      <dd className="text-xl font-semibold tabular-nums">{tecnico.enRevision}</dd>
                    </div>
                    <div className="rounded-lg bg-superficie-alta px-3 py-2">
                      <dt className="text-[0.65rem] uppercase tracking-[0.15em] text-texto-suave">Cerrados</dt>
                      <dd className="text-xl font-semibold tabular-nums">{tecnico.cerradas}</dd>
                    </div>
                  </dl>
                  {/* Carga relativa al técnico con más casos: ayuda a ver si el reparto está parejo. */}
                  <div className="grid gap-1">
                    <div aria-hidden="true" className="h-1 overflow-hidden rounded-full bg-borde">
                      <div className="h-full rounded-full bg-primario" style={{ width: `${Math.round((tecnico.enRevision / mayorCarga) * 100)}%` }} />
                    </div>
                    <span className="text-xs text-texto-suave">
                      {plural(tecnico.enRevision, 'caso en revisión', 'casos en revisión')} ahora
                    </span>
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
      </div>
    </>
  );
}
