import type { MapaDeCalor as Datos } from '@/lib/dataService';

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const DIAS_CORTOS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

// Escala secuencial de un solo tono (el dorado del tema), de la superficie al dorado pleno. Se
// mezcla con color-mix: los mismos niveles sirven en el tema oscuro y en el claro.
const NIVELES = [0, 22, 42, 64, 86];

function nivel(valor: number, maximo: number): number {
  if (!valor || !maximo) return 0;
  return Math.min(NIVELES.length - 1, 1 + Math.floor(((valor - 1) / maximo) * (NIVELES.length - 1)));
}

function fondo(indice: number): string {
  return indice === 0
    ? 'var(--color-superficie-alta)'
    : `color-mix(in oklab, var(--color-primario) ${NIVELES[indice]}%, var(--color-superficie-alta))`;
}

const hora = (h: number) => `${String(h).padStart(2, '0')}:00`;

// Mapa de calor de reportes por día de la semana y hora (Bogotá). Cada celda dice su valor al
// pasar el cursor; la tabla equivalente queda disponible para lectores de pantalla y para copiar.
export function MapaDeCalor({ datos }: { datos: Datos }) {
  const { celdas, maximo, total } = datos;
  const pico = celdas
    .flatMap((fila, d) => fila.map((valor, h) => ({ valor, d, h })))
    .reduce((mejor, celda) => (celda.valor > mejor.valor ? celda : mejor), { valor: 0, d: 0, h: 0 });

  return (
    <div className="grid gap-4">
      <p className="text-sm text-texto-suave">
        {total
          ? `${total} reportes en los últimos ${datos.dias} días. El momento con más reportes: ${DIAS[pico.d]!.toLowerCase()} a las ${hora(pico.h)} (${pico.valor}).`
          : `Sin reportes en los últimos ${datos.dias} días.`}
      </p>
      <div className="overflow-x-auto pb-1">
        <div className="grid min-w-[42rem] grid-cols-[3rem_repeat(24,minmax(0,1fr))] gap-[2px]" aria-hidden="true">
          <span />
          {Array.from({ length: 24 }, (_, h) => (
            <span key={h} className="pb-1 text-center text-[0.6rem] tabular-nums text-texto-suave">
              {h % 3 === 0 ? h : ''}
            </span>
          ))}
          {celdas.map((fila, d) => (
            <div key={d} className="contents">
              <span className="self-center pr-2 text-xs text-texto-suave">{DIAS_CORTOS[d]}</span>
              {fila.map((valor, h) => (
                <span
                  key={h}
                  title={`${DIAS[d]} ${hora(h)}–${hora((h + 1) % 24)}: ${valor} ${valor === 1 ? 'reporte' : 'reportes'}`}
                  className="aspect-square rounded-[3px] transition hover:outline hover:outline-2 hover:outline-texto"
                  style={{ background: fondo(nivel(valor, maximo)) }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-texto-suave">
        <span className="flex items-center gap-2">
          Menos
          {NIVELES.map((_, i) => (
            <span key={i} aria-hidden="true" className="size-3.5 rounded-[3px]" style={{ background: fondo(i) }} />
          ))}
          Más{maximo ? ` (máximo ${maximo} por hora)` : ''}
        </span>
        <details className="group">
          <summary className="cursor-pointer text-primario underline-offset-4 hover:underline">Ver como tabla</summary>
          <div className="mt-2 max-h-72 overflow-auto rounded-lg border border-borde">
            <table className="w-full text-xs tabular-nums">
              <caption className="sr-only">Reportes por día y hora</caption>
              <thead className="sticky top-0 bg-superficie-alta">
                <tr>
                  <th scope="col" className="px-2 py-1 text-left">Hora</th>
                  {DIAS_CORTOS.map((d) => (
                    <th key={d} scope="col" className="px-2 py-1 text-right">
                      {d}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-borde">
                {Array.from({ length: 24 }, (_, h) => (
                  <tr key={h}>
                    <th scope="row" className="px-2 py-1 text-left font-normal">
                      {hora(h)}
                    </th>
                    {celdas.map((fila, d) => (
                      <td key={d} className="px-2 py-1 text-right">
                        {fila[h] || '·'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </div>
    </div>
  );
}
