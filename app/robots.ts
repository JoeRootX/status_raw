import type { MetadataRoute } from 'next';
import { SITIO_URL } from '@/lib/datos';

/** Las rutas /api/* no aportan nada a un buscador y no deben indexarse. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/'],
    },
    sitemap: `${SITIO_URL}/sitemap.xml`,
    host: SITIO_URL,
  };
}
