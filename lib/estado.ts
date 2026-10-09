/**
 * El estado lo cambia Joe con el bot (@status123121bot), no el visitante.
 *
 * El bot escribe la clave `estado` en Redis (Upstash, integrado en Vercel) y la
 * página la lee en cada render. Con `revalidate = 300` un cambio llega a la
 * página como mucho 5 minutos después — el bot confirma el cambio al instante
 * por chat, así que el visitante ve la confirmación y el panel se actualiza
 * poco después. Sin Redis ni sin la clave, el panel vive del fijo
 * `ESTADO_ACTUAL` de `lib/datos.ts`, tal como estaba.
 */

import { ESTADO_ACTUAL, esEstadoId, type EstadoId } from './datos';

const REST_URL = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
const REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;

const conectado = () => Boolean(REST_URL && REST_TOKEN);

/** La clave única donde vive el estado en Redis. */
export const ESTADO_REDIS_KEY = 'estado';

/** GET /get/<clave> en el REST de Redis. Devuelve null si no hay nada o falla. */
async function redisGet(clave: string, revalidate?: number): Promise<string | null> {
  if (!conectado()) return null;
  const respuesta = await fetch(new URL(`/get/${encodeURIComponent(clave)}`, REST_URL), {
    headers: { Authorization: `Bearer ${REST_TOKEN}` },
    // `revalidate` solo aplica dentro de un render de página; el webhook pasa
    // `undefined` y el fetch sale del render sin cache.
    next: revalidate === undefined ? undefined : { revalidate },
    signal: AbortSignal.timeout(8_000),
  });
  if (!respuesta.ok) return null;
  const datos = (await respuesta.json()) as { result?: string | null };
  return datos.result ?? null;
}

/** SET de la clave. Devuelve si el Redis la aceptó. Usado por el webhook. */
export async function redisSet(clave: string, valor: string): Promise<boolean> {
  if (!conectado()) return false;
  const respuesta = await fetch(
    new URL(`/set/${encodeURIComponent(clave)}/${encodeURIComponent(valor)}`, REST_URL),
    {
      headers: { Authorization: `Bearer ${REST_TOKEN}` },
      signal: AbortSignal.timeout(8_000),
    },
  );
  return respuesta.ok;
}

/** El estado tal como está ahora mismo, para el webhook (lectura fresca). */
export async function estadoVivo(): Promise<EstadoId> {
  const valor = await redisGet('estado');
  return esEstadoId(valor ?? '') ? (valor as EstadoId) : ESTADO_ACTUAL;
}

/**
 * El estado que la página muestra. Lleva cache de 5 min (el mismo ciclo por el
 * que GitHub se revalida); si Redis está caido o la clave trajo basura, queda
 * el estado de siempre en vez de tumbar el panel.
 */
export async function estadoActual(): Promise<EstadoId> {
  try {
    return await estadoVivo();
  } catch (error) {
    console.error('[estado] no se pudo leer el estado:', error);
    return ESTADO_ACTUAL;
  }
}
