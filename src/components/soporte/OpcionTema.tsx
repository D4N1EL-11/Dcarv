'use client';

import { useEffect, useState } from 'react';
import { Icono } from '@/components/ui/Icono';
import { aplicarTema, temaActual, type Tema } from '@/lib/tema';

// Opción del menú de usuario: cambia entre el tema oscuro y el claro (se recuerda en este navegador).
export function OpcionTema({ className }: { className: string }) {
  const [tema, setTema] = useState<Tema>('oscuro');
  useEffect(() => setTema(temaActual()), []);
  const siguiente: Tema = tema === 'claro' ? 'oscuro' : 'claro';
  return (
    <button
      role="menuitem"
      type="button"
      className={className}
      onClick={() => {
        aplicarTema(siguiente);
        setTema(siguiente);
      }}
    >
      <Icono nombre={siguiente === 'claro' ? 'sol' : 'luna'} className="size-4 text-texto-suave" />
      {siguiente === 'claro' ? 'Tema claro' : 'Tema oscuro'}
    </button>
  );
}
