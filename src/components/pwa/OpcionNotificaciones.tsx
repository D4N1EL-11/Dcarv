'use client';

import { useEffect, useState } from 'react';
import { useAvisos } from '@/components/ui/Avisos';
import { Icono } from '@/components/ui/Icono';
import { llamarApi } from '@/lib/clienteApi';

type Estado = 'oculto' | 'inactivas' | 'activas' | 'bloqueadas';

const CLAVE_PUBLICA = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '';

// La clave VAPID viaja en base64 "url-safe"; pushManager.subscribe la pide en bytes.
function aBytes(base64: string): Uint8Array<ArrayBuffer> {
  const relleno = '='.repeat((4 - (base64.length % 4)) % 4);
  const binario = atob((base64 + relleno).replace(/-/g, '+').replace(/_/g, '/'));
  const bytes = new Uint8Array(new ArrayBuffer(binario.length));
  for (let i = 0; i < binario.length; i += 1) bytes[i] = binario.charCodeAt(i);
  return bytes;
}

async function registro(): Promise<ServiceWorkerRegistration | null> {
  if (!CLAVE_PUBLICA || !('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
    return null;
  }
  return (await navigator.serviceWorker.getRegistration('/')) ?? null;
}

// Opción del menú de usuario: activa o desactiva las notificaciones push en este navegador.
// Solo aparece si el navegador las admite, hay service worker (producción) y el servidor tiene
// claves VAPID. Los avisos de la campana llegan entonces también al celular o al escritorio.
export function OpcionNotificaciones({ className }: { className: string }) {
  const { mostrar } = useAvisos();
  const [estado, setEstado] = useState<Estado>('oculto');
  const [trabajando, setTrabajando] = useState(false);

  useEffect(() => {
    void (async () => {
      const reg = await registro();
      if (!reg) return;
      if (Notification.permission === 'denied') setEstado('bloqueadas');
      else setEstado((await reg.pushManager.getSubscription()) ? 'activas' : 'inactivas');
    })();
  }, []);

  async function activar() {
    const reg = await registro();
    if (!reg) return;
    if ((await Notification.requestPermission()) !== 'granted') {
      setEstado('bloqueadas');
      mostrar('info', 'El navegador no dio permiso para mostrar notificaciones.');
      return;
    }
    const suscripcion = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: aBytes(CLAVE_PUBLICA) });
    const respuesta = await llamarApi('/api/soporte/push', 'POST', suscripcion.toJSON());
    if (!respuesta.ok) {
      await suscripcion.unsubscribe();
      mostrar('error', respuesta.mensaje);
      return;
    }
    setEstado('activas');
    mostrar('exito', 'Notificaciones activadas en este navegador.');
  }

  async function desactivar() {
    const suscripcion = await (await registro())?.pushManager.getSubscription();
    if (suscripcion) {
      await llamarApi('/api/soporte/push', 'DELETE', { endpoint: suscripcion.endpoint });
      await suscripcion.unsubscribe();
    }
    setEstado('inactivas');
    mostrar('exito', 'Notificaciones desactivadas en este navegador.');
  }

  if (estado === 'oculto') return null;
  if (estado === 'bloqueadas') {
    return (
      <p className={`${className} cursor-default text-texto-suave hover:bg-transparent`} title="Permítalas desde la configuración del sitio en el navegador">
        <Icono nombre="notificacion" className="size-4" /> Notificaciones bloqueadas
      </p>
    );
  }
  return (
    <button
      role="menuitem"
      type="button"
      disabled={trabajando}
      className={className}
      onClick={async () => {
        setTrabajando(true);
        try {
          await (estado === 'activas' ? desactivar() : activar());
        } catch (error) {
          console.error(error);
          mostrar('error', 'No se pudieron cambiar las notificaciones en este navegador.');
        } finally {
          setTrabajando(false);
        }
      }}
    >
      <Icono nombre="notificacion" className="size-4 text-texto-suave" />
      {estado === 'activas' ? 'Desactivar notificaciones' : 'Activar notificaciones'}
    </button>
  );
}
