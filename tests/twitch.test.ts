import assert from 'node:assert/strict';
import test from 'node:test';
import { canalTwitch, TEXTO_LIVE, estaEnDirecto } from '../lib/twitch';

/** Fija variables de entorno para una comprobacion y las restaura al salir. */
function conEntorno<T>(variables: Record<string, string | undefined>, fn: () => T): T {
  const previos: Record<string, string | undefined> = {};
  for (const [clave, valor] of Object.entries(variables)) {
    previos[clave] = process.env[clave];
    if (valor === undefined) delete process.env[clave];
    else process.env[clave] = valor;
  }
  try {
    return fn();
  } finally {
    for (const [clave, valor] of Object.entries(previos)) {
      if (valor === undefined) delete process.env[clave];
      else process.env[clave] = valor;
    }
  }
}

test('sin TWITCH_CANAL no hay enlace: no se fija un canal por defecto', () => {
  assert.equal(conEntorno({ TWITCH_CANAL: undefined }, canalTwitch), '');
  assert.equal(TEXTO_LIVE, 'LIVE');
});

test('canalTwitch acepta solo https absoluto', () => {
  const validos = [
    'https://twitch.tv/ejemplo',
    'https://www.twitch.tv/ejemplo',
    'https://twitch.tv/ejemplo?x=1',
  ];
  for (const valor of validos) {
    assert.equal(conEntorno({ TWITCH_CANAL: valor }, canalTwitch), valor, `${valor} deberia valer`);
  }

  const invalidos = ['', '   ', 'twitch.tv/ejemplo', 'http://twitch.tv/ejemplo', 'javascript:alert(1)'];
  for (const valor of invalidos) {
    assert.equal(conEntorno({ TWITCH_CANAL: valor }, canalTwitch), '', `${valor} deberia descartarse`);
  }
});

// B4/H-01: el letrero no puede anunciar el directo con el panel cerrado.
test('con el panel cerrado el LIVE nunca se activa, aunque LIVE=true', () => {
  for (const valor of ['1', 'true', 'TRUE']) {
    const activo = conEntorno({ PANEL_PUBLICO: undefined, LIVE: valor }, estaEnDirecto);
    assert.equal(activo, false, `LIVE=${valor} con panel cerrado no deberia activarse`);
  }
});

test('con el panel abierto, estaEnDirecto solo se activa con 1 o true', () => {
  for (const valor of ['1', 'true', 'TRUE', 'True', ' true ']) {
    assert.equal(
      conEntorno({ PANEL_PUBLICO: 'true', LIVE: valor }, estaEnDirecto),
      true,
      `${valor} deberia activar LIVE`,
    );
  }
  for (const valor of [undefined, '', '0', 'false', 'si', '2']) {
    assert.equal(
      conEntorno({ PANEL_PUBLICO: 'true', LIVE: valor }, estaEnDirecto),
      false,
      `${valor} no deberia activar LIVE`,
    );
  }
});
