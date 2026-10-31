import type { HTMLAttributes } from 'react';

export function Tarjeta({ className = '', ...resto }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`rounded-lg border border-borde bg-superficie p-4 ${className}`} {...resto} />
  );
}
