import assert from 'node:assert/strict';
import test from 'node:test';
import { esExterno, LEGALES, REDES } from '../lib/enlaces';

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

test('las redes distinguen enlaces externos de los que aun no tienen destino', () => {
  const github = REDES.find((enlace) => enlace.texto === 'GitHub');
  assert.ok(github);
  assert.equal(github.href, 'https://github.com/JoeRootX');
  assert.equal(esExterno(github.href), true);

  const sinDestino = REDES.filter((enlace) => enlace.href === null);
  assert.deepEqual(
    sinDestino.map((enlace) => enlace.texto),
    ['Instagram', 'LinkedIn', 'X'],
  );
});

test('esExterno solo acepta http y https', () => {
  assert.equal(esExterno('https://example.com'), true);
  assert.equal(esExterno('http://example.com'), true);
  assert.equal(esExterno('/aviso-de-privacidad'), false);
  assert.equal(esExterno('mailto:joe@example.com'), false);
});
