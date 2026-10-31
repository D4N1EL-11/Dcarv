import type { ButtonHTMLAttributes } from 'react';

const VARIANTES = {
  primario: 'bg-primario text-white hover:brightness-110',
  secundario: 'border border-borde bg-superficie text-texto hover:bg-primario-suave',
  peligro: 'bg-baja text-white hover:brightness-110',
  fantasma: 'text-primario hover:bg-primario-suave',
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: keyof typeof VARIANTES;
  cargando?: boolean;
};

export const CLASES_BOTON =
  'inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario disabled:cursor-not-allowed disabled:opacity-60';

export function clasesBoton(variante: keyof typeof VARIANTES = 'primario') {
  return `${CLASES_BOTON} ${VARIANTES[variante]}`;
}

export function Boton({
  variante = 'primario',
  cargando = false,
  className = '',
  children,
  disabled,
  type = 'button',
  ...resto
}: Props) {
  return (
    <button
      type={type}
      disabled={disabled || cargando}
      aria-busy={cargando}
      className={`${clasesBoton(variante)} ${className}`}
      {...resto}
    >
      {cargando ? 'Procesando...' : children}
    </button>
  );
}
