import { ESTADOS_INCIDENCIA } from '@/lib/config/soporte';
import { ErrorDeNegocio } from './errores';

export type EstadoIncidencia = (typeof ESTADOS_INCIDENCIA)[number];

export const ETIQUETA_INCIDENCIA: Record<EstadoIncidencia, string> = {
  abierta: 'Abierta',
  en_revision: 'En revisión',
  cerrada: 'Cerrada',
};

export function validarDescripcion(descripcion: string): void {
  if (descripcion.trim().length < 3) {
    throw new ErrorDeNegocio('DATOS_INVALIDOS', 'La descripción debe tener al menos 3 caracteres.');
  }
}

export function formatearNumeroCaso(n: number): string {
  return `INC-${String(n).padStart(4, '0')}`;
}

export function puedeAsignarse(estado: EstadoIncidencia): boolean {
  return estado === 'abierta';
}
