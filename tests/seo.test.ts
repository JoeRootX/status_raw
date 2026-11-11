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

test('robots bloquea la API y apunta al sitemap con el panel publico', () => {
  process.env.PANEL_PUBLICO = 'true';
  try {
    const { rules, sitemap: mapa } = robots();

    assert.deepEqual(rules, { userAgent: '*', allow: '/', disallow: ['/api/'] });
    assert.equal(mapa, `${SITIO_URL}/sitemap.xml`);
  } finally {
    delete process.env.PANEL_PUBLICO;
  }
});

// B4 (auditoria 2026-11-11): con el panel cerrado no se indexa nada, porque la
// pagina volveria a publicar estado y datos de trabajo en resultados de busqueda.
test('robots no indexa nada con el panel cerrado', () => {
  delete process.env.PANEL_PUBLICO;

  const { rules, sitemap: mapa } = robots();

  assert.deepEqual(rules, { userAgent: '*', disallow: '/' });
  assert.equal(mapa, undefined);
});
