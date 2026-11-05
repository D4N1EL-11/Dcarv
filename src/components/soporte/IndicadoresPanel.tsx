import Link from 'next/link';
import { Icono, type NombreIcono } from '@/components/ui/Icono';
import type { ConteoIncidencias, FilaSala } from '@/lib/dataService';
import { porcentaje } from '@/lib/formato';

type Props = { salas: FilaSala[]; incidencias: ConteoIncidencias };

function Indicador({
  titulo,
  valor,
  detalle,
  color,
  icono,
  enlace,
}: {
  titulo: string;
  valor: number;
  detalle: string;
  color: string;
  icono: NombreIcono;
  enlace: string;
}) {
  // Cifra grande en la sans del texto (no en la serif de los títulos) y en tinta de texto:
  // el color de estado va en el ícono, que acompaña a la etiqueta.
  return (
    <Link
      href={enlace}
      className="group grid h-full content-start gap-3 rounded-xl border border-borde bg-superficie p-5 transition hover:-translate-y-0.5 hover:border-primario/50 focus-visible:outline-2 focus-visible:outline-primario"
    >
      <span className="flex items-center justify-between gap-2">
        <span className="text-[0.7rem] font-medium uppercase tracking-[0.2em] text-texto-suave">{titulo}</span>
        <span className={`grid size-8 place-items-center rounded-full bg-superficie-alta ${color}`}>
          <Icono nombre={icono} />
        </span>
      </span>
      <span className="text-4xl font-semibold leading-none text-texto">{valor}</span>
      <span className="text-xs text-texto-suave">{detalle}</span>
    </Link>
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
        icono="check"
        enlace="/soporte?estado=funcional"
      />
      <Indicador
        titulo="En reparación"
        valor={enReparacion}
        detalle="con una falla en atención"
        color="text-reparacion"
        icono="tecnicos"
        enlace="/soporte?estado=en_reparacion"
      />
      <Indicador
        titulo="Dados de baja"
        valor={dadosDeBaja}
        detalle="retirados de servicio"
        color="text-baja"
        icono="cerrar"
        enlace="/soporte?estado=dado_de_baja"
      />
      <Indicador
        titulo="Pendientes"
        valor={pendientes}
        detalle={`${incidencias.abierta} abiertas · ${incidencias.en_revision} en revisión`}
        color="text-primario"
        icono="incidencias"
        enlace={incidencias.abierta ? '/soporte/incidencias?estado=abierta' : '/soporte/incidencias?estado=en_revision'}
      />
    </section>
  );
}
