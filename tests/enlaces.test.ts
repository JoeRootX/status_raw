import assert from 'node:assert/strict';
import test from 'node:test';
import { esExterno, LEGALES, REDES } from '../lib/enlaces';

test('las redes del pie no tienen enlaces muertos', () => {
  assert.deepEqual(
    REDES.map((enlace) => enlace.texto),
    ['GitHub', 'Instagram', 'LinkedIn', 'X'],
  );
  for (const enlace of REDES) {
    const { href } = enlace;
    assert.ok(href !== null, `${enlace.texto} sin destino`);
    assert.notEqual(href, '', `${enlace.texto} con href vacio`);
    assert.ok(!href.includes('#'), `${enlace.texto} apunta a un ancla vacia`);
    assert.ok(esExterno(href), `${enlace.texto} no es una URL absoluta`);
  }
});

test('LinkedIn apunta al perfil real', () => {
  const linkedin = REDES.find((enlace) => enlace.texto === 'LinkedIn');
  assert.equal(
    linkedin?.href,
    'https://www.linkedin.com/in/joel-aaron-duran-castro-57123a199/',
  );
});

test('los enlaces legales son rutas internas con destino', () => {
  assert.ok(LEGALES.length > 0);
  for (const enlace of LEGALES) {
    const { href } = enlace;
    assert.notEqual(href, null);
    if (href === null) continue;
    assert.ok(href.startsWith('/'));
    assert.equal(esExterno(href), false);
  }
});

test('esExterno solo acepta http y https', () => {
  assert.equal(esExterno('https://example.com'), true);
  assert.equal(esExterno('http://example.com'), true);
  assert.equal(esExterno('/aviso-de-privacidad'), false);
  assert.equal(esExterno('mailto:joe@example.com'), false);
});
