import assert from 'node:assert/strict';
import test from 'node:test';
import { esExterno, REDES } from '../lib/enlaces';

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
