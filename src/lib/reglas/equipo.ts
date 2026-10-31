import { ESTADOS_EQUIPO } from '@/lib/config/soporte';
import { ErrorDeNegocio } from './errores';

export type EstadoEquipo = (typeof ESTADOS_EQUIPO)[number];

export const ETIQUETA_EQUIPO: Record<EstadoEquipo, string> = {
  funcional: 'Funcional',
  en_reparacion: 'En reparación',
  dado_de_baja: 'Dado de baja',
};

// Recorta y conserva la grafía: el plan (10.5) respeta mayúsculas.
export function normalizarCodigo(codigo: string): string {
  return codigo.trim();
}

export function esEstadoEquipoValido(estado: string): estado is EstadoEquipo {
  return (ESTADOS_EQUIPO as readonly string[]).includes(estado);
}

export function validarDatosEquipo(d: { codigo: string; sala: string }): void {
  if (!d.codigo.trim() || !d.sala.trim()) throw new ErrorDeNegocio('DATOS_INVALIDOS');
}
