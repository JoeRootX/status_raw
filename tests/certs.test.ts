import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import BadgeCert from '../components/bloque/BadgeCert';
import { CATEGORIAS, CERTIFICACIONES, agruparCertificaciones } from '../lib/certs';

test('cada categoria declarada tiene certificaciones y el agrupado conserva el orden', () => {
  const grupos = agruparCertificaciones();

  assert.deepEqual(
    grupos.map((grupo) => grupo.categoria.id),
    CATEGORIAS.map((categoria) => categoria.id),
  );
  assert.equal(
    grupos.reduce((total, grupo) => total + grupo.certificaciones.length, 0),
    CERTIFICACIONES.length,
  );
  for (const grupo of grupos) assert.ok(grupo.certificaciones.length > 0);
});

test('las certificaciones tienen ids unicos y datos de badge validos', () => {
  const ids = new Set<string>();

  for (const certificacion of CERTIFICACIONES) {
    assert.ok(!ids.has(certificacion.id), `id repetido: ${certificacion.id}`);
    ids.add(certificacion.id);

    assert.match(certificacion.badge.sigla, /^[A-Z0-9]{2,3}$/);
    assert.match(certificacion.badge.color, /^#[0-9a-f]{6}$/i);
    assert.match(certificacion.badge.tinta, /^#[0-9a-f]{6}$/i);
    assert.ok(certificacion.anio >= 2000 && certificacion.anio <= 2100);
    assert.ok(
      CATEGORIAS.some((categoria) => categoria.id === certificacion.categoria),
      `categoria desconocida: ${certificacion.categoria}`,
    );
    assert.ok(
      certificacion.url === null || /^https:\/\//.test(certificacion.url),
      `url invalida en ${certificacion.id}`,
    );
  }
});

test('agrupar certificaciones vacio no inventa categorias', () => {
  assert.deepEqual(agruparCertificaciones([]), []);
});

test('el badge se renderiza como SVG con su titulo y su sigla', () => {
  const certificacion = CERTIFICACIONES[0]!;
  const html = renderToStaticMarkup(createElement(BadgeCert, { certificacion }));

  assert.match(html, /^<svg/);
  assert.match(html, /viewBox="0 0 64 64"/);
  assert.match(html, /role="img"/);
  assert.ok(html.includes(`<title id="badge-${certificacion.id}-titulo">`));
  assert.ok(html.includes(`>${certificacion.badge.sigla}</text>`));
});
