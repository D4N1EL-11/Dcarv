import type { MetadataRoute } from 'next';
import { obtenerUrlBase } from '@/lib/urlBase';

// Solo las páginas públicas (acceso y registro) son indexables; el módulo y la API, no.
export default function robots(): MetadataRoute.Robots {
  const base = obtenerUrlBase();
  return {
    rules: { userAgent: '*', allow: ['/login', '/register'], disallow: ['/soporte', '/api/', '/dashboard/'] },
    sitemap: `${base}/sitemap.xml`,
  };
}
