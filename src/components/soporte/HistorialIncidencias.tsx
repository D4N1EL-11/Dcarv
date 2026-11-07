import Link from 'next/link';
import { EstadoVacio } from '@/components/ui/EstadoVacio';
import { Icono, type NombreIcono } from '@/components/ui/Icono';
import { Tarjeta } from '@/components/ui/Tarjeta';
import type { FilaIncidencia, FilaTecnico } from '@/lib/dataService';
import { formatearFecha, plural, textoAntiguedad, textoResolucion } from '@/lib/formato';
import { diasEntre, hoyBogota } from '@/lib/reglas/fechas';
import type { EstadoIncidencia } from '@/lib/reglas/incidencia';
import { diasHastaReasignacion } from '@/lib/reglas/tecnico';
import { AccionesIncidencia } from './AccionesIncidencia';
import { InsigniaEstadoIncidencia } from './InsigniaEstadoIncidencia';
import { EtiquetaCategoria, InsigniaPrioridad } from './InsigniasClasificacion';
import { InsigniaSla } from './InsigniaSla';

type Props = {
  incidencias: FilaIncidencia[];
  tecnicos: FilaTecnico[];
  mostrarEquipo?: boolean;
  textoVacio: string;
  // 'linea': línea de tiempo vertical (ficha del equipo); 'lista': listado de incidencias.
  variante?: 'lista' | 'linea';
  // Cuentas de reporte ("Mis reportes"): sin acciones ni enlaces a páginas de soporte.
  soloLectura?: boolean;
};

const ESTILO_ESTADO: Record<EstadoIncidencia, { punto: string; icono: NombreIcono; color: string }> = {
  abierta: { punto: 'bg-reparacion', icono: 'incidencias', color: 'text-reparacion' },
  en_revision: { punto: 'bg-revision', icono: 'tecnicos', color: 'text-revision' },
  cerrada: { punto: 'bg-funcional', icono: 'check', color: 'text-funcional' },
};

// RN-10 visible: cuánto lleva el caso con su técnico y cuándo lo tomará la reasignación automática.
function textoRevision(diaEstado: string, hoy: string): string {
  const transcurridos = diasEntre(diaEstado, hoy);
  const faltan = diasHastaReasignacion(transcurridos);
  return `Con el técnico desde ${textoAntiguedad(transcurridos)} · ${
    faltan > 0 ? `pasa a otro en ${plural(faltan, 'día', 'días')} si no se cierra` : 'entra en la próxima reasignación'
  }`;
}

// Miniatura de la foto: la ruta de la API comprueba la sesión y lleva a una URL firmada.
function Foto({ numeroCaso }: { numeroCaso: string }) {
  const url = `/api/soporte/incidencias/${encodeURIComponent(numeroCaso)}/foto`;
  return (
    <a href={url} target="_blank" rel="noreferrer" className="group mt-1 block w-fit print:hidden" title="Abrir la foto en otra pestaña">
      <img
        src={url}
        alt={`Foto de la falla del caso ${numeroCaso}`}
        loading="lazy"
        className="h-20 w-28 rounded-lg border border-borde object-cover transition group-hover:border-primario/60"
      />
    </a>
  );
}

