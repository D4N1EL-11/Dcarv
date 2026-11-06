// Instalación como app (PWA), solo en el navegador. Chrome, Edge y Android avisan una sola vez,
// al cargar, que la app se puede instalar (evento beforeinstallprompt); se guarda aquí para que
// el menú lo use cuando la persona lo pida, aunque el menú se abra después.

export const EVENTO_INSTALABLE = 'soporte:instalable';

export type EventoInstalacion = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

let pendiente: EventoInstalacion | null = null;

export function guardarEventoInstalacion(evento: EventoInstalacion | null): void {
  pendiente = evento;
  window.dispatchEvent(new Event(EVENTO_INSTALABLE));
}

export function eventoInstalacion(): EventoInstalacion | null {
  return pendiente;
}

// Ya abierta como app instalada (no en una pestaña del navegador).
export function abiertaComoApp(): boolean {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches === true ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

// iPhone y iPad no avisan: se instala desde "Compartir → Agregar a inicio".
export function esIos(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}
