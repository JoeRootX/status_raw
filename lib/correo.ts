/**
 * Envío del digest de monitoreo por correo (Resend vía HTTP, sin dependencias).
 *
 * Mismo patrón mock-first que `lib/telegram.ts`: sin `RESEND_API_KEY`,
 * `MONITOR_EMAIL_FROM` y `MONITOR_EMAIL_TO` devuelve `simulado: true` en vez de
 * fallar, así el cron puede correr hoy y empezar a mandar correos en cuanto
 * existan las tres variables. Las opciones se inyectan para poder probar el
 * envío sin red ni entorno.
 */

import type { Digest } from './monitor';

const API = 'https://api.resend.com/emails';

export type ResultadoCorreo = { ok: true; simulado: boolean } | { ok: false; detalle: string };

export type OpcionesEnvio = {
  apiKey?: string;
  desde?: string;
  para?: string;
  fetchImpl?: typeof fetch;
};

function leer(opciones: OpcionesEnvio) {
  return {
    apiKey: opciones.apiKey ?? process.env.RESEND_API_KEY,
    desde: opciones.desde ?? process.env.MONITOR_EMAIL_FROM,
    para: opciones.para ?? process.env.MONITOR_EMAIL_TO,
  };
}

/** Si están las tres variables, el digest sale de verdad. */
export function correoConfigurado(opciones: OpcionesEnvio = {}): boolean {
  const { apiKey, desde, para } = leer(opciones);
  return Boolean(apiKey && desde && para);
}

export async function enviarDigest(
  digest: Digest,
  opciones: OpcionesEnvio = {},
): Promise<ResultadoCorreo> {
  const { apiKey, desde, para } = leer(opciones);
  if (!apiKey || !desde || !para) return { ok: true, simulado: true };

  const fetchImpl = opciones.fetchImpl ?? fetch;
  try {
    const respuesta = await fetchImpl(API, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: desde,
        to: [para],
        subject: digest.asunto,
        text: digest.texto,
        html: digest.html,
      }),
      signal: AbortSignal.timeout(8_000),
    });
    if (!respuesta.ok) return { ok: false, detalle: `Resend contestó ${respuesta.status}` };
    return { ok: true, simulado: false };
  } catch (error) {
    return { ok: false, detalle: error instanceof Error ? error.message : 'sin respuesta' };
  }
}
