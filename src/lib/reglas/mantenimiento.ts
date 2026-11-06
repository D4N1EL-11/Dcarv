import {
  DIAS_AVISO_MANTENIMIENTO,
  LARGO_MAXIMO_NOTAS_MANTENIMIENTO,
  MAXIMO_DIAS_MANTENIMIENTO,
  MINIMO_DIAS_MANTENIMIENTO,
} from '@/lib/config/soporte';
import { ErrorDeNegocio } from './errores';
import { diasEntre, sumarDias } from './fechas';

// Mantenimiento preventivo por sala: cada N días. La próxima revisión se cuenta desde el último
// mantenimiento o, si todavía no hay ninguno, desde el día en que se programó.

export type EstadoMantenimiento = 'sin_plan' | 'vencido' | 'proximo' | 'al_dia';

export const ETIQUETA_MANTENIMIENTO: Record<EstadoMantenimiento, string> = {
  sin_plan: 'Sin plan',
  vencido: 'Vencido',
  proximo: 'Próximo',
  al_dia: 'Al día',
};

export type PlanSala = {
  cadaDias: number | null;
  desde: string | null; // día en que se programó (YYYY-MM-DD)
  ultimo: string | null; // último mantenimiento registrado
};

export function validarFrecuencia(dias: number): number {
  if (!Number.isInteger(dias) || dias < MINIMO_DIAS_MANTENIMIENTO || dias > MAXIMO_DIAS_MANTENIMIENTO) {
    throw new ErrorDeNegocio(
      'DATOS_INVALIDOS',
      `La frecuencia debe ser un número entero de días entre ${MINIMO_DIAS_MANTENIMIENTO} y ${MAXIMO_DIAS_MANTENIMIENTO}.`,
    );
  }
  return dias;
}

// La fecha de un mantenimiento: no puede ser futura ni de hace más de un año (un error de digitación).
export function validarFechaMantenimiento(fecha: string, hoy: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) || Number.isNaN(Date.parse(`${fecha}T00:00:00Z`))) {
    throw new ErrorDeNegocio('DATOS_INVALIDOS', 'Escriba una fecha válida.');
  }
  if (diasEntre(hoy, fecha) > 0) throw new ErrorDeNegocio('DATOS_INVALIDOS', 'La fecha no puede ser futura.');
  if (diasEntre(fecha, hoy) > 365) {
    throw new ErrorDeNegocio('DATOS_INVALIDOS', 'La fecha no puede ser de hace más de un año.');
  }
  return fecha;
}

export function validarNotasMantenimiento(notas: string): string {
  const limpias = notas.trim();
  if (limpias.length > LARGO_MAXIMO_NOTAS_MANTENIMIENTO) {
    throw new ErrorDeNegocio('DATOS_INVALIDOS', `Las notas no pueden pasar de ${LARGO_MAXIMO_NOTAS_MANTENIMIENTO} caracteres.`);
  }
  return limpias;
}

// Día en que toca la próxima revisión; null si la sala no tiene plan.
export function proximoMantenimiento(plan: PlanSala): string | null {
  if (!plan.cadaDias) return null;
  const base = plan.ultimo ?? plan.desde;
  return base ? sumarDias(base, plan.cadaDias) : null;
}

export function estadoMantenimiento(plan: PlanSala, hoy: string): EstadoMantenimiento {
  const proximo = proximoMantenimiento(plan);
  if (!proximo) return 'sin_plan';
  const faltan = diasEntre(hoy, proximo);
  if (faltan < 0) return 'vencido';
  if (faltan <= DIAS_AVISO_MANTENIMIENTO) return 'proximo';
  return 'al_dia';
}

// "vence hoy", "vence mañana", "vence en 5 días", "vencido hace 3 días".
export function textoVencimiento(proximo: string, hoy: string): string {
  const faltan = diasEntre(hoy, proximo);
  if (faltan === 0) return 'vence hoy';
  if (faltan === 1) return 'vence mañana';
  if (faltan > 1) return `vence en ${faltan} días`;
  return faltan === -1 ? 'vencido desde ayer' : `vencido hace ${-faltan} días`;
}

// Orden de la lista: lo vencido primero (lo más atrasado arriba), luego lo próximo, lo al día y
// por último las salas sin plan.
export function compararPlanes(
  a: { estado: EstadoMantenimiento; proximo: string | null; nombre: string },
  b: { estado: EstadoMantenimiento; proximo: string | null; nombre: string },
): number {
  const peso = { vencido: 0, proximo: 1, al_dia: 2, sin_plan: 3 };
  return (
    peso[a.estado] - peso[b.estado] ||
    (a.proximo ?? '').localeCompare(b.proximo ?? '') ||
    a.nombre.localeCompare(b.nombre, 'es')
  );
}
