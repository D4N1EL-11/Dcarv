import type { HTMLAttributes } from 'react';

export function Tarjeta({ className = '', ...resto }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`rounded-xl border border-borde bg-superficie p-5 ${className}`} {...resto} />
  );
}
