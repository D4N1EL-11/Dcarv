import { Icono, type NombreIcono } from '@/components/ui/Icono';
import { DIAS_REASIGNACION, DIAS_VENTANA_ALERTA } from '@/lib/config/soporte';
import type { ConteoIncidencias, ResumenCierres } from '@/lib/dataService';
import { formatearFecha, textoAntiguedad, textoPromedioDias } from '@/lib/formato';
import { diasEntre, hoyBogota } from '@/lib/reglas/fechas';

function Cifra({ icono, color, titulo, valor, detalle }: { icono: NombreIcono; color: string; titulo: string; valor: string; detalle: string }) {
  return (
    <div className="flex items-start gap-3 bg-superficie px-5 py-4">
      <span className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-superficie-alta ${color}`}>
        <Icono nombre={icono} />
      </span>
      <div className="grid min-w-0 gap-0.5">
        <dt className="text-[0.7rem] font-medium uppercase tracking-[0.18em] text-texto-suave">{titulo}</dt>
        <dd className="text-xl font-semibold leading-tight text-texto">{valor}</dd>
        <dd className="text-xs text-texto-suave">{detalle}</dd>
      </div>
    </div>
  );
}

// Cuatro cifras para saber cómo va el soporte: lo que falta, lo que más espera y el ritmo de cierre.
// Respetan los filtros del listado (sala, técnico, equipo y búsqueda).
export function ResumenIncidencias({ conteo, resumen }: { conteo: ConteoIncidencias; resumen: ResumenCierres }) {
  const pendientes = conteo.abierta + conteo.en_revision;
  const hoy = hoyBogota();
  const espera = resumen.pendienteMasAntigua ? diasEntre(resumen.pendienteMasAntigua, hoy) : null;
  return (
    // gap-px sobre el fondo del borde: líneas divisorias correctas en 1, 2 o 4 columnas.
    <dl className="grid gap-px overflow-hidden rounded-xl border border-borde bg-borde sm:grid-cols-2 lg:grid-cols-4">
      <Cifra
        icono="incidencias"
        color="text-reparacion"
        titulo="Pendientes"
        valor={String(pendientes)}
        detalle={`${conteo.abierta} abiertas · ${conteo.en_revision} en revisión`}
      />
      <Cifra
        icono="reloj"
        // En rojo cuando ya pasó el plazo de reasignación automática (RN-10).
        color={espera !== null && espera > DIAS_REASIGNACION ? 'text-baja' : 'text-revision'}
        titulo="La que más espera"
        valor={espera === null ? 'Ninguna' : textoAntiguedad(espera).replace(/^./, (l) => l.toUpperCase())}
        detalle={resumen.pendienteMasAntigua ? `Reportada el ${formatearFecha(resumen.pendienteMasAntigua)}` : 'No hay casos sin cerrar'}
      />
      <Cifra
        icono="check"
        color="text-funcional"
        titulo="Cerradas"
        valor={String(resumen.cerradas)}
        detalle={`En los últimos ${DIAS_VENTANA_ALERTA} días`}
      />
      <Cifra
        icono="grafico"
        color="text-primario"
        titulo="Tiempo medio de cierre"
        valor={textoPromedioDias(resumen.promedioDias)}
        detalle={`Del reporte al cierre · ${DIAS_VENTANA_ALERTA} días`}
      />
    </dl>
  );
}
