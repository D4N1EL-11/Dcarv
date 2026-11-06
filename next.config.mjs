// Encabezados de seguridad para todas las respuestas (páginas y API).
const ENCABEZADOS_SEGURIDAD = [
  // Nadie puede incrustar la app en un iframe (clickjacking).
  { key: 'X-Frame-Options', value: 'DENY' },
  {
    key: 'Content-Security-Policy',
    value: "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'",
  },
  // El navegador no adivina tipos de archivo (un CSV no se ejecuta como script).
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  // Solo HTTPS durante dos años (los navegadores lo ignoran en http://localhost).
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  // Sin el botón flotante de Next en desarrollo: la demostración local se ve como producción.
  devIndicators: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Sección 5 del plan: "/" lleva a /soporte (307); el layout de /soporte exige sesión.
  async redirects() {
    return [
      { source: '/', destination: '/soporte', permanent: false },
      // El cambio de contraseña ahora vive dentro del módulo, con su navegación.
      { source: '/change-password', destination: '/soporte/cuenta', permanent: false },
    ];
  },
  async headers() {
    return [
      { source: '/:path*', headers: ENCABEZADOS_SEGURIDAD },
      // El service worker siempre se revisa en la red: una versión nueva llega con el siguiente despliegue.
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
        ],
      },
    ];
  },
};

export default nextConfig;
