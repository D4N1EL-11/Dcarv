'use client';

import { useEffect, useRef, useState } from 'react';
import { formatearDiaCorto, formatearFecha } from '@/lib/formato';
import type { PuntoActividad } from '@/lib/reglas/estadisticas';

const ALTO = 320;
const MARGEN = { arriba: 12, derecha: 4, abajo: 28, izquierda: 30 };
const SEPARACION = 2; // espacio del color de la superficie entre las dos columnas de un día
const SERIES = [
  { clave: 'reportadas', nombre: 'Reportadas', color: 'var(--color-serie-1)' },
  { clave: 'cerradas', nombre: 'Cerradas', color: 'var(--color-serie-2)' },
] as const;

// Tope del eje múltiplo de 4: las marcas 0, ½ y tope quedan en enteros.
function topeEje(maximo: number): number {
  return Math.max(4, Math.ceil(maximo / 4) * 4);
}

// Columna con el extremo de datos redondeado (4 px) y la base recta sobre el eje.
function columna(x: number, y: number, ancho: number, base: number): string {
  const alto = base - y;
  const r = Math.min(4, ancho / 2, alto);
  return `M${x},${base} V${y + r} Q${x},${y} ${x + r},${y} H${x + ancho - r} Q${x + ancho},${y} ${x + ancho},${y + r} V${base} Z`;
}

