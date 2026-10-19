#!/usr/bin/env node
/**
 * Crea (una sola vez) el schedule de QStash que dispara la rutina del
 * horario laboral: POST /api/rutina en los slots de Jalisco L-V.
 *
 * Uso (desde la raíz del repo):
 *
 *   QSTASH_TOKEN=qstash_xxx npm run cron:setup
 *
 * - El token sale de la variable de entorno (consola de Upstash → QStash →
 *   API Keys). No se guarda en disco ni en el repo.
 * - El secreto que va en el header Authorization lo lee de .env.local
 *   (RUTINA_SECRETO=...), la misma env que ya es Secret en Vercel.
 *
 * Idempotente: si el schedule ya existe (misma URL + cron), no crea otro.
 */

const CRON = '0 15,17,19,21,23,1,3 * * *'; // UTC = 9,11,13,15,17,19,21 de Jalisco (L-V los valida el endpoint)
const URL_RUTINA = 'https://status-raw.vercel.app/api/rutina';

const token = process.env.QSTASH_TOKEN;
if (!token) {
  console.error(
    'Falta QSTASH_TOKEN. En consola.upstash.com → QStash → API Keys cópialo y corre:\n' +
      '  QSTASH_TOKEN=qstash_xxx npm run cron:setup',
  );
  process.exit(1);
}

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');

function leerSecreto() {
  try {
    const env = readFileSync(join(raiz, '.env.local'), 'utf8');
    const linea = env.split('\n').find((l) => l.startsWith('RUTINA_SECRETO='));
    const valor = linea?.split('=')[1]?.trim();
    if (valor) return valor;
  } catch {
    // .env.local puede no existir en otro checkout; el error de abajo explica.
  }
  console.error(
    `No encontré RUTINA_SECRETO en .env.local. El schedule debe llevar el header\n` +
      `Authorization: Bearer <secreto> con el MISMO valor que la env de Vercel.\n` +
      `Agrégalo a .env.local y vuelve a correr.`,
  );
  process.exit(1);
}

const cabeceras = {
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
};

async function listar() {
  const r = await fetch('https://qstash.upstash.io/v2/schedules', { headers: cabeceras });
  if (!r.ok) throw new Error(`GET /schedules → ${r.status}: ${await r.text()}`);
  return r.json();
}

async function crear() {
  const r = await fetch('https://qstash.upstash.io/v2/schedules', {
    method: 'POST',
    headers: cabeceras,
    body: JSON.stringify({
      destination: URL_RUTINA,
      cron: CRON,
      method: 'POST',
      headers: { Authorization: `Bearer ${leerSecreto()}` },
    }),
  });
  if (!r.ok) throw new Error(`POST /schedules → ${r.status}: ${await r.text()}`);
  return r.json();
}

const scheduleIdDe = (s) => s.scheduleId ?? s.schedule_id ?? s.id ?? JSON.stringify(s).slice(0, 80);
const esElNuestro = (s) =>
  (s.destination ?? s.url ?? '').includes('status-raw.vercel.app/api/rutina') && s.cron === CRON;

const existentes = await listar();
const yaHay = (existentes ?? []).find(esElNuestro);
if (yaHay) {
  console.log(`El schedule ya existe (id: ${scheduleIdDe(yaHay)}). Nada que hacer.`);
} else {
  const creado = await crear();
  console.log(`Schedule creado (id: ${scheduleIdDe(creado)}).`);
  console.log(`Disparará ${URL_RUTINA} en los slots L-V 9/11/13/15/17/19/21 de Jalisco.`);
  console.log('Prueba: en los slots "Send test" contesta {"ok":true,"motivo":"fuera de horario"}');
}
