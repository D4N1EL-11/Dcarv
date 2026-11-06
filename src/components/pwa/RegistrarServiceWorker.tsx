'use client';

import { useEffect } from 'react';
import { guardarEventoInstalacion, type EventoInstalacion } from '@/lib/pwa';

// Registra el service worker (public/sw.js) y guarda el aviso de "se puede instalar". Solo en
// producción: en desarrollo un service worker guardaría versiones viejas de las páginas.
export function RegistrarServiceWorker() {
  useEffect(() => {
    const alPoderInstalar = (evento: Event) => {
      evento.preventDefault(); // el menú ofrece "Instalar la app" cuando la persona quiera
      guardarEventoInstalacion(evento as EventoInstalacion);
    };
    const alInstalar = () => guardarEventoInstalacion(null);
    window.addEventListener('beforeinstallprompt', alPoderInstalar);
    window.addEventListener('appinstalled', alInstalar);

    if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch((error: unknown) => {
        console.error('No se pudo registrar el service worker.', error);
      });
    }
    return () => {
      window.removeEventListener('beforeinstallprompt', alPoderInstalar);
      window.removeEventListener('appinstalled', alInstalar);
    };
  }, []);
  return null;
}
