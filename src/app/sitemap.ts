import type { MetadataRoute } from 'next';
import { obtenerUrlBase } from '@/lib/urlBase';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = obtenerUrlBase();
  return [
    { url: `${base}/login`, changeFrequency: 'yearly', priority: 1 },
    { url: `${base}/register`, changeFrequency: 'yearly', priority: 0.5 },
  ];
}
