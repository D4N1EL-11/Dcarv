import type { ButtonHTMLAttributes } from 'react';

const VARIANTES = {
  primario: 'bg-primario text-fondo hover:bg-primario-fuerte',
  secundario: 'border border-borde bg-transparent text-texto hover:border-primario/60 hover:text-primario',
  peligro: 'border border-baja/40 bg-baja/10 text-baja hover:bg-baja/20',
  fantasma: 'text-primario hover:bg-primario-suave',
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: keyof typeof VARIANTES;
  cargando?: boolean;
};

export const CLASES_BOTON =
  'inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium tracking-wide transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario disabled:cursor-not-allowed disabled:opacity-60';

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
