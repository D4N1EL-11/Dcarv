'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAvisos } from '@/components/ui/Avisos';
import { Boton } from '@/components/ui/Boton';
import { Icono } from '@/components/ui/Icono';
import { Selector } from '@/components/ui/Selector';
import { useRefrescar } from '@/hooks/use-refrescar';
import { llamarApi } from '@/lib/clienteApi';
import { MAXIMO_COLUMNAS_MAPA, MAXIMO_FILAS_MAPA, MINIMO_COLUMNAS_MAPA } from '@/lib/config/soporte';
import type { EquipoMapa, MapaSala as DatosMapa } from '@/lib/dataService';
import { etiquetaEstadoEquipo } from '@/lib/formato';
import type { EstadoEquipo } from '@/lib/reglas/equipo';
import { distribuirEquipos, type Puesto } from '@/lib/reglas/mapa';

const ESTILO: Record<EstadoEquipo, string> = {
  funcional: 'border-funcional/40 bg-funcional/10 text-funcional hover:bg-funcional/20',
  en_reparacion: 'border-reparacion/50 bg-reparacion/15 text-reparacion hover:bg-reparacion/25',
  dado_de_baja: 'border-baja/40 bg-baja/10 text-baja/80 hover:bg-baja/20',
};

const COLUMNAS = Array.from({ length: MAXIMO_COLUMNAS_MAPA - MINIMO_COLUMNAS_MAPA + 1 }, (_, i) => {
  const valor = String(i + MINIMO_COLUMNAS_MAPA);
  return { valor, texto: `${valor} columnas` };
});

function ContenidoPuesto({ equipo }: { equipo: EquipoMapa }) {
  return (
    <>
      <Icono nombre="equipo" className="size-5 sm:size-6" />
      <span className="max-w-full truncate text-[0.7rem] font-semibold tabular-nums text-texto sm:text-xs">{equipo.codigo}</span>
      {equipo.pendientes ? (
        <span
          className="absolute -right-1.5 -top-1.5 grid min-w-5 place-items-center rounded-full bg-baja px-1 text-[0.65rem] font-bold text-fondo"
          title={`${equipo.pendientes} sin cerrar`}
        >
          {equipo.pendientes}
        </span>
      ) : null}
    </>
  );
}

