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
        className={ocultarEtiqueta ? 'sr-only' : 'text-sm font-semibold text-texto'}
      >
        {etiqueta}
      </label>
      <select
        id={id}
        className="w-full rounded-lg border border-borde bg-superficie px-3 py-2 text-sm text-texto focus-visible:outline-2 focus-visible:outline-primario disabled:opacity-60"
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
