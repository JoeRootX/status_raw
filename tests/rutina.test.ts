import assert from 'node:assert/strict';
import test from 'node:test';
import { accionRutina, horaLocal, idDeSlot } from '../lib/rutina';

/** Lunes 26 oct 2026; solo importan el día y la hora. */
function hora(diaSemana: number, h: number) {
  return { ano: 2026, mes: 10, dia: 26, hora: h, diaSemana };
}

test('los slots de lunes a viernes son los esperados', () => {
  assert.deepEqual(accionRutina(hora(1, 9)), { tipo: 'jornada' });
  for (const h of [11, 13, 15]) {
    assert.deepEqual(accionRutina(hora(1, h)), { tipo: 'sondeo' });
  }
  assert.deepEqual(accionRutina(hora(1, 17)), { tipo: 'fin-jornada' });
  for (const h of [19, 21]) {
    assert.deepEqual(accionRutina(hora(1, h)), { tipo: 'seguimiento' });
  }
});

test('fuera de slots y en fin de semana no hay acción', () => {
  for (const h of [0, 8, 10, 12, 14, 16, 18, 20, 22, 23]) {
    assert.equal(accionRutina(hora(3, h)), null);
  }
  assert.equal(accionRutina(hora(0, 9)), null); // domingo
  assert.equal(accionRutina(hora(6, 21)), null); // sábado
});

test('horaLocal calcula la hora de Jalisco y no la del servidor (UTC)', () => {
  const h = horaLocal(new Date('2026-10-26T15:00:00Z')); // 09:00 en Jalisco
  assert.equal(h.ano, 2026);
  assert.equal(h.mes, 10);
  assert.equal(h.dia, 26);
  assert.equal(h.hora, 9);
  assert.equal(h.diaSemana, 1); // lunes
});

test('idDeSlot usa fecha local y hora con dos dígitos', () => {
  assert.equal(idDeSlot(hora(1, 9)), '2026-10-26T09');
  assert.equal(idDeSlot(hora(1, 21)), '2026-10-26T21');
});
