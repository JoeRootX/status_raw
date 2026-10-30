import assert from 'node:assert/strict';
import test from 'node:test';
import { COLOR_ESTADO, ESTADOS, ORDEN_ESTADOS } from '../lib/datos';

test('cada estado tiene un color de theme-color valido', () => {
  for (const id of ORDEN_ESTADOS) {
    assert.match(COLOR_ESTADO[id], /^#[0-9a-f]{6}$/, `color invalido para ${id}`);
  }
});

test('estados distintos pintan colores distintos', () => {
  const colores = ORDEN_ESTADOS.map((id) => COLOR_ESTADO[id]);
  assert.equal(new Set(colores).size, colores.length);
});

test('el mapa cubre exactamente los estados conocidos', () => {
  assert.deepEqual(Object.keys(COLOR_ESTADO).sort(), Object.keys(ESTADOS).sort());
});
