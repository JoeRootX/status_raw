/**
 * El estado lo cambia Joe con el bot (@status123121bot), no el visitante.
 *
 * El bot escribe la clave `estado` en Redis (Upstash, integrado en Vercel) y la
 * página la lee con cache etiquetado: el webhook llama `revalidateTag('estado')`
 * justo después de guardar, así el cambio se ve con el siguiente visitante en
 * vez de esperar el ciclo completo de ISR. Sin comandos, el fallback es
 * revalidar cada 5 minutos como el resto del panel. Sin Redis o con la clave
 * sucia, el panel vive del fijo `ESTADO_ACTUAL` de `lib/datos.ts`.
 */

import { ESTADO_ACTUAL, esEstadoId, type EstadoId } from './datos';

const REST_URL = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
const REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;

const conectado = () => Boolean(REST_URL && REST_TOKEN);

/** La clave única donde vive el estado en Redis. */
export const ESTADO_REDIS_KEY = 'estado';

/** La etiqueta de cache con la que la página lee; el webhook la invalida. */
export const TAG_ESTADO = 'estado';

type OpcionesCache = { revalidate?: number; tags?: string[] };

/** GET /get/<clave> en el REST de Redis. Devuelve null si no hay nada o falla. */
async function redisGet(clave: string, cache: OpcionesCache = {}): Promise<string | null> {
  if (!conectado()) return null;
  const respuesta = await fetch(new URL(`/get/${encodeURIComponent(clave)}`, REST_URL), {
    headers: { Authorization: `Bearer ${REST_TOKEN}` },
    // Dentro del render de la página interesa cachear (etiqueta + revalidate).
    // El webhook no pasa nada y su POST sale siempre fresco.
    next: Object.keys(cache).length ? cache : undefined,
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

function normalizar(valor: string | null): EstadoId {
  return esEstadoId(valor ?? '') ? (valor as EstadoId) : ESTADO_ACTUAL;
}

/** El estado tal como está ahora mismo, para el webhook (lectura fresca). */
export async function estadoVivo(): Promise<EstadoId> {
  return normalizar(await redisGet(ESTADO_REDIS_KEY));
}

/**
 * El estado que la página muestra: lectura cacheada por etiqueta. Si el
 * webhook manda `revalidateTag(TAG_ESTADO)` tras guardar, este cache se purga
 * y el próximo visitante ya ve el estado nuevo sin esperar el ciclo ISR.
 * Si Redis está caido, queda el estado de siempre en vez de tumbar el panel.
 */
export async function estadoActual(): Promise<EstadoId> {
  try {
    return normalizar(await redisGet(ESTADO_REDIS_KEY, { tags: [TAG_ESTADO], revalidate: 300 }));
  } catch (error) {
    console.error('[estado] no se pudo leer el estado:', error);
    return ESTADO_ACTUAL;
  }
}
