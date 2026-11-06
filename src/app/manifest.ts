import type { MetadataRoute } from 'next';

// Manifiesto de la app instalable (PWA): nombre, colores e íconos con los que el celular o el
// computador la muestran al instalarla. Los íconos salen del mismo diseño que src/app/icon.svg.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/soporte',
    name: 'Soporte de Salas',
    short_name: 'Soporte',
    description: 'Reporte y seguimiento de fallas de los equipos de las salas de cómputo.',
    lang: 'es-CO',
    dir: 'ltr',
    start_url: '/soporte',
    scope: '/',
    display: 'standalone',
    orientation: 'any',
    background_color: '#111214',
    theme_color: '#111214',
    categories: ['education', 'productivity', 'utilities'],
    icons: [
      { src: '/iconos/icono-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/iconos/icono-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/iconos/icono-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    // Accesos directos al mantener presionado el ícono (Android) o con clic derecho (Windows).
    shortcuts: [
      {
        name: 'Reportar una falla',
        short_name: 'Reportar',
        url: '/soporte/reportar',
        icons: [{ src: '/iconos/icono-192.png', sizes: '192x192', type: 'image/png' }],
      },
      {
        name: 'Mis reportes',
        url: '/soporte/mis-reportes',
        icons: [{ src: '/iconos/icono-192.png', sizes: '192x192', type: 'image/png' }],
      },
      {
        name: 'Avisos',
        url: '/soporte/avisos',
        icons: [{ src: '/iconos/icono-192.png', sizes: '192x192', type: 'image/png' }],
      },
    ],
  };
}
