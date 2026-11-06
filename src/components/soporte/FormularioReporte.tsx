'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState, type FormEvent } from 'react';
import { Aviso } from '@/components/ui/Aviso';
import { Boton, clasesBoton } from '@/components/ui/Boton';
import { CampoTexto } from '@/components/ui/Campo';
import { Icono } from '@/components/ui/Icono';
import { Selector } from '@/components/ui/Selector';
import { llamarApi } from '@/lib/clienteApi';
import { PRIORIDADES_INCIDENCIA } from '@/lib/config/soporte';
import type { ResultadoIncidencia } from '@/lib/datos/tipos';
import { subirFotoIncidencia } from '@/lib/fotoCliente';
import type { EstadoEquipo } from '@/lib/reglas/equipo';
import {
  AYUDA_PRIORIDAD,
  ETIQUETA_PRIORIDAD,
  type CategoriaIncidencia,
  type PrioridadIncidencia,
} from '@/lib/reglas/clasificacion';
import { ETIQUETA_INCIDENCIA, type EstadoIncidencia } from '@/lib/reglas/incidencia';
import { esquemaIncidencia } from '@/lib/validacion/esquemas';
import { SelectorCategoria } from './SelectorCategoria';
import { SelectorFoto } from './SelectorFoto';

export type EquipoParaReporte = { codigo: string; salaId: string; sala: string; estado: EstadoEquipo };
export type CasoPendiente = { numeroCaso: string; descripcion: string; estado: EstadoIncidencia };

type Props = {
  salas: { id: string; nombre: string }[];
  equipos: EquipoParaReporte[];
  pendientes: Record<string, CasoPendiente[]>;
  equipoInicial: string | null;
  // Soporte también fija la prioridad; una cuenta de reporte no la elige.
  soporte?: boolean;
};

type Enviado = { numeroCaso: string; codigo: string; estadoEquipo: EstadoEquipo; avisoFoto: string | null };

const MAXIMO = 1000;

