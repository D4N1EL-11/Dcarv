'use client';

import { useEffect, useId, useRef } from 'react';
import { Boton } from './Boton';

type Props = { titulo: string; alCerrar: () => void; children: React.ReactNode };

export function Modal({ titulo, alCerrar, children }: Props) {
  const idTitulo = useId();
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    panel.current?.focus();
    const alPresionar = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') alCerrar();
    };
    document.addEventListener('keydown', alPresionar);
    return () => document.removeEventListener('keydown', alPresionar);
  }, [alCerrar]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        tabIndex={-1}
        className="w-full max-w-md rounded-lg bg-superficie p-5 text-left text-texto shadow-lg focus:outline-none"
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 id={idTitulo} className="text-lg font-bold">
            {titulo}
          </h2>
          <Boton variante="fantasma" onClick={alCerrar}>
            Cerrar
          </Boton>
        </div>
        {children}
      </div>
    </div>
  );
}
