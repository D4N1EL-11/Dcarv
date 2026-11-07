'use client';

import { useEffect, useId, useRef } from 'react';
import { Icono } from './Icono';

// amplio: formularios largos (editar una guía, la hoja de vida de un equipo).
type Props = { titulo: string; alCerrar: () => void; children: React.ReactNode; amplio?: boolean };

export function Modal({ titulo, alCerrar, children, amplio = false }: Props) {
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
      className="fixed inset-0 z-50 grid animate-desvanecer place-items-center bg-black/70 p-4 backdrop-blur-sm"
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
        className={`w-full ${amplio ? 'max-h-[90dvh] max-w-2xl overflow-y-auto' : 'max-w-md'} animate-aparecer rounded-2xl border border-borde bg-superficie p-6 text-left text-texto shadow-2xl shadow-black/60 focus:outline-none`}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 id={idTitulo} className="text-2xl font-semibold leading-tight">
            {titulo}
          </h2>
          <button
            type="button"
            onClick={() => cerrar.current()}
            aria-label="Cerrar"
            className="-mr-1 rounded-lg p-1.5 text-texto-suave transition hover:bg-superficie-alta hover:text-texto"
          >
            <Icono nombre="cerrar" className="size-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
