/**
 * Envío server-side del formulario a Telegram (Bot API).
 *
 * El token del bot vive solo aquí, detrás de la ruta `/api/contacto`: el
 * navegador nunca lo ve. Sin `TELEGRAM_BOT_TOKEN`/`TELEGRAM_CHAT_ID` no
 * falla, devuelve modo simulado —mismo patrón mock-first que el resto de
 * fuentes del proyecto—, así el formulario funciona hoy y pasa a enviar de
 * verdad en cuanto existan las dos variables.
 */

export type MensajeContacto = {
  nombre: string;
  telefono: string;
  correo: string;
  mensaje: string;
  consentimiento: boolean;
};

export type ResultadoEnvio = { ok: true; simulado: boolean } | { ok: false; detalle: string };

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

/** Escapa para modo HTML de Telegram; también sirve dentro de atributos. */
function escapar(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatear(m: MensajeContacto): string {
  const hora = new Date().toISOString().replace('T', ' ').slice(0, 16);
  return [
    '<b>Nuevo mensaje desde joerootX</b>',
    `<b>Nombre:</b> ${escapar(m.nombre)}`,
    `<b>Teléfono:</b> ${escapar(m.telefono)}`,
    `<b>Correo:</b> ${escapar(m.correo)}`,
    '<b>Mensaje:</b>',
    escapar(m.mensaje),
    `<i>Aviso aceptado: ${m.consentimiento ? 'sí' : 'NO'} · ${hora} UTC</i>`,
  ].join('\n');
}

export async function enviarATelegram(m: MensajeContacto): Promise<ResultadoEnvio> {
  if (!TOKEN || !CHAT_ID) return { ok: true, simulado: true };

  try {
    const respuesta = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: formatear(m),
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
      signal: AbortSignal.timeout(8_000),
    });
    if (!respuesta.ok) return { ok: false, detalle: `Telegram contestó ${respuesta.status}` };
    const datos = (await respuesta.json()) as { ok?: boolean; description?: string };
    if (!datos.ok) return { ok: false, detalle: datos.description ?? 'respuesta no-ok' };
    return { ok: true, simulado: false };
  } catch (error) {
    return { ok: false, detalle: error instanceof Error ? error.message : 'sin respuesta' };
  }
}
