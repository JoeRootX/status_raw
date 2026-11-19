import type { MetadataRoute } from 'next';
import { SITIO_URL } from '@/lib/datos';
import { listarPosts } from '@/lib/blog';

/**
 * Sitemap generado en build: rutas fijas + una entrada por post del blog.
 *
 * Solo se listan rutas que existen de verdad.
 */
const RUTAS: MetadataRoute.Sitemap = [
  { url: `${SITIO_URL}/`, changeFrequency: 'daily', priority: 1 },
  { url: `${SITIO_URL}/portafolio`, changeFrequency: 'monthly', priority: 0.9 },
  { url: `${SITIO_URL}/blog`, changeFrequency: 'weekly', priority: 0.8 },
  { url: `${SITIO_URL}/cv`, changeFrequency: 'monthly', priority: 0.7 },
  { url: `${SITIO_URL}/certs`, changeFrequency: 'monthly', priority: 0.5 },
  { url: `${SITIO_URL}/aviso-de-privacidad`, changeFrequency: 'yearly', priority: 0.2 },
  { url: `${SITIO_URL}/terminos-y-condiciones`, changeFrequency: 'yearly', priority: 0.2 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const posts: MetadataRoute.Sitemap = listarPosts().map((post) => ({
    url: `${SITIO_URL}/blog/${post.slug}`,
    lastModified: post.fecha,
    changeFrequency: 'yearly',
    priority: 0.6,
  }));
  return [...RUTAS, ...posts];
}
