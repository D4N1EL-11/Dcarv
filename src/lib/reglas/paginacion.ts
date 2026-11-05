// Reglas puras de paginación. La página llega de la URL: cualquier valor raro equivale a la primera.
const PAGINA_MAXIMA = 100_000;

export function normalizarPagina(valor: unknown): number {
  const texto = Array.isArray(valor) ? valor[0] : valor;
  if (typeof texto !== 'string' && typeof texto !== 'number') return 1;
  const numero = Number(texto);
  return Number.isInteger(numero) && numero >= 1 ? Math.min(numero, PAGINA_MAXIMA) : 1;
}

export function totalPaginas(total: number, tamano: number): number {
  return Math.max(1, Math.ceil(total / tamano));
}

export function desplazamiento(pagina: number, tamano: number): number {
  return (pagina - 1) * tamano;
}

// "Mostrando 26–50 de 120": posiciones (base 1) de la primera y la última fila de la página.
export function rangoVisible(
  pagina: number,
  tamano: number,
  total: number,
): { desde: number; hasta: number } {
  if (total <= 0) return { desde: 0, hasta: 0 };
  const desde = Math.min(desplazamiento(pagina, tamano) + 1, total + 1);
  return { desde, hasta: Math.min(desde + tamano - 1, total) };
}
