import { Insignia, type TonoInsignia } from '@/components/ui/Insignia';
import { ETIQUETA_SLA, evaluarSla, textoHoras, textoSla, type CasoSla, type EstadoSla } from '@/lib/reglas/sla';

const TONO: Record<EstadoSla, TonoInsignia> = {
  a_tiempo: 'neutro',
  por_vencer: 'reparacion',
  vencido: 'baja',
  cumplido: 'funcional',
  incumplido: 'baja',
};

// Tiempo de atención frente a la meta de su prioridad. Se dibuja en el servidor con la hora de
// la petición: cada vez que la página se refresca, el texto se actualiza.
export function InsigniaSla({ caso, ahora = new Date() }: { caso: CasoSla; ahora?: Date }) {
  const resultado = evaluarSla(caso, ahora);
  return (
    <span title={`${ETIQUETA_SLA[resultado.estado]} · meta de ${textoHoras(resultado.metaHoras)} para esta prioridad`}>
      <Insignia tono={TONO[resultado.estado]} texto={textoSla(resultado)} />
    </span>
  );
}
