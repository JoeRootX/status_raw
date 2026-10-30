import assert from 'node:assert/strict';
import test from 'node:test';
import robots from '../app/robots';
import sitemap from '../app/sitemap';
import { SITIO_URL } from '../lib/datos';

test('sitemap incluye las rutas fijas y cada post', () => {
  const urls = sitemap().map((entrada) => entrada.url);

  for (const ruta of ['/', '/blog', '/aviso-de-privacidad', '/terminos-y-condiciones']) {
    assert.ok(urls.includes(`${SITIO_URL}${ruta}`), `falta ${ruta}`);
  }
  assert.equal(new Set(urls).size, urls.length, 'hay URLs duplicadas');
});

test('robots bloquea la API y apunta al sitemap', () => {
  const { rules, sitemap: mapa } = robots();

  assert.deepEqual(rules, { userAgent: '*', allow: '/', disallow: ['/api/'] });
  assert.equal(mapa, `${SITIO_URL}/sitemap.xml`);
});
