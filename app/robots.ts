import type { MetadataRoute } from 'next';
import { SITIO_URL } from '@/lib/datos';
import { esPanelPublico } from '@/lib/privacidad';

/**
 * Las rutas /api/* no aportan nada a un buscador y no deben indexarse.
 *
 * Con el panel cerrado no se indexa NADA: si la pagina vuelve a estar publica,
 * el estado y los datos de trabajo no deben aparecer en resultados de busqueda
 * ni quedar en cache de terceros.
 */
export default function robots(): MetadataRoute.Robots {
  if (!esPanelPublico()) {
    return {
      rules: { userAgent: '*', disallow: '/' },
    };
  }

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
