import { plural } from '@/lib/formato';
import { proporcion } from '@/lib/reglas/informe';

export type FilaBarra = { clave: string; etiqueta: string; valor: number; ayuda?: string | undefined };

type Props = {
  filas: FilaBarra[];
  // Cómo se nombra cada unidad ("caso"/"casos") en el texto y en la ayuda al pasar el cursor.
  unidad: [string, string];
  // true: de mayor a menor (comparar partes). false: en el orden dado (p. ej. prioridad alta → baja).
  ordenar?: boolean;
  titulo: string;
};

// Barras horizontales de una sola serie: un solo color (--color-serie-1, validado sobre la
// superficie oscura), todas sobre la misma línea base, con el nombre y la cifra en tinta de texto.
// Es a la vez gráfico y tabla: cada fila lleva su número y su porcentaje escritos.
export function BarrasHorizontales({ filas, unidad, ordenar = true, titulo }: Props) {
  const total = filas.reduce((suma, f) => suma + f.valor, 0);
  const maximo = Math.max(1, ...filas.map((f) => f.valor));
  const lista = ordenar ? [...filas].sort((a, b) => b.valor - a.valor) : filas;
  return (
    <table className="w-full text-sm">
      <caption className="sr-only">{titulo}</caption>
      <thead className="sr-only">
        <tr>
          <th scope="col">Tipo</th>
          <th scope="col">Proporción</th>
          <th scope="col">Cantidad</th>
        </tr>
      </thead>
      <tbody>
        {lista.map((fila) => {
          const parte = proporcion(fila.valor, total);
          const texto = `${fila.etiqueta}: ${plural(fila.valor, unidad[0], unidad[1])}${parte === null ? '' : ` (${parte} %)`}`;
          return (
            <tr key={fila.clave} title={fila.ayuda ? `${texto}. ${fila.ayuda}` : texto} className="group">
              <th scope="row" className="w-36 py-1.5 pr-3 text-left font-normal text-texto sm:w-44">
                {fila.etiqueta}
              </th>
              <td className="py-1.5">
                {/* Pista y barra: la barra nace en la línea base y solo su extremo es redondeado. */}
                <div className="h-2.5 w-full rounded-r-[4px] bg-superficie-alta print:bg-black/10">
                  <div
                    className="h-full rounded-r-[4px] bg-serie-1 transition-[filter] group-hover:brightness-125 print:bg-black/60"
                    style={{ width: `${(fila.valor / maximo) * 100}%` }}
                  />
                </div>
              </td>
              <td className="w-24 py-1.5 pl-3 text-right tabular-nums text-texto">
                {fila.valor}
                <span className="ml-1.5 text-xs text-texto-suave">{parte === null ? '—' : `${parte} %`}</span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
