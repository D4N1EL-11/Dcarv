import { Icono } from '@/components/ui/Icono';
import { Insignia, type TonoInsignia } from '@/components/ui/Insignia';
import {
  ETIQUETA_CATEGORIA,
  ETIQUETA_PRIORIDAD,
  type CategoriaIncidencia,
  type PrioridadIncidencia,
} from '@/lib/reglas/clasificacion';

// Prioridad: solo "Alta" llama la atención con color; "Media" y "Baja" son neutras para que la
// lista no se llene de colores que compiten con el estado del caso.
const TONO_PRIORIDAD: Record<PrioridadIncidencia, TonoInsignia> = {
  alta: 'baja', // rojo (el tono "baja" es el rojo de la paleta, no la prioridad baja)
  media: 'neutro',
  baja: 'neutro',
};

export function InsigniaPrioridad({ prioridad }: { prioridad: PrioridadIncidencia }) {
  return <Insignia tono={TONO_PRIORIDAD[prioridad]} texto={`Prioridad ${ETIQUETA_PRIORIDAD[prioridad].toLowerCase()}`} />;
}

export function EtiquetaCategoria({ categoria }: { categoria: CategoriaIncidencia }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-texto-suave" title="Categoría de la falla">
      <Icono nombre="etiqueta" className="size-3.5" />
      {ETIQUETA_CATEGORIA[categoria]}
    </span>
  );
}
