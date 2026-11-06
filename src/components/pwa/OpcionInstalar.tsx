'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Icono } from '@/components/ui/Icono';
import { abiertaComoApp, EVENTO_INSTALABLE, eventoInstalacion, esIos, guardarEventoInstalacion } from '@/lib/pwa';

type Modo = 'oculto' | 'instalar' | 'ios';

// Opción "Instalar la app" del menú de usuario. En Chrome, Edge y Android abre el diálogo del
// navegador; en iPhone lleva a las instrucciones de la Ayuda. Ya instalada, no aparece.
export function OpcionInstalar({ className }: { className: string }) {
  const [modo, setModo] = useState<Modo>('oculto');

  useEffect(() => {
    const decidir = () => {
      if (abiertaComoApp()) setModo('oculto');
      else if (eventoInstalacion()) setModo('instalar');
      else setModo(esIos() ? 'ios' : 'oculto');
    };
    decidir();
    window.addEventListener(EVENTO_INSTALABLE, decidir);
    return () => window.removeEventListener(EVENTO_INSTALABLE, decidir);
  }, []);

  if (modo === 'oculto') return null;
  if (modo === 'ios') {
    return (
      <Link role="menuitem" href="/soporte/ayuda#instalar" className={className}>
        <Icono nombre="celular" className="size-4 text-texto-suave" /> Instalar en el iPhone
      </Link>
    );
  }
  return (
    <button
      role="menuitem"
      type="button"
      className={className}
      onClick={async () => {
        const evento = eventoInstalacion();
        if (!evento) return;
        await evento.prompt();
        await evento.userChoice;
        // El navegador permite mostrar su diálogo una sola vez por aviso; si vuelve a ofrecerlo,
        // llega un aviso nuevo y la opción reaparece.
        guardarEventoInstalacion(null);
      }}
    >
      <Icono nombre="celular" className="size-4 text-texto-suave" /> Instalar la app
    </button>
  );
}
