import assert from 'node:assert/strict';
import test from 'node:test';
import { accionRutina, accionCallback, horaLocal, idDeSlot, teclado, textoDe } from '../lib/rutina';

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

test('horaLocal cubre la madrugada y el último slot (21:00) sin saltar de día', () => {
  const madrugada = horaLocal(new Date('2026-10-26T06:00:00Z')); // 00:00 en Jalisco
  assert.equal(madrugada.hora, 0);
  const noche = horaLocal(new Date('2026-10-27T03:00:00Z')); // 21:00 del lunes en Jalisco
  assert.equal(noche.hora, 21);
  assert.equal(noche.dia, 26);
  assert.equal(noche.diaSemana, 1);
});

test('idDeSlot usa fecha local y hora con dos dígitos', () => {
  assert.equal(idDeSlot(hora(1, 9)), '2026-10-26T09');
  assert.equal(idDeSlot(hora(1, 21)), '2026-10-26T21');
});

test('los botones del teclado se interpretan como acciones del webhook', () => {
  const botones = teclado().inline_keyboard.flat();
  assert.equal(botones.length, 6);
  for (const boton of botones) {
    const accion = accionCallback(boton.callback_data);
    assert.ok(accion, `callback_data sin acción: ${boton.callback_data}`);
  }
  assert.deepEqual(accionCallback('estado:work'), { tipo: 'estado', id: 'work' });
  assert.deepEqual(accionCallback('estado:sigo'), { tipo: 'sigo' });
});

test('accionCallback rechaza datos ajenos, estados desconocidos y formatos raros', () => {
  assert.equal(accionCallback('otra:cosa'), null);
  assert.equal(accionCallback('estado:'), null);
  assert.equal(accionCallback('estado:nope'), null);
  assert.equal(accionCallback('estado:work:extra'), null);
  assert.equal(accionCallback(undefined), null);
});

test('textoDe describe cada acción y usa la etiqueta actual en el seguimiento', () => {
  assert.match(textoDe({ tipo: 'jornada' }), /Trabajo/);
  assert.match(textoDe({ tipo: 'sondeo' }), /Sigues trabajando/);
  assert.match(textoDe({ tipo: 'fin-jornada' }), /libre/);
  assert.match(textoDe({ tipo: 'seguimiento' }, 'Junta'), /Junta/);
  assert.match(textoDe({ tipo: 'seguimiento' }), /lo mismo/);
});
