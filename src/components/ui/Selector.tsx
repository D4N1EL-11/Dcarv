import { useId, type SelectHTMLAttributes } from 'react';
import { Icono } from './Icono';

type Props = SelectHTMLAttributes<HTMLSelectElement> & {
  etiqueta: string;
  opciones: { valor: string; texto: string }[];
  ocultarEtiqueta?: boolean;
  // Versión baja para tablas y listas (cambiar estado en cada fila).
  compacto?: boolean;
};

// Lista desplegable con la flecha propia del tema (la nativa cambia según el sistema).
export function Selector({ etiqueta, opciones, ocultarEtiqueta = false, compacto = false, ...resto }: Props) {
  const id = useId();
  return (
    <div className="grid gap-1">
      <label
        htmlFor={id}
        className={ocultarEtiqueta ? 'sr-only' : 'text-xs font-medium uppercase tracking-wider text-texto-suave'}
      >
        {etiqueta}
      </label>
      <div className="relative">
        <select
          id={id}
          className={`w-full cursor-pointer appearance-none rounded-lg border border-borde bg-fondo/60 pl-3 pr-9 text-texto transition hover:border-primario/40 focus:border-primario/70 focus:outline-none focus:ring-2 focus:ring-primario/20 disabled:cursor-not-allowed disabled:opacity-60 ${compacto ? 'py-1.5 text-xs' : 'py-2 text-sm'}`}
          {...resto}
        >
          {opciones.map((opcion) => (
            <option key={opcion.valor} value={opcion.valor}>
              {opcion.texto}
            </option>
          ))}
        </select>
        <Icono
          nombre="abajo"
          className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-texto-suave"
        />
      </div>
    </div>
  );
}
