// Service worker de Soporte de Salas (app instalable).
//
// Regla principal: NUNCA guarda páginas con datos ni respuestas de la API. Todo lo del módulo
// depende de la sesión y cambia a cada momento; guardarlo mostraría datos viejos o de otra cuenta.
// Solo guarda la página "Sin conexión" (con sus estilos y fuentes) y los íconos, y la muestra
// cuando una página no carga por falta de red.

const VERSION = 'soporte-v1';
const PAGINA_SIN_CONEXION = '/offline';
const PRECARGA = [PAGINA_SIN_CONEXION, '/iconos/icono-192.png', '/iconos/icono-512.png'];

// Estilos y fuentes que usa la página "Sin conexión" (tienen nombre con huella: nunca cambian).
async function recursosDe(cache, pagina) {
  const respuesta = await cache.match(pagina);
  if (!respuesta) return [];
  const html = await respuesta.text();
  const rutas = [...html.matchAll(/(?:href|src)="(\/_next\/static\/[^"]+\.(?:css|woff2))"/g)].map((m) => m[1]);
  return [...new Set(rutas)];
}

self.addEventListener('install', (evento) => {
  evento.waitUntil(
    (async () => {
      const cache = await caches.open(VERSION);
      await cache.addAll(PRECARGA);
      await cache.addAll(await recursosDe(cache, PAGINA_SIN_CONEXION));
      await self.skipWaiting();
    })(),
  );
});

// Borra las cachés de versiones anteriores y toma el control de las pestañas abiertas.
self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((nombres) => Promise.all(nombres.filter((n) => n !== VERSION).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (evento) => {
  const { request } = evento;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Navegación (abrir una página): siempre a la red. Solo si no hay red, la página "Sin conexión".
  if (request.mode === 'navigate') {
    evento.respondWith(
      fetch(request).catch(() =>
        caches.match(PAGINA_SIN_CONEXION).then((respuesta) => respuesta || Response.error()),
      ),
    );
    return;
  }

  // Íconos y los estilos guardados de "Sin conexión": primero la caché. Lo de /_next/static/ que no
  // se guardó sigue yendo a la red.
  if (url.pathname.startsWith('/iconos/') || url.pathname.startsWith('/_next/static/')) {
    evento.respondWith(caches.match(request).then((guardada) => guardada || fetch(request)));
  }
  // Todo lo demás (API, datos, scripts) pasa directo a la red, sin caché del service worker.
});

// Notificaciones push (lib/datos/push.ts): cada aviso de la campana llega con su título, detalle y
// enlace. Al pulsarla se abre (o se enfoca) la pestaña del módulo en ese enlace.
self.addEventListener('push', (evento) => {
  let datos = {};
  try {
    datos = evento.data ? evento.data.json() : {};
  } catch {
    datos = { titulo: evento.data ? evento.data.text() : '' };
  }
  const enlace = typeof datos.enlace === 'string' && datos.enlace.startsWith('/soporte') ? datos.enlace : '/soporte/avisos';
  evento.waitUntil(
    self.registration.showNotification(datos.titulo || 'Soporte de Salas', {
      body: datos.detalle || '',
      icon: '/iconos/icono-192.png',
      badge: '/iconos/icono-192.png',
      data: { enlace },
      tag: enlace, // varios avisos del mismo caso se agrupan en una sola notificación
      renotify: true,
    }),
  );
});

self.addEventListener('notificationclick', (evento) => {
  evento.notification.close();
  const destino = new URL(evento.notification.data?.enlace || '/soporte/avisos', self.location.origin).href;
  evento.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((pestanas) => {
      const abierta = pestanas.find((p) => new URL(p.url).origin === self.location.origin);
      if (abierta) return abierta.navigate(destino).then((p) => (p || abierta).focus());
      return self.clients.openWindow(destino);
    }),
  );
});
