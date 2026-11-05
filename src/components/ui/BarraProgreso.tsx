'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { EVENTO_DATOS_CAMBIARON } from '@/lib/alertasVistas';
import { EVENTO_NAVEGANDO } from '@/lib/eventos';

type Fase = 'quieta' | 'cargando' | 'terminando';

// Barra dorada fina arriba de la pantalla mientras se carga otra página. El App Router no
// expone eventos de navegación: se arranca al pulsar un enlace interno, al enviar un formulario
// GET o con un aviso (router.push, refresco tras una acción), y se completa cuando cambia la URL.
export function BarraProgreso() {
  const ruta = usePathname();
  const parametros = useSearchParams();
  const [fase, setFase] = useState<Fase>('quieta');
  const seguridad = useRef<ReturnType<typeof setTimeout>>(undefined);

  // La URL cambió: la navegación terminó.
  useEffect(() => {
    setFase((actual) => (actual === 'cargando' ? 'terminando' : actual));
    const t = setTimeout(() => setFase((actual) => (actual === 'terminando' ? 'quieta' : actual)), 350);
    return () => clearTimeout(t);
  }, [ruta, parametros]);

  useEffect(() => {
    function empezar() {
      setFase('cargando');
      clearTimeout(seguridad.current);
      // Si la URL no llega a cambiar (error, misma página), la barra no se queda pegada.
      seguridad.current = setTimeout(() => setFase('quieta'), 10_000);
    }
    function alPulsar(evento: MouseEvent) {
      if (evento.defaultPrevented || evento.button !== 0) return;
      if (evento.metaKey || evento.ctrlKey || evento.shiftKey || evento.altKey) return;
      const enlace = (evento.target as Element | null)?.closest('a');
      if (!enlace || enlace.hasAttribute('download') || (enlace.target && enlace.target !== '_self')) return;
      const destino = new URL(enlace.href, window.location.href);
      if (destino.origin !== window.location.origin) return;
      if (destino.pathname === window.location.pathname && destino.search === window.location.search) return;
      empezar();
    }
    function alEnviar(evento: SubmitEvent) {
      const formulario = evento.target as HTMLFormElement | null;
      if (formulario?.method.toLowerCase() === 'get') empezar();
    }
    document.addEventListener('click', alPulsar, true);
    document.addEventListener('submit', alEnviar, true);
    window.addEventListener(EVENTO_NAVEGANDO, empezar);
    window.addEventListener(EVENTO_DATOS_CAMBIARON, empezar);
    return () => {
      document.removeEventListener('click', alPulsar, true);
      document.removeEventListener('submit', alEnviar, true);
      window.removeEventListener(EVENTO_NAVEGANDO, empezar);
      window.removeEventListener(EVENTO_DATOS_CAMBIARON, empezar);
      clearTimeout(seguridad.current);
    };
  }, []);

  if (fase === 'quieta') return null;
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-[70] h-0.5 print:hidden">
      {/* Cargando: crece de 0 a 85 % (cada vez más lento). Terminando: completa y se desvanece. */}
      <div
        className={`h-full bg-primario shadow-[0_0_8px_var(--color-primario)] ${fase === 'cargando' ? 'animate-progreso' : ''}`}
        style={fase === 'terminando' ? { width: '100%', opacity: 0, transition: 'opacity 300ms ease 120ms' } : undefined}
      />
    </div>
  );
}
