import type { MetadataRoute } from 'next';
import { SITIO_URL } from '@/lib/datos';

/**
 * Sitemap generado en build: rutas fijas + una entrada por post del blog.
 *
 * Solo se listan rutas que existen de verdad. /cv y /certs viven en sus propias
 * tarjetas (STATUS-FUT-CV y STATUS-FUT-CERTS); al integrarse basta sumarlas aqui
 * para que entren al sitemap.
 */
const RUTAS: MetadataRoute.Sitemap = [
  { url: `${SITIO_URL}/`, changeFrequency: 'daily', priority: 1 },
  { url: `${SITIO_URL}/blog`, changeFrequency: 'weekly', priority: 0.8 },
  { url: `${SITIO_URL}/aviso-de-privacidad`, changeFrequency: 'yearly', priority: 0.2 },
  { url: `${SITIO_URL}/terminos-y-condiciones`, changeFrequency: 'yearly', priority: 0.2 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return RUTAS;
}
