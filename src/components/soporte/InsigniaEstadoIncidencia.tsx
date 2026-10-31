import { Insignia, type TonoInsignia } from '@/components/ui/Insignia';
import { etiquetaEstadoIncidencia } from '@/lib/formato';
import type { EstadoIncidencia } from '@/lib/reglas/incidencia';

const TONO: Record<EstadoIncidencia, TonoInsignia> = {
  abierta: 'reparacion',
  en_revision: 'revision',
  cerrada: 'funcional',
};

export function InsigniaEstadoIncidencia({ estado }: { estado: EstadoIncidencia }) {
  return <Insignia tono={TONO[estado]} texto={etiquetaEstadoIncidencia(estado)} />;
}
