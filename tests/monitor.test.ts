import assert from 'node:assert/strict';
import test from 'node:test';
import { clasificar, componerDigest, revisarFuentes, type Revision } from '../lib/monitor';
import { enviarDigest } from '../lib/correo';
import { fallo, listo, vacio } from '../lib/fuente';

const REVISIONES: Revision[] = [
  { fuente: 'github', nivel: 'ok', detalle: 'Responde con datos.', modo: 'auto' },
  { fuente: 'spotify', nivel: 'aviso', detalle: 'Sin reproducción actual.', modo: 'auto' },
  { fuente: 'jira-cola', nivel: 'falla', detalle: 'Jira contestó 500.', modo: 'auto' },
  { fuente: 'youtube', nivel: 'sin-configurar', detalle: 'Sin credenciales.', modo: 'manual' },
];

test('clasifica las tres señales y el modo manual', () => {
  assert.equal(clasificar('a', { modo: 'auto', senal: listo({ x: 1 }) }).nivel, 'ok');
  assert.equal(clasificar('b', { modo: 'auto', senal: vacio('sin datos') }).nivel, 'aviso');
  assert.equal(clasificar('c', { modo: 'auto', senal: fallo('cayó') }).nivel, 'falla');
  assert.equal(
    clasificar('d', { modo: 'manual', senal: listo({ ejemplo: true }) }).nivel,
    'sin-configurar',
  );
  // Un error es una falla aunque el modo sea manual.
  assert.equal(clasificar('e', { modo: 'manual', senal: fallo('cayó') }).nivel, 'falla');
});

test('revisarFuentes corre en paralelo y convierte excepciones en fallas', async () => {
  const revisiones = await revisarFuentes({
    sano: async () => ({ modo: 'auto', senal: listo('ok') }),
    caido: async () => ({ modo: 'auto', senal: fallo('500') }),
    revienta: async () => {
      throw new Error('sin red');
    },
  });
  const porNombre = Object.fromEntries(revisiones.map((r) => [r.fuente, r]));
  assert.equal(porNombre.sano?.nivel, 'ok');
  assert.equal(porNombre.caido?.nivel, 'falla');
  assert.equal(porNombre.revienta?.nivel, 'falla');
  assert.equal(porNombre.revienta?.detalle, 'sin red');
});

test('el digest resume fallas, avisos y fuentes sin configurar', () => {
  const digest = componerDigest(REVISIONES, new Date('2026-10-28T14:00:00Z'));
  assert.match(digest.asunto, /1 fuente con falla/);
  assert.equal(digest.fallas, 1);
  assert.equal(digest.avisos, 1);
  assert.equal(digest.sinConfigurar, 1);
  assert.match(digest.texto, /2026-10-28 14:00 UTC/);
  assert.match(digest.texto, /❌ jira-cola: Jira contestó 500/);
  assert.match(digest.html, /<li>/);
});

test('el digest de todo en orden lo dice en el asunto', () => {
  const digest = componerDigest([
    { fuente: 'github', nivel: 'ok', detalle: 'Responde con datos.', modo: 'auto' },
  ]);
  assert.match(digest.asunto, /todo en orden/);
  assert.equal(digest.fallas, 0);
});

test('sin credenciales el envío es simulado y no toca la red', async () => {
  let llamadas = 0;
  const fetchImpl = (async () => {
    llamadas += 1;
    return new Response('{}', { status: 200 });
  }) as unknown as typeof fetch;
  const resultado = await enviarDigest(componerDigest(REVISIONES), {
    apiKey: '',
    desde: '',
    para: '',
    fetchImpl,
  });
  assert.deepEqual(resultado, { ok: true, simulado: true });
  assert.equal(llamadas, 0);
});

test('con credenciales manda el digest a Resend', async () => {
  const enviados: Array<Record<string, unknown>> = [];
  const fetchImpl = (async (_url: string | URL | Request, init?: RequestInit) => {
    enviados.push(JSON.parse(String(init?.body)) as Record<string, unknown>);
    return new Response('{"id":"abc"}', { status: 200 });
  }) as unknown as typeof fetch;

  const digest = componerDigest(REVISIONES);
  const resultado = await enviarDigest(digest, {
    apiKey: 're_test',
    desde: 'monitor@example.com',
    para: 'joe@example.com',
    fetchImpl,
  });

  assert.deepEqual(resultado, { ok: true, simulado: false });
  const cuerpo = enviados[0];
  assert.ok(cuerpo);
  assert.equal(cuerpo.from, 'monitor@example.com');
  assert.deepEqual(cuerpo.to, ['joe@example.com']);
  assert.equal(cuerpo.subject, digest.asunto);
});

test('un error de Resend se reporta sin lanzar', async () => {
  const fetchImpl = (async () => new Response('nope', { status: 422 })) as unknown as typeof fetch;
  const resultado = await enviarDigest(componerDigest(REVISIONES), {
    apiKey: 're_test',
    desde: 'monitor@example.com',
    para: 'joe@example.com',
    fetchImpl,
  });
  assert.deepEqual(resultado, { ok: false, detalle: 'Resend contestó 422' });
});
