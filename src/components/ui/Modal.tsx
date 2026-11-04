'use client';

import { useEffect, useId, useRef } from 'react';
import { Boton } from './Boton';

type Props = { titulo: string; alCerrar: () => void; children: React.ReactNode };

export function Modal({ titulo, alCerrar, children }: Props) {
  const idTitulo = useId();
  const panel = useRef<HTMLDivElement>(null);
  // Guardar la función en una referencia evita volver a enfocar el panel en cada render.
  const cerrar = useRef(alCerrar);
  cerrar.current = alCerrar;
  // Se captura en el primer render, antes de que un campo con autoFocus tome el foco.
  const anterior = useRef(
    typeof document === 'undefined' ? null : (document.activeElement as HTMLElement | null),
  );

  useEffect(() => {
    const previo = anterior.current;
    if (!panel.current?.contains(document.activeElement)) panel.current?.focus();
    const alPresionar = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') cerrar.current();
    };
    document.addEventListener('keydown', alPresionar);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', alPresionar);
      document.body.style.overflow = '';
      previo?.focus?.();
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"
      onMouseDown={(evento) => {
        if (evento.target === evento.currentTarget) cerrar.current();
      }}
    >
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
          <Boton variante="fantasma" onClick={() => cerrar.current()}>
            Cerrar
          </Boton>
        </div>
        {children}
      </div>
    </div>
  );
}
