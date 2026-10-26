import assert from 'node:assert/strict';
import test from 'node:test';
import { haceCuando } from '../lib/tiempo';

const AHORA = Date.parse('2026-10-26T12:00:00Z');

test('haceCuando describe el pasado en español', () => {
  assert.equal(haceCuando('2026-10-26T10:00:00Z', AHORA), 'hace 2 horas');
  assert.equal(haceCuando('2026-10-25T12:00:00Z', AHORA), 'ayer');
  assert.equal(haceCuando('2026-10-19T12:00:00Z', AHORA), 'la semana pasada');
});

test('haceCuando tolera fechas inválidas', () => {
  assert.equal(haceCuando('no-es-una-fecha', AHORA), '');
});
