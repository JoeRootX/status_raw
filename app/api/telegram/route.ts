/**
 * Webhook del bot de Telegram (@status123121bot).
 *
 * Solo Joe puede mover los chips: el endpoint ignora a cualquiera cuya `chat.id`
 * no sea exactamente `TELEGRAM_CHAT_ID`, y Telegram manda por su cuenta un
 * encabezado secreto que configuramos en `set_webhook` — sin él, ni siquiera
 * leyendo el cuerpo se entra. Ambas capas se validan antes de tocar Redis.
 *
 * Comandos: `/estado` (ver), `/estado <clave>` y los directos en español.
 */

import { revalidateTag } from 'next/cache';
import { ESTADOS, ORDEN_ESTADOS, type EstadoId } from '@/lib/datos';
import { ESTADO_REDIS_KEY, TAG_ESTADO, estadoVivo, redisSet } from '@/lib/estado';

export const revalidate = 0;

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = Number(process.env.TELEGRAM_CHAT_ID);
const SECRETO = process.env.TELEGRAM_WEBHOOK_SECRET;

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
  meet: 'meet',
  junta: 'meet',
};

type Mensaje = {
  chat?: { id?: number };
  text?: string;
};

type Update = { message?: Mensaje };

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
  const chatId = mensaje?.chat?.id;
  const texto = mensaje?.text?.trim().toLowerCase() ?? '';
  if (!chatId || !texto) return Response.json({ ok: true, motivo: 'sin mensaje' });

  // Capa 2: solo el chat de Joe cambia cosas.
  if (CHAT_ID && chatId !== CHAT_ID) {
    await contestar(chatId, 'Este bot solo atiende a Joe. 🤫');
    return Response.json({ ok: true, motivo: 'chat no autorizado' });
  }

  // Telegram antepone el usuario del bot en grupos: "/libre@status123121bot".
  const [comando = '', argumento = ''] = texto
    .split(/\s+/)
    .map((parte) => parte.replace(/@[^@]*$/, ''));
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
        const guardado = await redisSet(ESTADO_REDIS_KEY, destino);
        if (guardado) revalidateTag(TAG_ESTADO, "max");
        await contestar(
          chatId,
          guardado
            ? `Estado actualizado: <b>${etiquetaDe(destino)}</b> ✅`
            : 'No se alcanzó el almacenamiento. Intenta de nuevo.',
        );
        return Response.json({ ok: guardado, motivo: 'estado cambiado' });
      }
      await contestar(chatId, enumMensaje(await estadoVivo(), `<b>${argumento}</b> no es un estado válido.`));
      return Response.json({ ok: true, motivo: 'estado desconocido' });
    }

    const directo = sinBarra ? ALIAS[sinBarra] : undefined;
    if (directo) {
      const guardado = await redisSet(ESTADO_REDIS_KEY, directo);
      if (guardado) revalidateTag(TAG_ESTADO, "max");
      await contestar(
        chatId,
        guardado
          ? `Estado actualizado: <b>${etiquetaDe(directo)}</b> ✅`
          : 'No se alcanzó el almacenamiento. Intenta de nuevo.',
      );
      return Response.json({ ok: guardado, motivo: 'estado cambiado' });
    }

    await contestar(chatId, enumMensaje(await estadoVivo(), `No reconozco <b>${comando}</b>.`));
    return Response.json({ ok: true, motivo: 'comando desconocido' });
  } catch (error) {
    console.error('[telegram-webhook] error procesando:', error);
    return Response.json({ ok: false, motivo: 'error interno' }, { status: 200 });
  }
}
