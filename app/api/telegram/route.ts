/**
 * Webhook del bot de Telegram (@status123121bot).
 *
 * Solo Joe puede mover los chips: el endpoint ignora a cualquiera cuya `chat.id`
 * no sea exactamente `TELEGRAM_CHAT_ID`, y Telegram manda por su cuenta un
 * encabezado secreto que configuramos en `set_webhook` — sin él, ni siquiera
 * leyendo el cuerpo se entra. Ambas capas se validan antes de tocar Redis.
 *
 * Comandos: `/estado` (ver), `/estado <clave>` y los directos en español.
 * Además atiende `callback_query`: los botones de los avisos programados por
 * el horario laboral (`/api/rutina` + lib/rutina.ts) responden aquí.
 */

import { revalidateTag } from 'next/cache';
import { ESTADOS, ORDEN_ESTADOS, esEstadoId, type EstadoId } from '@/lib/datos';
import { ESTADO_REDIS_KEY, TAG_ESTADO, estadoVivo, redisSet } from '@/lib/estado';

export const revalidate = 0;

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = Number(process.env.TELEGRAM_CHAT_ID);
const SECRETO = process.env.TELEGRAM_WEBHOOK_SECRET;

/**
 * Las dos capas de seguridad se anulan solas si falta su env (capa 1 se saltaria
 * el header secreto; capa 2 dejaria pasar cualquier chat). Sin matar el webhook
 * en dev, mejor un aviso ruidoso en logs que un silencio.
 */
if (process.env.NODE_ENV === 'production') {
  if (!SECRETO) console.warn('[telegram-webhook] TELEGRAM_WEBHOOK_SECRET no definida: la capa 1 (header secreto) esta desactivada.');
  if (!CHAT_ID) console.warn('[telegram-webhook] TELEGRAM_CHAT_ID no definida: la capa 2 (chat whitelisted) esta desactivada.');
}

/** Alias en español (y claves crudas) para cambiar el estado. */
const ALIAS: Record<string, EstadoId> = {
  work: 'work',
  trabajo: 'work',
  personal: 'personal',
  free: 'free',
  libre: 'free',
  eat: 'eat',
  comer: 'eat',
  comiendo: 'eat',
  ausente: 'eat',
  meet: 'meet',
  junta: 'meet',
};

type Mensaje = {
  chat?: { id?: number };
  text?: string;
};

type Update = {
  message?: Mensaje;
  /* Botones de los avisos programados (lib/rutina.ts): data "estado:<id>" o "estado:sigo". */
  callback_query?: {
    id: string;
    data?: string;
    message?: Mensaje;
  };
};

/** Telegram antepone el usuario del bot en grupos: "/libre@status123121bot". */
function limpiarComando(texto: string): string[] {
  return texto
    .split(/\s+/)
    .map((parte) => parte.replace(/@[^@]*$/, ''));
}

/** Escapa para el modo HTML de Telegram (los mensajes del webhook usan parse_mode). */
function escapar(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** Mensajita de confirmación con la lista que ya existe en datos.ts. */
function etiquetaDe(id: EstadoId): string {
  return ESTADOS[id]?.etiqueta ?? id;
}

function listaEstados(): string {
  return ORDEN_ESTADOS.map((id) => `· /${id} → ${etiquetaDe(id)}`).join('\n');
}

function enumMensaje(id: EstadoId | null, cuerpo: string): string {
  const cabeza = id ? `Estado actual: <b>${etiquetaDe(id)}</b>\n\n` : '';
  return `${cuerpo ? `${cuerpo}\n\n` : ''}${cabeza}Cambiar con:\n${listaEstados()}`;
}

async function contestar(chatId: number, texto: string): Promise<void> {
  if (!TOKEN) return;
  try {
    const respuesta = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: texto,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
      signal: AbortSignal.timeout(8_000),
    });
    if (!respuesta.ok) console.error('[telegram-webhook] sendMessage falló:', respuesta.status);
  } catch (error) {
    console.error('[telegram-webhook] sin respuesta de Telegram:', error);
  }
}

/** answerCallbackQuery apaga el "cargando" del mensaje con botones y deja una
    confirmación en toast. Sin él el botón queda colgado en el cliente. */
