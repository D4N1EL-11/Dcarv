import { ZONA_HORARIA } from '@/lib/config/soporte';

export function hoyBogota(reloj: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: ZONA_HORARIA }).format(reloj);
}

function aUtc(fecha: string): number {
  const [anio = 0, mes = 1, dia = 1] = fecha.split('-').map(Number);
  return Date.UTC(anio, mes - 1, dia);
}

export function diasEntre(desde: string, hasta: string): number {
  return Math.round((aUtc(hasta) - aUtc(desde)) / 86_400_000);
}

export function dentroDeVentana(fecha: string, hoy: string, dias: number): boolean {
  return diasEntre(fecha, hoy) <= dias;
}

export function sumarDias(fecha: string, dias: number): string {
  return new Date(aUtc(fecha) + dias * 86_400_000).toISOString().slice(0, 10);
}

// Primer día que todavía cuenta en una ventana de `dias` días que termina hoy.
// Equivale a dentroDeVentana y permite filtrar en SQL con la fecha de Bogotá como parámetro.
export function inicioVentana(hoy: string, dias: number): string {
  return sumarDias(hoy, -dias);
}
