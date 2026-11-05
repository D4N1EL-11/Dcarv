import { aCsv } from '@/lib/csv';
import { hoyBogota } from '@/lib/reglas/fechas';

// Respuesta de descarga CSV: nombre con la fecha de Bogotá (equipos-2026-11-04.csv) y sin caché.
export function responderCsv(nombreBase: string, encabezados: string[], filas: unknown[][]): Response {
  return new Response(aCsv(encabezados, filas), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${nombreBase}-${hoyBogota()}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
