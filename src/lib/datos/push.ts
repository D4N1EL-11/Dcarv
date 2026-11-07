import { after } from 'next/server';
import webpush from 'web-push';
import { consultar } from '@/lib/db/conexion';
import type { NuevoAviso } from '@/lib/reglas/avisos';
import { ErrorDeNegocio } from '@/lib/reglas/errores';
import { obtenerUrlBase } from '@/lib/urlBase';

// Notificaciones push (M14). Cada aviso de la campana sale también como push a los navegadores
// donde su destinatario las activó. Sin claves VAPID configuradas no se envía nada: la campana
// sigue funcionando igual.

export type SuscripcionPush = { endpoint: string; keys: { p256dh: string; auth: string } };

function clavesVapid(): { publica: string; privada: string } | null {
  const publica = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
  const privada = process.env.VAPID_PRIVATE_KEY?.trim();
  return publica && privada ? { publica, privada } : null;
}

export function pushConfigurado(): boolean {
  return clavesVapid() !== null;
}

let configurado = false;
function configurar(): boolean {
  const claves = clavesVapid();
  if (!claves) return false;
  if (!configurado) {
    // El "subject" identifica a quien envía ante el servicio push: un mailto: o la URL de la app.
    const sujeto = process.env.VAPID_SUBJECT?.trim() || obtenerUrlBase();
    webpush.setVapidDetails(sujeto, claves.publica, claves.privada);
    configurado = true;
  }
  return true;
}

export async function guardarSuscripcion(usuarioId: string, s: SuscripcionPush): Promise<void> {
  if (!pushConfigurado()) throw new ErrorDeNegocio('PUSH_NO_CONFIGURADO');
  // El mismo navegador vuelve a suscribirse con el mismo endpoint: queda a nombre de quien
  // tiene la sesión ahora (un computador compartido cambia de cuenta).
  await consultar(
    `INSERT INTO suscripciones_push (usuario_id, endpoint, p256dh, auth) VALUES ($1, $2, $3, $4)
     ON CONFLICT (endpoint) DO UPDATE SET usuario_id = EXCLUDED.usuario_id, p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth`,
    [usuarioId, s.endpoint, s.keys.p256dh, s.keys.auth],
  );
}

// Solo borra la suscripción si es de quien la pide.
export async function borrarSuscripcion(usuarioId: string, endpoint: string): Promise<void> {
  await consultar('DELETE FROM suscripciones_push WHERE endpoint = $1 AND usuario_id = $2', [endpoint, usuarioId]);
}

async function enviar(usuarioIds: string[], aviso: NuevoAviso): Promise<void> {
  if (!usuarioIds.length || !configurar()) return;
  const suscripciones = await consultar<{ endpoint: string; p256dh: string; auth: string }>(
    'SELECT endpoint, p256dh, auth FROM suscripciones_push WHERE usuario_id = ANY($1::uuid[])',
    [usuarioIds],
  );
  const cuerpo = JSON.stringify({ titulo: aviso.titulo, detalle: aviso.detalle, enlace: aviso.enlace });
  await Promise.all(
    suscripciones.map(async ({ endpoint, p256dh, auth }) => {
      try {
        await webpush.sendNotification({ endpoint, keys: { p256dh, auth } }, cuerpo, { TTL: 60 * 60 * 24 });
      } catch (error) {
        const estado = (error as { statusCode?: number }).statusCode;
        // 404/410: el navegador anuló la suscripción (permiso retirado, app desinstalada).
        if (estado === 404 || estado === 410) {
          await consultar('DELETE FROM suscripciones_push WHERE endpoint = $1', [endpoint]);
        } else {
          console.error('No se pudo enviar una notificación push.', error);
        }
      }
    }),
  );
}

// Programa el envío sin hacer esperar la respuesta. after() mantiene viva la función en Vercel
// hasta terminar; fuera de una petición (scripts) se envía en segundo plano.
export function programarPush(usuarioIds: string[], aviso: NuevoAviso): void {
  if (!usuarioIds.length || !pushConfigurado()) return;
  const tarea = () => enviar(usuarioIds, aviso).catch((error: unknown) => console.error(error));
  try {
    after(tarea);
  } catch {
    void tarea();
  }
}
