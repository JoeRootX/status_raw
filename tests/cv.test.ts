import assert from 'node:assert/strict';
import test from 'node:test';
import { CV } from '../lib/cv';
import { generarPdfCv } from '../lib/pdf';

test('el CV declara las tres secciones con contenido', () => {
  assert.ok(CV.experiencia.length > 0);
  assert.ok(CV.educacion.length > 0);
  assert.ok(CV.skills.length > 0);
  for (const e of CV.experiencia) assert.ok(e.logros.length > 0);
});

test('generarPdfCv devuelve un PDF con las secciones', () => {
  const binario = Buffer.from(generarPdfCv());
  assert.equal(binario.subarray(0, 5).toString('latin1'), '%PDF-');
  assert.match(binario.subarray(-6).toString('latin1'), /%%EOF/);

  const texto = binario.toString('latin1');
  for (const seccion of ['Experiencia', 'Educación', 'Skills']) {
    assert.ok(texto.includes(seccion), `falta la sección ${seccion}`);
  }
  assert.ok(texto.includes(CV.correo));
});

test('la tabla xref apunta al inicio de cada objeto', () => {
  const texto = Buffer.from(generarPdfCv()).toString('latin1');
  const inicio = Number(/startxref\n(\d+)/.exec(texto)?.[1]);
  assert.ok(Number.isInteger(inicio) && inicio > 0);
  assert.equal(texto.slice(inicio, inicio + 4), 'xref');

  const lineas = texto.slice(inicio).split('\n');
  const entradas = Number(lineas[1]?.split(' ')[1]);
  assert.ok(Number.isInteger(entradas) && entradas > 1);

  // lineas[0]=xref, [1]="0 N", [2]=entrada libre; luego una por objeto.
  for (let i = 1; i < entradas; i++) {
    const offset = Number(lineas[2 + i]?.slice(0, 10));
    assert.ok(Number.isInteger(offset), `offset inválido para el objeto ${i}`);
    assert.ok(
      texto.slice(offset).startsWith(`${i} 0 obj`),
      `el xref del objeto ${i} no apunta a su cabecera`,
    );
  }
});
