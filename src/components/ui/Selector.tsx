import { useId, type SelectHTMLAttributes } from 'react';

type Props = SelectHTMLAttributes<HTMLSelectElement> & {
  etiqueta: string;
  opciones: { valor: string; texto: string }[];
  ocultarEtiqueta?: boolean;
};

export function Selector({ etiqueta, opciones, ocultarEtiqueta = false, ...resto }: Props) {
  const id = useId();
  return (
    <div className="grid gap-1">
      <label
        htmlFor={id}
        className={ocultarEtiqueta ? 'sr-only' : 'text-xs font-medium uppercase tracking-wider text-texto-suave'}
      >
        {etiqueta}
      </label>
      <select
        id={id}
        className="w-full rounded-lg border border-borde bg-fondo/60 px-3 py-2 text-sm text-texto transition focus:border-primario/70 focus:outline-none focus:ring-2 focus:ring-primario/20 disabled:opacity-60"
        {...resto}
      >
        {opciones.map((opcion) => (
          <option key={opcion.valor} value={opcion.valor}>
            {opcion.texto}
          </option>
        ))}
      </select>
    </div>
  );
}