function Detalle({
  incidencia,
  mostrarEquipo,
  hoy,
  soloLectura,
}: {
  incidencia: FilaIncidencia;
  mostrarEquipo: boolean;
  hoy: string;
  soloLectura: boolean;
}) {
  return (
    <div className="grid min-w-0 flex-1 gap-1.5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        {/* La ficha del caso tiene la conversación, la foto y todo su recorrido. */}
        <Link
          href={`/soporte/incidencias/${encodeURIComponent(incidencia.numeroCaso)}`}
          className="font-semibold tabular-nums text-texto underline-offset-4 hover:text-primario hover:underline"
        >
          {incidencia.numeroCaso}
        </Link>
        <InsigniaEstadoIncidencia estado={incidencia.estado} />
        {incidencia.prioridad !== 'media' ? <InsigniaPrioridad prioridad={incidencia.prioridad} /> : null}
        <EtiquetaCategoria categoria={incidencia.categoria} />
        {soloLectura ? null : <InsigniaSla caso={incidencia} />}
        {mostrarEquipo && soloLectura ? (
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primario">
            <Icono nombre="equipo" className="size-3.5" />
            {incidencia.equipoCodigo}
          </span>
        ) : mostrarEquipo ? (
          <Link
            href={`/soporte/equipos/${encodeURIComponent(incidencia.equipoCodigo)}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primario underline-offset-4 hover:underline"
          >
            <Icono nombre="equipo" className="size-3.5" />
            {incidencia.equipoCodigo}
          </Link>
        ) : null}
      </div>
      <p className="text-sm whitespace-pre-line break-words text-texto">{incidencia.descripcion}</p>
      {incidencia.tieneFoto ? <Foto numeroCaso={incidencia.numeroCaso} /> : null}
      <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-texto-suave">
        <span className="inline-flex items-center gap-1.5">
          <Icono nombre="calendario" className="size-3.5" />
          {formatearFecha(incidencia.fecha)}
          {incidencia.estado !== 'cerrada' ? ` · reportada ${textoAntiguedad(diasEntre(incidencia.fecha, hoy))}` : ''}
        </span>
        {incidencia.estado === 'cerrada' ? (
          // diaEstado de una cerrada es el día del cierre (su último cambio de estado).
          <span className="inline-flex items-center gap-1.5 text-funcional">
            <Icono nombre="check" className="size-3.5" />
            Cerrada el {formatearFecha(incidencia.diaEstado)} · {textoResolucion(diasEntre(incidencia.fecha, incidencia.diaEstado))}
          </span>
        ) : null}
        {incidencia.tecnico ? (
          <span className="inline-flex items-center gap-1.5">
            <Icono nombre="usuario" className="size-3.5" />
            {incidencia.tecnico}
          </span>
        ) : (
          incidencia.estado === 'abierta' && <span className="italic">Sin técnico asignado</span>
        )}
        {incidencia.reportadoPor && !soloLectura ? (
          <span className="inline-flex items-center gap-1.5" title="Cuenta que reportó la falla">
            <Icono nombre="correo" className="size-3.5" />
            {incidencia.reportadoPor}
          </span>
        ) : null}
        {incidencia.estado === 'en_revision' && incidencia.tecnico ? (
          <span className="inline-flex items-center gap-1.5">
            <Icono nombre="reloj" className="size-3.5" />
            {textoRevision(incidencia.diaEstado, hoy)}
          </span>
        ) : null}
        <Link
          href={`/soporte/incidencias/${encodeURIComponent(incidencia.numeroCaso)}#conversacion`}
          className="inline-flex items-center gap-1.5 text-primario underline-offset-4 hover:underline print:hidden"
        >
          <Icono nombre="comentario" className="size-3.5" />
          {incidencia.comentarios ? plural(incidencia.comentarios, 'comentario', 'comentarios') : 'Ver conversación'}
        </Link>
      </p>
    </div>
  );
}

export function HistorialIncidencias({
  incidencias,
  tecnicos,
  mostrarEquipo = false,
  textoVacio,
  variante = 'lista',
  soloLectura = false,
}: Props) {
  if (!incidencias.length) return <EstadoVacio titulo={textoVacio} icono="incidencias" />;
  const activos = tecnicos.filter((t) => t.activo).map(({ id, nombre }) => ({ id, nombre }));
  const hoy = hoyBogota();

  const acciones = (incidencia: FilaIncidencia) => soloLectura ? null : (
    <div className="sm:w-52 sm:shrink-0 print:hidden">
      <AccionesIncidencia
        numeroCaso={incidencia.numeroCaso}
        estado={incidencia.estado}
        equipoCodigo={incidencia.equipoCodigo}
        estadoEquipo={incidencia.estadoEquipo}
        otrasPendientes={incidencia.otrasPendientes}
        tecnicos={activos}
      />
    </div>
  );

  if (variante === 'linea') {
    return (
      <ol className="relative ml-2 grid gap-4 border-l border-borde pl-6">
        {incidencias.map((incidencia) => (
          // El id permite enlazar a un caso concreto (búsqueda global, movimientos recientes).
          <li key={incidencia.numeroCaso} id={incidencia.numeroCaso} className="destacable relative">
            <span
              aria-hidden="true"
              className={`absolute -left-[30.5px] top-6 size-3 rounded-full ring-4 ring-fondo ${ESTILO_ESTADO[incidencia.estado].punto}`}
            />
            <Tarjeta className="marco-destacable flex flex-col justify-between gap-4 transition-shadow sm:flex-row print:break-inside-avoid">
              <Detalle incidencia={incidencia} mostrarEquipo={mostrarEquipo} hoy={hoy} soloLectura={soloLectura} />
              {acciones(incidencia)}
            </Tarjeta>
          </li>
        ))}
      </ol>
    );
  }

  return (
    <ol className="divide-y divide-borde overflow-hidden rounded-xl border border-borde bg-superficie">
      {incidencias.map((incidencia) => {
        const estilo = ESTILO_ESTADO[incidencia.estado];
        return (
          <li key={incidencia.numeroCaso} id={incidencia.numeroCaso} className="destacable">
            <div className="marco-destacable flex flex-col gap-4 px-5 py-4 transition-colors hover:bg-superficie-alta/40 sm:flex-row sm:items-start">
              <span className={`hidden size-9 shrink-0 place-items-center rounded-full bg-superficie-alta sm:grid ${estilo.color}`}>
                <Icono nombre={estilo.icono} className="size-4" />
              </span>
              <Detalle incidencia={incidencia} mostrarEquipo={mostrarEquipo} hoy={hoy} soloLectura={soloLectura} />
              {acciones(incidencia)}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
