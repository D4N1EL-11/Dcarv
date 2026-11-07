import { ANIOS_OBSOLESCENCIA, DIAS_AVISO_GARANTIA } from '@/lib/config/soporte';
import { ErrorDeNegocio } from './errores';
import { diasEntre } from './fechas';

// Hoja de vida técnica de un equipo: especificaciones, compra y garantía. Todo es opcional.

export type HojaDeVida = {
  marcaModelo: string | null;
  procesador: string | null;
  ramGb: number | null;
  discoGb: number | null;
  sistemaOperativo: string | null;
  numeroSerie: string | null;
  fechaCompra: string | null; // YYYY-MM-DD
  garantiaHasta: string | null; // YYYY-MM-DD
};

export type EstadoGarantia = 'sin_dato' | 'vigente' | 'por_vencer' | 'vencida';

export const ETIQUETA_GARANTIA: Record<EstadoGarantia, string> = {
  sin_dato: 'Sin dato',
  vigente: 'Vigente',
  por_vencer: 'Por vencer',
  vencida: 'Vencida',
};

export function estadoGarantia(garantiaHasta: string | null, hoy: string): EstadoGarantia {
  if (!garantiaHasta) return 'sin_dato';
  const restantes = diasEntre(hoy, garantiaHasta);
  if (restantes < 0) return 'vencida';
  return restantes <= DIAS_AVISO_GARANTIA ? 'por_vencer' : 'vigente';
}

// Años completos desde la compra (null sin fecha).
export function antiguedadAnios(fechaCompra: string | null, hoy: string): number | null {
  if (!fechaCompra) return null;
  return Math.max(0, Math.floor(diasEntre(fechaCompra, hoy) / 365.25));
}

export function esObsoleto(fechaCompra: string | null, hoy: string): boolean {
  const anios = antiguedadAnios(fechaCompra, hoy);
  return anios !== null && anios >= ANIOS_OBSOLESCENCIA;
}

// La compra no puede ser futura y la garantía no puede terminar antes de la compra.
export function validarHojaDeVida(hoja: HojaDeVida, hoy: string): HojaDeVida {
  if (hoja.fechaCompra && hoja.fechaCompra > hoy) {
    throw new ErrorDeNegocio('DATOS_INVALIDOS', 'La fecha de compra no puede ser futura.');
  }
  if (hoja.fechaCompra && hoja.garantiaHasta && hoja.garantiaHasta < hoja.fechaCompra) {
    throw new ErrorDeNegocio('DATOS_INVALIDOS', 'La garantía no puede terminar antes de la compra.');
  }
  return hoja;
}
