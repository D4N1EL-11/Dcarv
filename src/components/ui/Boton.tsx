import type { ButtonHTMLAttributes } from 'react';
import { Spinner } from './spinner';

// Botón único de la app (módulo y pantallas de acceso).

const VARIANTES = {
  primario: 'bg-primario text-fondo hover:bg-primario-fuerte',
  secundario: 'border border-borde bg-transparent text-texto hover:border-primario/60 hover:text-primario',
  peligro: 'border border-baja/40 bg-baja/10 text-baja hover:bg-baja/20',
  fantasma: 'text-primario hover:bg-primario-suave',
};

// 'grande': botón principal de las pantallas de acceso (login, registro, recuperación).
const TAMANOS = {
  normal: 'px-4 py-2',
  grande: 'px-5 py-3',
};

type Variante = keyof typeof VARIANTES;
type Tamano = keyof typeof TAMANOS;

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: Variante;
  tamano?: Tamano;
  cargando?: boolean;
};

export const CLASES_BOTON =
  'inline-flex items-center justify-center rounded-lg text-sm font-medium tracking-wide transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario disabled:cursor-not-allowed disabled:opacity-60';

export function clasesBoton(variante: Variante = 'primario', tamano: Tamano = 'normal') {
  return `${CLASES_BOTON} ${TAMANOS[tamano]} ${VARIANTES[variante]}`;
}

export function Boton({
  variante = 'primario',
  tamano = 'normal',
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
      aria-busy={cargando || undefined}
      className={`${clasesBoton(variante, tamano)} gap-2 ${cargando ? 'disabled:cursor-wait disabled:opacity-80' : ''} ${className}`}
      {...resto}
    >
      {cargando ? <Spinner size="sm" decorativo /> : null}
      {children}
    </button>
  );
}