async function responderBoton(callbackId: string, text?: string): Promise<void> {
  if (!TOKEN) return;
  try {
    const respuesta = await fetch(`https://api.telegram.org/bot${TOKEN}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callback_query_id: callbackId, ...(text ? { text } : {}) }),
      signal: AbortSignal.timeout(8_000),
    });
    if (!respuesta.ok) console.error('[telegram-webhook] answerCallbackQuery falló:', respuesta.status);
  } catch (error) {
    console.error('[telegram-webhook] sin respuesta de Telegram (callback):', error);
  }
}

/** Cambia el estado en Redis y purga el cache; lo usan los comandos y los botones. */
async function cambiarEstado(destino: EstadoId, chatId: number): Promise<boolean> {
  const guardado = await redisSet(ESTADO_REDIS_KEY, destino);
  if (guardado) {
    // expire: 0 = la siguiente peticion BLOQUEA hasta revalidar: el cambio
    // se ve de inmediato. Con "max" la primera peticion se sirve stale
    // (stale-while-revalidate) y el poller vea el estado viejo un ciclo mas.
    revalidateTag(TAG_ESTADO, { expire: 0 });
  }
  await contestar(
    chatId,
    guardado
      ? `Estado actualizado: <b>${etiquetaDe(destino)}</b> ✅`
      : 'No se alcanzó el almacenamiento. Intenta de nuevo.',
  );
  return guardado;
}

export async function POST(request: Request) {
  // Capa 1: el secreto lo pone Telegram (set_webhook) y nadie más lo conoce.
  if (SECRETO && request.headers.get('x-telegram-bot-api-secret-token') !== SECRETO) {
    return Response.json({ ok: false, motivo: 'secreto inválido' }, { status: 401 });
  }

  let update: Update;
  try {
    update = (await request.json()) as Update;
  } catch {
    return Response.json({ ok: true, motivo: 'cuerpo no-json' });
  }

  const mensaje = update.message;
  const callback = update.callback_query;
  const chatId = mensaje?.chat?.id ?? callback?.message?.chat?.id;
  if (!chatId) return Response.json({ ok: true, motivo: 'sin mensaje' });

  // Capa 2: solo el chat de Joe cambia cosas.
  if (CHAT_ID && chatId !== CHAT_ID) {
    if (callback) await responderBoton(callback.id, 'Este bot solo atiende a Joe. 🤫');
    else await contestar(chatId, 'Este bot solo atiende a Joe. 🤫');
    return Response.json({ ok: true, motivo: 'chat no autorizado' });
  }

  // Botones de los avisos programados: "estado:sigo" no cambia nada,
  // "estado:<id>" es lo mismo que mandar el comando a mano.
  if (callback) {
    try {
      const [prefijo = '', valor = ''] = (callback.data ?? '').split(':');
      if (prefijo !== 'estado' || !valor) {
        await responderBoton(callback.id);
        return Response.json({ ok: true, motivo: 'callback desconocido' });
      }
      if (valor === 'sigo') {
        await responderBoton(callback.id, 'Anotado ✅');
        return Response.json({ ok: true, motivo: 'sigo igual' });
      }
      if (!esEstadoId(valor)) {
        await responderBoton(callback.id);
        return Response.json({ ok: true, motivo: 'estado desconocido' });
      }
      const guardado = await cambiarEstado(valor, chatId);
      await responderBoton(
        callback.id,
        guardado ? `Estado actualizado: ${etiquetaDe(valor)} ✅` : 'No se pudo guardar',
      );
      return Response.json({ ok: guardado, motivo: 'estado cambiado' });
    } catch (error) {
      console.error('[telegram-webhook] error procesando callback:', error);
      await responderBoton(callback.id, 'Algo falló, intenta de nuevo');
      return Response.json({ ok: false, motivo: 'error interno' }, { status: 200 });
    }
  }

  const texto = mensaje?.text?.trim().toLowerCase() ?? '';
  if (!texto) return Response.json({ ok: true, motivo: 'sin mensaje' });

  // Telegram antepone el usuario del bot en grupos: "/libre@status123121bot".
  const [comando = '', argumento = ''] = limpiarComando(texto);
  const sinBarra = comando.startsWith('/') ? comando.slice(1) : comando;

  try {
    if (comando === '/start') {
      await contestar(
        chatId,
        enumMensaje(
          await estadoVivo(),
          'Manda un estado de la lista y el panel joerootX se actualiza.',
        ),
      );
      return Response.json({ ok: true, motivo: 'bienvenida' });
    }

    if (comando === '/estado') {
      if (!argumento) {
        await contestar(chatId, enumMensaje(await estadoVivo(), ''));
        return Response.json({ ok: true, motivo: 'consulta' });
      }
      const destino = argumento ? ALIAS[argumento] : undefined;
      if (destino) {
        const guardado = await cambiarEstado(destino, chatId);
        return Response.json({ ok: guardado, motivo: 'estado cambiado' });
      }
      await contestar(chatId, enumMensaje(await estadoVivo(), `<b>${escapar(argumento)}</b> no es un estado válido.`));
      return Response.json({ ok: true, motivo: 'estado desconocido' });
    }

    const directo = sinBarra ? ALIAS[sinBarra] : undefined;
    if (directo) {
      const guardado = await cambiarEstado(directo, chatId);
      return Response.json({ ok: guardado, motivo: 'estado cambiado' });
    }

    await contestar(chatId, enumMensaje(await estadoVivo(), `No reconozco <b>${escapar(comando)}</b>.`));
    return Response.json({ ok: true, motivo: 'comando desconocido' });
  } catch (error) {
    console.error('[telegram-webhook] error procesando:', error);
    return Response.json({ ok: false, motivo: 'error interno' }, { status: 200 });
  }
}
