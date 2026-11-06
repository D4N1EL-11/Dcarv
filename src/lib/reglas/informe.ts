import { sumarDias } from './fechas';

// Informe mensual: el mes llega en la URL como 'YYYY-MM' y se cuenta con fechas de Bogotá.

export type Mes = { anio: number; mes: number }; // mes: 1 a 12

const NOMBRES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

export function mesDe(fecha: string): Mes {
  const [anio = 0, mes = 1] = fecha.split('-').map(Number);
  return { anio, mes };
}

export function textoMes({ anio, mes }: Mes): string {
  return `${anio}-${String(mes).padStart(2, '0')}`;
}

export function nombreMes({ anio, mes }: Mes): string {
  return `${NOMBRES[mes - 1] ?? ''} de ${anio}`;
}

export function compararMeses(a: Mes, b: Mes): number {
  return a.anio - b.anio || a.mes - b.mes;
}

export function sumarMeses({ anio, mes }: Mes, cantidad: number): Mes {
  const indice = anio * 12 + (mes - 1) + cantidad;
  return { anio: Math.floor(indice / 12), mes: (indice % 12) + 1 };
}

// Primer y último día del mes (inclusive), para filtrar con BETWEEN en SQL.
export function rangoDelMes(m: Mes): { desde: string; hasta: string } {
  const desde = `${textoMes(m)}-01`;
  const hasta = sumarDias(`${textoMes(sumarMeses(m, 1))}-01`, -1);
  return { desde, hasta };
}

// Interpreta ?mes=. Sin valor, mal escrito o futuro: el mes actual. Nunca antes de `primero`
// (el mes del primer registro), para no ofrecer meses vacíos.
export function normalizarMes(valor: unknown, hoy: string, primero: Mes | null): Mes {
  const actual = mesDe(hoy);
  if (typeof valor !== 'string' || !/^\d{4}-(0[1-9]|1[0-2])$/.test(valor)) return actual;
  const pedido = mesDe(`${valor}-01`);
  if (compararMeses(pedido, actual) > 0) return actual;
  if (primero && compararMeses(pedido, primero) < 0) return primero;
  return pedido;
}

// Proporción en porcentaje entero; null si no hay base (se muestra "—" en vez de 0 %).
export function proporcion(parte: number, total: number): number | null {
  return total > 0 ? Math.round((parte / total) * 100) : null;
}

// Variación frente al mes anterior: "+3", "−2", "igual" o null si el mes anterior no tiene datos.
export function textoVariacion(actual: number, anterior: number | null): string | null {
  if (anterior === null) return null;
  const diferencia = actual - anterior;
  if (diferencia === 0) return 'igual que el mes anterior';
  return `${diferencia > 0 ? '+' : '−'}${Math.abs(diferencia)} frente al mes anterior`;
}
