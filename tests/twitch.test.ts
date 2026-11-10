import assert from 'node:assert/strict';
import test from 'node:test';
import { CANAL_TWITCH, TEXTO_LIVE, estaEnDirecto } from '../lib/twitch';

function conLIVE<T>(valor: string | undefined, fn: () => T): T {
  const anterior = process.env.LIVE;
  if (valor === undefined) delete process.env.LIVE;
  else process.env.LIVE = valor;
  try {
    return fn();
  } finally {
    if (anterior === undefined) delete process.env.LIVE;
    else process.env.LIVE = anterior;
  }
}

test('el canal de Twitch apunta al directo de JoeRootX', () => {
  assert.equal(CANAL_TWITCH, 'https://twitch.tv/joerootx');
  assert.equal(TEXTO_LIVE, 'LIVE');
});

test('estaEnDirecto solo se activa con 1 o true, sin distinguir mayusculas', () => {
  for (const valor of ['1', 'true', 'TRUE', 'True', ' true ']) {
    assert.equal(conLIVE(valor, estaEnDirecto), true, `${valor} deberia activar LIVE`);
  }
  for (const valor of [undefined, '', '0', 'false', 'si', '2']) {
    assert.equal(conLIVE(valor, estaEnDirecto), false, `${valor} no deberia activar LIVE`);
  }
});
