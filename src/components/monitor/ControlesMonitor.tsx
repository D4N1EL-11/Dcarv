'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Icono } from '@/components/ui/Icono';
import { useRefrescar } from '@/hooks/use-refrescar';
import { SEGUNDOS_REFRESCO_MONITOR, ZONA_HORARIA } from '@/lib/config/soporte';

const formatoHora = new Intl.DateTimeFormat('es-CO', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  timeZone: ZONA_HORARIA,
});

// Reloj, botón de pantalla completa y refresco automático del modo monitor. El refresco se pausa
// mientras la pestaña está oculta y se pone al día apenas vuelve a verse.
export function ControlesMonitor({ generado }: { generado: string }) {
  const { refrescar } = useRefrescar();
  const [ahora, setAhora] = useState<Date | null>(null);
  const [completa, setCompleta] = useState(false);

  useEffect(() => {
    setAhora(new Date());
    const reloj = window.setInterval(() => setAhora(new Date()), 1000);
    return () => window.clearInterval(reloj);
  }, []);

  useEffect(() => {
    let ultima = Date.now();
    const intervalo = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      ultima = Date.now();
      refrescar();
    }, SEGUNDOS_REFRESCO_MONITOR * 1000);
    function alVolver() {
      if (document.visibilityState === 'visible' && Date.now() - ultima > SEGUNDOS_REFRESCO_MONITOR * 1000) {
        ultima = Date.now();
        refrescar();
      }
    }
    document.addEventListener('visibilitychange', alVolver);
    return () => {
      window.clearInterval(intervalo);
      document.removeEventListener('visibilitychange', alVolver);
    };
  }, [refrescar]);

  useEffect(() => {
    const cambio = () => setCompleta(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', cambio);
    return () => document.removeEventListener('fullscreenchange', cambio);
  }, []);

  function alternarPantallaCompleta() {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen?.();
  }

  return (
    <div className="flex items-center gap-4 sm:gap-6">
      <div className="text-right">
        <p className="font-titulo text-3xl font-semibold tabular-nums text-primario sm:text-4xl" suppressHydrationWarning>
          {ahora ? formatoHora.format(ahora) : '··:··:··'}
        </p>
        <p className="text-xs text-texto-suave">
          Datos de las {formatoHora.format(new Date(generado))} · cada {SEGUNDOS_REFRESCO_MONITOR} s
        </p>
      </div>
      <button
        type="button"
        onClick={alternarPantallaCompleta}
        aria-label={completa ? 'Salir de pantalla completa' : 'Pantalla completa'}
        title={completa ? 'Salir de pantalla completa (Esc)' : 'Pantalla completa'}
        className="grid size-10 place-items-center rounded-full border border-borde text-texto-suave transition hover:border-primario/60 hover:text-primario"
      >
        <Icono nombre="pantallaCompleta" className="size-5" />
      </button>
      {completa ? null : (
        <Link
          href="/soporte"
          aria-label="Volver al panel"
          title="Volver al panel"
          className="grid size-10 place-items-center rounded-full border border-borde text-texto-suave transition hover:border-primario/60 hover:text-primario"
        >
          <Icono nombre="cerrar" className="size-5" />
        </Link>
      )}
    </div>
  );
}
