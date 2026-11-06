'use client';

import { useEffect } from 'react';

const CLAVE_INTENTO = 'soporte:sincronizar-sesion';
const ESPERA_ENTRE_INTENTOS = 30_000;

// Evita un ciclo de recargas si la cookie nueva no llega a guardarse (p. ej. sin HTTPS).
function intentoReciente(): boolean {
  try {
    const anterior = Number(window.sessionStorage.getItem(CLAVE_INTENTO) ?? 0);
    if (Date.now() - anterior < ESPERA_ENTRE_INTENTOS) return true;
    window.sessionStorage.setItem(CLAVE_INTENTO, String(Date.now()));
  } catch {
    // Sin almacenamiento (ventana privada): se intenta igual; la recarga solo ocurre si responde bien.
  }
  return false;
}

// El layout la dibuja cuando el rol de la sesión ya no coincide con el de la base (por ejemplo,
// un administrador acaba de aprobar el acceso de soporte). Pide una sesión nueva con el rol
// vigente y recarga, para que el menú y los permisos cambien sin cerrar sesión. Si falla, la
// página sigue con la sesión que tenía.
export function SincronizarSesion() {
  useEffect(() => {
    if (intentoReciente()) return undefined;
    let cancelado = false;
    void (async () => {
      try {
        const respuesta = await fetch('/api/auth/sesion', { method: 'POST', cache: 'no-store' });
        if (cancelado) return;
        if (respuesta.status === 401) {
          window.location.assign('/login?expirada=1');
          return;
        }
        if (respuesta.ok) window.location.reload();
      } catch {
        // Sin red: se reintenta en la próxima carga de página.
      }
    })();
    return () => {
      cancelado = true;
    };
  }, []);
  return null;
}
