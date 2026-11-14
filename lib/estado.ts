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

/**
 * Config de Redis leída en cada llamada, no al importar el módulo: así los
 * tests (y cualquier proceso) pueden fijar el entorno después del import.
 */
function configRedis(): { url?: string; token?: string } {
  return {
    url: process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN,
  };
}

/** La clave única donde vive el estado en Redis. */
export const ESTADO_REDIS_KEY = 'estado';

/** La etiqueta de cache con la que la página lee; el webhook la invalida. */
export const TAG_ESTADO = 'estado';

type OpcionesCache = { revalidate?: number; tags?: string[] };

/** GET /get/<clave> en el REST de Redis. Devuelve null si no hay nada o falla. */
export async function redisGet(clave: string, cache: OpcionesCache = {}): Promise<string | null> {
  const { url, token } = configRedis();
  if (!url || !token) return null;
  const respuesta = await fetch(new URL(`/get/${encodeURIComponent(clave)}`, url), {
    headers: { Authorization: `Bearer ${token}` },
    // Dentro del render de la página interesa cachear (etiqueta + revalidate).
    // El webhook no pasa nada y su POST sale siempre fresco.
    next: Object.keys(cache).length ? cache : undefined,
    signal: AbortSignal.timeout(8_000),
  });
  if (!respuesta.ok) return null;
  const datos = (await respuesta.json()) as { result?: string | null };
  return datos.result ?? null;
}

type OpcionesSet = { nx?: boolean; ex?: number };

/** SET de la clave. `nx` no pisa una clave existente y `ex` la caduca en
    segundos (Upstash REST los recibe como segmentos de la ruta). */
export async function redisSet(
  clave: string,
  valor: string,
  opciones: OpcionesSet = {},
): Promise<boolean> {
  const { url, token } = configRedis();
  if (!url || !token) return false;
  const ruta =
    `/set/${encodeURIComponent(clave)}/${encodeURIComponent(valor)}` +
    (opciones.nx ? '/NX' : '') +
    (opciones.ex ? `/EX/${Math.floor(opciones.ex)}` : '');
  let respuesta: Response;
  try {
    respuesta = await fetch(new URL(ruta, url), {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(8_000),
    });
  } catch (error) {
    // Redis caído o red sin salida: el llamador decide (no debe tumbar la ruta).
    console.error('[estado] no se pudo escribir en Redis:', error);
    return false;
  }
  if (!respuesta.ok) return false;
  // Con NX, Upstash contesta 200 y `result: null` si la clave ya existía.
  if (!opciones.nx) return true;
  try {
    const datos = (await respuesta.json()) as { result?: string | null };
    return datos.result === 'OK';
  } catch {
    return false;
  }
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
