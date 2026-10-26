import assert from 'node:assert/strict';
import test from 'node:test';
import { validarCampos } from '../lib/validacion';

const VALIDO = {
  nombre: 'Joe DC',
  telefono: '3312345678',
  correo: 'joe@example.com',
  mensaje: 'Hola, este es un mensaje válido.',
};

test('un formulario completo y correcto no tiene errores', () => {
  assert.deepEqual(validarCampos(VALIDO), {});
});

test('detecta cada campo inválido', () => {
  const errores = validarCampos({
    nombre: 'Jo',
    telefono: '123',
    correo: 'joe@',
    mensaje: 'corto',
  });
  assert.ok(errores.nombre);
  assert.ok(errores.telefono);
  assert.ok(errores.correo);
  assert.ok(errores.mensaje);
});

test('respeta los límites superiores', () => {
  const errores = validarCampos({ ...VALIDO, mensaje: 'x'.repeat(601) });
  assert.match(errores.mensaje ?? '', /Máximo 600/);
});

test('campos ausentes o no-string cuentan como vacíos', () => {
  const errores = validarCampos({ nombre: 42, telefono: null });
  assert.ok(errores.nombre);
  assert.ok(errores.telefono);
  assert.ok(errores.correo);
  assert.ok(errores.mensaje);
});