export function FormularioReporte({ salas, equipos, pendientes, equipoInicial, soporte = false }: Props) {
  const router = useRouter();
  const inicial = equipos.find((e) => e.codigo === equipoInicial) ?? null;
  // Desde el QR de un equipo, el equipo ya viene elegido; se puede cambiar.
  const [fijo, setFijo] = useState(Boolean(inicial));
  const [salaId, setSalaId] = useState(inicial?.salaId ?? (salas.length === 1 ? salas[0]!.id : ''));
  const [codigo, setCodigo] = useState(inicial?.codigo ?? '');
  const [descripcion, setDescripcion] = useState('');
  const [foto, setFoto] = useState<File | null>(null);
  const [categoria, setCategoria] = useState<CategoriaIncidencia | null>(null);
  const [prioridad, setPrioridad] = useState<PrioridadIncidencia>('media');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState<Enviado | null>(null);

  // Los dados de baja ya no están en servicio: no se ofrecen (salvo que se llegue por su QR).
  const opciones = useMemo(
    () => equipos.filter((e) => e.salaId === salaId && (e.estado !== 'dado_de_baja' || e.codigo === inicial?.codigo)),
    [equipos, salaId, inicial],
  );
  const equipo = equipos.find((e) => e.codigo === codigo) ?? null;
  const casosAbiertos = (codigo && pendientes[codigo]) || [];
  const problema = esquemaIncidencia.safeParse({ descripcion }).error?.issues[0]?.message;

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    if (!equipo) {
      setError('Elija el equipo que tiene la falla.');
      return;
    }
    if (problema) {
      setError(problema);
      return;
    }
    if (!categoria) {
      setError('Elija el tipo de falla (si no sabe, elija "Otro").');
      return;
    }
    setError('');
    setEnviando(true);
    const respuesta = await llamarApi<ResultadoIncidencia>(
      `/api/soporte/equipos/${encodeURIComponent(equipo.codigo)}/incidencias`,
      'POST',
      { descripcion, categoria, ...(soporte ? { prioridad } : {}) },
    );
    if (!respuesta.ok) {
      setEnviando(false);
      setError(respuesta.mensaje);
      return;
    }
    const { incidencia, estadoEquipo } = respuesta.datos;
    // El reporte ya quedó: si la foto falla, se avisa sin perder el caso.
    const subida = foto ? await subirFotoIncidencia(incidencia.numeroCaso, foto) : { ok: true as const };
    setEnviando(false);
    setEnviado({
      numeroCaso: incidencia.numeroCaso,
      codigo: equipo.codigo,
      estadoEquipo,
      avisoFoto: subida.ok ? null : `El reporte quedó registrado, pero la foto no se pudo subir: ${subida.mensaje}`,
    });
    router.refresh();
  }

  function otroReporte() {
    setEnviado(null);
    setDescripcion('');
    setFoto(null);
    setCategoria(null);
    setPrioridad('media');
    setFijo(false);
    setCodigo('');
  }

  if (enviado) {
    return (
      <section role="status" className="grid gap-5 rounded-2xl border border-funcional/30 bg-superficie p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-full bg-funcional/15 text-funcional">
            <Icono nombre="check" className="size-6" />
          </span>
          <div className="grid gap-1">
            <h2 className="text-3xl font-medium">Reporte enviado</h2>
            <p className="text-sm text-texto-suave">
              Su caso es <strong className="font-semibold text-texto">{enviado.numeroCaso}</strong> para el equipo{' '}
              <strong className="font-semibold text-texto">{enviado.codigo}</strong>. Soporte ya lo ve en su lista. Le
              llegará un aviso a la campana cuando un técnico lo tome y cuando se cierre.
            </p>
            <p className="text-sm text-texto-suave">
              {enviado.estadoEquipo === 'dado_de_baja'
                ? 'El equipo está dado de baja; el reporte queda en su historial.'
                : 'El equipo quedó marcado "En reparación" para que nadie lo use mientras lo revisan.'}
            </p>
          </div>
        </div>
        {enviado.avisoFoto ? <Aviso tipo="advertencia">{enviado.avisoFoto}</Aviso> : null}
        <div className="flex flex-wrap gap-3">
          <Link href={`/soporte/incidencias/${encodeURIComponent(enviado.numeroCaso)}`} className={clasesBoton()}>
            Ver el caso
          </Link>
          <Link href="/soporte/mis-reportes" className={clasesBoton('secundario')}>
            Mis reportes
          </Link>
          <Boton variante="secundario" onClick={otroReporte}>
            Reportar otra falla
          </Boton>
        </div>
      </section>
    );
  }

  return (
    <form onSubmit={enviar} className="grid gap-5 rounded-2xl border border-borde bg-superficie p-5 sm:p-7" noValidate>
      <fieldset className="grid gap-3">
        <legend className="mb-1 text-sm font-medium text-texto">1. ¿Qué equipo falla?</legend>
        {fijo && inicial ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primario/40 bg-primario-suave px-4 py-3">
            <span className="flex items-center gap-3">
              <Icono nombre="equipo" className="size-5 text-primario" />
              <span className="grid">
                <span className="font-semibold text-texto">{inicial.codigo}</span>
                <span className="text-xs text-texto-suave">{inicial.sala}</span>
              </span>
            </span>
            <button type="button" onClick={() => setFijo(false)} className="text-sm font-medium text-primario underline-offset-4 hover:underline">
              Cambiar equipo
            </button>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <Selector
              etiqueta="Sala"
              value={salaId}
              onChange={(evento) => {
                setSalaId(evento.target.value);
                setCodigo('');
              }}
              opciones={[{ valor: '', texto: 'Elija la sala' }, ...salas.map((s) => ({ valor: s.id, texto: s.nombre }))]}
            />
            <Selector
              etiqueta="Equipo"
              value={codigo}
              disabled={!salaId}
              onChange={(evento) => {
                setCodigo(evento.target.value);
                setError('');
              }}
              opciones={[
                { valor: '', texto: salaId ? (opciones.length ? 'Elija el equipo' : 'Esta sala no tiene equipos en servicio') : 'Primero elija la sala' },
                ...opciones.map((e) => ({ valor: e.codigo, texto: e.codigo })),
              ]}
            />
          </div>
        )}
        {casosAbiertos.length ? (
          <Aviso tipo="info">
            Este equipo ya tiene {casosAbiertos.length === 1 ? 'un caso sin cerrar' : `${casosAbiertos.length} casos sin cerrar`}:{' '}
            {casosAbiertos
              .slice(0, 3)
              .map((c) => `${c.numeroCaso} "${c.descripcion}" (${ETIQUETA_INCIDENCIA[c.estado]})`)
              .join('; ')}
            . Si es la misma falla, no hace falta reportarla de nuevo.
          </Aviso>
        ) : null}
      </fieldset>

      <fieldset className="grid gap-2">
        <legend className="mb-1 text-sm font-medium text-texto">2. ¿Qué pasa?</legend>
        <CampoTexto
          etiqueta="Descripción de la falla"
          placeholder="Ej.: No enciende; la pantalla queda en negro y suena un pitido."
          value={descripcion}
          maxLength={MAXIMO}
          onChange={(evento) => {
            setDescripcion(evento.target.value);
            setError('');
          }}
        />
        <p className="text-right text-xs text-texto-suave">
          {descripcion.length}/{MAXIMO}
        </p>
        <SelectorFoto archivo={foto} alCambiar={setFoto} deshabilitado={enviando} />
      </fieldset>

      <fieldset className="grid gap-2">
        <legend className="mb-1 text-sm font-medium text-texto">3. ¿Qué tipo de falla es?</legend>
        <SelectorCategoria
          valor={categoria}
          deshabilitado={enviando}
          alCambiar={(valor) => {
            setCategoria(valor);
            setError('');
          }}
        />
        {soporte ? (
          <div className="mt-2 grid gap-1 sm:max-w-xs">
            <Selector
              etiqueta="Prioridad"
              value={prioridad}
              disabled={enviando}
              onChange={(evento) => setPrioridad(evento.target.value as PrioridadIncidencia)}
              opciones={PRIORIDADES_INCIDENCIA.map((p) => ({ valor: p, texto: ETIQUETA_PRIORIDAD[p] }))}
            />
            <p className="text-xs text-texto-suave">{AYUDA_PRIORIDAD[prioridad]}</p>
          </div>
        ) : null}
      </fieldset>

      {error ? <Aviso tipo="error">{error}</Aviso> : null}
      <div>
        <Boton type="submit" cargando={enviando} className="w-full sm:w-auto">
          {enviando ? 'Enviando reporte…' : 'Enviar reporte'}
        </Boton>
      </div>
    </form>
  );
}
