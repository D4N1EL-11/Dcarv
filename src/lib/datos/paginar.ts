import { totalPaginas } from '@/lib/reglas/paginacion';
import type { Pagina } from './tipos';

// Convierte filas con la columna "totalFilas" (COUNT(*) OVER ()) en una página sin esa columna.
export function aPagina<T extends object>(
  filas: (T & { totalFilas: number })[],
  pagina: number,
  tamano: number,
): Pagina<T> {
  const total = filas[0]?.totalFilas ?? 0;
  const limpias = filas.map((fila) => {
    const copia: Partial<T & { totalFilas: number }> = { ...fila };
    delete copia.totalFilas;
    return copia as T;
  });
  return { filas: limpias, total, pagina, paginas: totalPaginas(total, tamano), tamano };
}
