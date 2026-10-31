import { Insignia, type TonoInsignia } from '@/components/ui/Insignia';
import { etiquetaEstadoEquipo } from '@/lib/formato';
import type { EstadoEquipo } from '@/lib/reglas/equipo';

const TONO: Record<EstadoEquipo, TonoInsignia> = {
  funcional: 'funcional',
  en_reparacion: 'reparacion',
  dado_de_baja: 'baja',
};

export function InsigniaEstadoEquipo({ estado }: { estado: EstadoEquipo }) {
  return <Insignia tono={TONO[estado]} texto={etiquetaEstadoEquipo(estado)} />;
}