// Mapa de una sala: cada equipo en su puesto con el color de su estado. En modo "organizar" se
// pulsa un equipo y luego el puesto de destino; si está ocupado, los dos se intercambian.
export function MapaSala({ mapa }: { mapa: DatosMapa }) {
  const { refrescar, refrescando } = useRefrescar();
  const { mostrar } = useAvisos();
  const [organizando, setOrganizando] = useState(false);
  const [seleccionado, setSeleccionado] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const { columnas } = mapa.sala;
  const { filas, equipos } = distribuirEquipos(mapa.equipos, columnas);
  // Organizando se muestra una fila libre más para poder abrir una fila nueva.
  const filasVisibles = organizando ? Math.min(filas + 1, MAXIMO_FILAS_MAPA) : filas;
  const porPuesto = new Map(equipos.map((e) => [`${e.fila}:${e.columna}`, e]));
  const ocupado = guardando || refrescando;

  async function mover(codigo: string, puesto: Puesto) {
    setGuardando(true);
    const respuesta = await llamarApi(`/api/soporte/equipos/${encodeURIComponent(codigo)}/puesto`, 'PATCH', puesto);
    setGuardando(false);
    setSeleccionado(null);
    if (respuesta.ok) refrescar();
    else mostrar('error', respuesta.mensaje);
  }

  async function cambiarColumnas(valor: number) {
    setGuardando(true);
    const respuesta = await llamarApi(`/api/soporte/salas/${mapa.sala.id}/mapa`, 'PATCH', { columnas: valor });
    setGuardando(false);
    if (respuesta.ok) refrescar();
    else mostrar('error', respuesta.mensaje);
  }

  function pulsarPuesto(puesto: Puesto, codigo: string | undefined) {
    if (!seleccionado) {
      if (codigo) setSeleccionado(codigo);
      return;
    }
    if (codigo === seleccionado) {
      setSeleccionado(null);
      return;
    }
    void mover(seleccionado, puesto);
  }

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4 print:hidden">
        <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-texto-suave" aria-label="Convenciones">
          {(['funcional', 'en_reparacion', 'dado_de_baja'] as const).map((estado) => (
            <li key={estado} className="flex items-center gap-2">
              <span className={`size-3 rounded border ${ESTILO[estado]}`} aria-hidden="true" />
              {etiquetaEstadoEquipo(estado)}
            </li>
          ))}
          <li className="flex items-center gap-2">
            <span className="grid size-4 place-items-center rounded-full bg-baja text-[0.6rem] font-bold text-fondo" aria-hidden="true">
              n
            </span>
            Incidencias sin cerrar
          </li>
        </ul>
        <div className="flex flex-wrap items-end gap-2">
          {organizando ? (
            <div className="w-40">
              <Selector
                etiqueta="Ancho del mapa"
                compacto
                value={String(columnas)}
                disabled={ocupado}
                opciones={COLUMNAS}
                onChange={(evento) => void cambiarColumnas(Number(evento.target.value))}
              />
            </div>
          ) : null}
          <Boton
            variante={organizando ? 'primario' : 'secundario'}
            className="gap-2"
            onClick={() => {
              setOrganizando((valor) => !valor);
              setSeleccionado(null);
            }}
          >
            <Icono nombre={organizando ? 'check' : 'editar'} /> {organizando ? 'Listo' : 'Organizar puestos'}
          </Boton>
        </div>
      </div>

      {organizando ? (
        <p role="status" className="rounded-lg border border-primario/30 bg-primario-suave px-4 py-2 text-sm text-texto">
          {seleccionado
            ? `Pulse el puesto de destino para ${seleccionado}. Si está ocupado, los dos equipos se intercambian.`
            : 'Pulse un equipo para moverlo.'}
        </p>
      ) : null}

      <div className="overflow-x-auto rounded-2xl border border-borde bg-superficie p-4 sm:p-6">
        <div className="mx-auto grid gap-4" style={{ minWidth: `${columnas * 4.5}rem` }}>
          <div className="mx-auto w-2/3 rounded-md border border-primario/30 bg-primario-suave py-1.5 text-center text-[0.65rem] font-medium uppercase tracking-[0.3em] text-primario">
            Frente de la sala
          </div>
          <div className="grid gap-2 sm:gap-3" style={{ gridTemplateColumns: `repeat(${columnas}, minmax(0, 1fr))` }}>
            {Array.from({ length: filasVisibles * columnas }, (_, indice) => {
              const puesto = { fila: Math.floor(indice / columnas) + 1, columna: (indice % columnas) + 1 };
              const equipo = porPuesto.get(`${puesto.fila}:${puesto.columna}`);
              const base =
                'relative flex aspect-[4/3] flex-col items-center justify-center gap-1 rounded-xl border px-1 transition';
              if (!organizando) {
                return equipo ? (
                  <Link
                    key={indice}
                    href={`/soporte/equipos/${encodeURIComponent(equipo.codigo)}`}
                    title={`${equipo.codigo} · ${etiquetaEstadoEquipo(equipo.estado)} · ${equipo.incidencias30d} incidencias en 30 días`}
                    className={`${base} ${ESTILO[equipo.estado]} focus-visible:outline-2 focus-visible:outline-primario`}
                  >
                    <ContenidoPuesto equipo={equipo} />
                  </Link>
                ) : (
                  <div key={indice} aria-hidden="true" className={`${base} border-dashed border-borde/60`} />
                );
              }
              const elegido = equipo?.codigo === seleccionado;
              const etiqueta = equipo
                ? elegido
                  ? `Cancelar el movimiento de ${equipo.codigo}`
                  : seleccionado
                    ? `Intercambiar ${seleccionado} con ${equipo.codigo}`
                    : `Mover ${equipo.codigo}`
                : seleccionado
                  ? `Mover ${seleccionado} a la fila ${puesto.fila}, puesto ${puesto.columna}`
                  : `Puesto libre: fila ${puesto.fila}, puesto ${puesto.columna}`;
              return (
                <button
                  key={indice}
                  type="button"
                  aria-label={etiqueta}
                  aria-pressed={elegido}
                  disabled={ocupado || (!equipo && !seleccionado)}
                  onClick={() => pulsarPuesto(puesto, equipo?.codigo)}
                  className={`${base} ${
                    equipo ? ESTILO[equipo.estado] : 'border-dashed border-borde hover:border-primario/60 hover:bg-primario-suave'
                  } ${elegido ? 'ring-2 ring-primario ring-offset-2 ring-offset-superficie' : ''} cursor-pointer disabled:cursor-default disabled:opacity-70`}
                >
                  {equipo ? <ContenidoPuesto equipo={equipo} /> : null}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