// Columnas agrupadas por día (reportadas y cerradas, misma unidad, un solo eje). Pasar el mouse o
// recorrer con las flechas resalta el día y muestra sus dos valores; la tabla de abajo los da todos.
export function GraficoActividad({ serie }: { serie: PuntoActividad[] }) {
  const contenedor = useRef<HTMLDivElement>(null);
  const [ancho, setAncho] = useState(720);
  const [indice, setIndice] = useState<number | null>(null);

  useEffect(() => {
    const elemento = contenedor.current;
    if (!elemento) return undefined;
    const observador = new ResizeObserver(([entrada]) => {
      if (entrada) setAncho(Math.max(280, Math.round(entrada.contentRect.width)));
    });
    observador.observe(elemento);
    return () => observador.disconnect();
  }, []);

  if (!serie.length) return null;
  const n = serie.length;
  const tope = topeEje(Math.max(...serie.map((p) => Math.max(p.reportadas, p.cerradas))));
  const anchoUtil = ancho - MARGEN.izquierda - MARGEN.derecha;
  const base = ALTO - MARGEN.abajo;
  const banda = anchoUtil / n;
  const anchoColumna = Math.max(1.5, Math.min(10, (banda * 0.8 - SEPARACION) / 2));
  const inicioBanda = (i: number) => MARGEN.izquierda + i * banda;
  const centroBanda = (i: number) => inicioBanda(i) + banda / 2;
  const y = (valor: number) => MARGEN.arriba + (base - MARGEN.arriba) * (1 - valor / tope);
  const marcasX = [0, Math.round((n - 1) / 3), Math.round((2 * (n - 1)) / 3), n - 1];
  const totales = serie.reduce(
    (suma, p) => ({ reportadas: suma.reportadas + p.reportadas, cerradas: suma.cerradas + p.cerradas }),
    { reportadas: 0, cerradas: 0 },
  );

  function alTeclear(evento: React.KeyboardEvent<SVGSVGElement>) {
    if (evento.key === 'ArrowRight' || evento.key === 'ArrowLeft') {
      evento.preventDefault();
      const paso = evento.key === 'ArrowRight' ? 1 : -1;
      setIndice((actual) => Math.min(n - 1, Math.max(0, (actual ?? n - 1) + paso)));
    } else if (evento.key === 'Escape') setIndice(null);
  }

  const punto = indice === null ? null : serie[indice]!;
  const centro = indice === null ? 0 : centroBanda(indice);
  const tooltipALaIzquierda = centro > ancho * 0.6;

  return (
    <figure className="grid gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <figcaption className="text-sm text-texto-suave">
          {totales.reportadas} reportadas y {totales.cerradas} cerradas en los últimos {n - 1} días
        </figcaption>
        <ul className="flex gap-4 text-xs text-texto-suave" aria-label="Leyenda">
          {SERIES.map((s) => (
            <li key={s.clave} className="flex items-center gap-2">
              <span aria-hidden="true" className="size-2.5 rounded-sm" style={{ background: s.color }} />
              {s.nombre}
            </li>
          ))}
        </ul>
      </div>

      <div ref={contenedor} className="relative">
        <svg
          width={ancho}
          height={ALTO}
          role="img"
          tabIndex={0}
          aria-label={`Incidencias por día: ${totales.reportadas} reportadas y ${totales.cerradas} cerradas en los últimos ${n - 1} días. Use las flechas para recorrer los días.`}
          onKeyDown={alTeclear}
          onFocus={() => setIndice((actual) => actual ?? n - 1)}
          onBlur={() => setIndice(null)}
          onPointerLeave={() => setIndice(null)}
          className="block max-w-full rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primario"
        >
          {indice !== null ? (
            <rect x={inicioBanda(indice)} y={MARGEN.arriba} width={banda} height={base - MARGEN.arriba} rx={4} fill="var(--color-superficie-alta)" />
          ) : null}

          {[0, tope / 2, tope].map((marca) => (
            <g key={marca}>
              <line x1={MARGEN.izquierda} x2={ancho - MARGEN.derecha} y1={y(marca)} y2={y(marca)} stroke="var(--color-borde)" strokeWidth={1} />
              <text x={MARGEN.izquierda - 8} y={y(marca)} dy="0.32em" textAnchor="end" className="fill-texto-suave text-[11px] tabular-nums">
                {marca}
              </text>
            </g>
          ))}
          {marcasX.map((i) => (
            <text key={i} x={centroBanda(i)} y={ALTO - 8} textAnchor={i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'} className="fill-texto-suave text-[11px]">
              {i === n - 1 ? 'Hoy' : formatearDiaCorto(serie[i]!.dia)}
            </text>
          ))}

          {serie.map((p, i) => {
            const x0 = centroBanda(i) - anchoColumna - SEPARACION / 2;
            return SERIES.map((s, j) =>
              p[s.clave] > 0 ? (
                <path key={`${p.dia}-${s.clave}`} d={columna(x0 + j * (anchoColumna + SEPARACION), y(p[s.clave]), anchoColumna, base)} fill={s.color} />
              ) : null,
            );
          })}

          {/* Zona de captura por día: toda la franja, no solo la columna pintada. */}
          {serie.map((p, i) => (
            <rect
              key={p.dia}
              x={inicioBanda(i)}
              y={MARGEN.arriba}
              width={banda}
              height={base - MARGEN.arriba}
              fill="transparent"
              onPointerEnter={() => setIndice(i)}
            />
          ))}
        </svg>

        {punto ? (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-2 z-10 min-w-36 rounded-lg border border-borde bg-superficie-alta px-3 py-2 text-xs shadow-xl shadow-black/40"
            style={tooltipALaIzquierda ? { right: ancho - centro + banda } : { left: centro + banda }}
          >
            <p className="mb-1 text-texto-suave">{formatearFecha(punto.dia)}</p>
            {SERIES.map((s) => (
              <p key={s.clave} className="flex items-center gap-2">
                <span className="h-0.5 w-3 rounded-full" style={{ background: s.color }} />
                <span className="font-semibold tabular-nums text-texto">{punto[s.clave]}</span>
                <span className="text-texto-suave">{s.nombre.toLowerCase()}</span>
              </p>
            ))}
          </div>
        ) : null}
      </div>

      <details className="text-sm">
        <summary className="cursor-pointer text-xs text-texto-suave hover:text-texto">Ver los datos en una tabla</summary>
        <div className="mt-2 max-h-64 overflow-y-auto rounded-lg border border-borde">
          <table className="w-full text-xs">
            <caption className="sr-only">Incidencias reportadas y cerradas por día</caption>
            <thead className="sticky top-0 bg-superficie-alta text-left text-texto-suave">
              <tr>
                <th scope="col" className="px-3 py-2 font-medium">Día</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">Reportadas</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">Cerradas</th>
              </tr>
            </thead>
            <tbody>
              {[...serie].reverse().map((p) => (
                <tr key={p.dia} className="border-t border-borde">
                  <th scope="row" className="px-3 py-1.5 text-left font-normal">{formatearFecha(p.dia)}</th>
                  <td className="px-3 py-1.5 text-right tabular-nums">{p.reportadas}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{p.cerradas}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
