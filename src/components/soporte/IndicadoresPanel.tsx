import Link from 'next/link';
import type { ConteoIncidencias, FilaSala } from '@/lib/dataService';
import { porcentaje } from '@/lib/formato';

type Props = { salas: FilaSala[]; incidencias: ConteoIncidencias };

function Indicador({
  titulo,
  valor,
  detalle,
  color,
  enlace,
}: {
  titulo: string;
  valor: number;
  detalle: string;
  color: string;
  enlace?: string | undefined;
}) {
  const contenido = (
    <>
      <dt className="text-[0.7rem] font-medium uppercase tracking-[0.2em] text-texto-suave">{titulo}</dt>
      <dd className={`mt-3 font-titulo text-5xl font-medium leading-none ${color}`}>{valor}</dd>
      <dd className="mt-2 text-xs text-texto-suave">{detalle}</dd>
    </>
  );
  const clases = 'grid h-full content-start rounded-xl border border-borde bg-superficie p-5';
  return enlace ? (
    <div>
      <Link
        href={enlace}
        className={`${clases} transition hover:-translate-y-0.5 hover:border-primario/50 focus-visible:outline-2 focus-visible:outline-primario`}
      >
        <dl className="contents">{contenido}</dl>
      </Link>
    </div>
  ) : (
    <dl className={clases}>{contenido}</dl>
  );
}

// Responde de un vistazo "¿cuántos equipos hay disponibles?" antes de una clase.
export function IndicadoresPanel({ salas, incidencias }: Props) {
  const total = salas.reduce((suma, s) => suma + s.totalEquipos, 0);
  const funcionales = salas.reduce((suma, s) => suma + s.funcionales, 0);
  const enReparacion = salas.reduce((suma, s) => suma + s.enReparacion, 0);
  const dadosDeBaja = salas.reduce((suma, s) => suma + s.dadosDeBaja, 0);
  const pendientes = incidencias.abierta + incidencias.en_revision;

  return (
    <section aria-label="Indicadores" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <Indicador
        titulo="Disponibles"
        valor={funcionales}
        detalle={`de ${total} equipos · ${porcentaje(funcionales, total)} %`}
        color="text-funcional"
        enlace="/soporte?estado=funcional"
      />
      <Indicador
        titulo="En reparación"
        valor={enReparacion}
        detalle="con una falla en atención"
        color="text-reparacion"
        enlace="/soporte?estado=en_reparacion"
      />
      <Indicador
        titulo="Dados de baja"
        valor={dadosDeBaja}
        detalle="retirados de servicio"
        color="text-baja"
        enlace="/soporte?estado=dado_de_baja"
      />
      <Indicador
        titulo="Incidencias pendientes"
        valor={pendientes}
        detalle={`${incidencias.abierta} abiertas · ${incidencias.en_revision} en revisión`}
        color="text-primario"
        enlace="/soporte/incidencias?estado=abierta"
      />
    </section>
  );
}
