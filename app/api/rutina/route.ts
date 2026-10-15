/**
 * Rutina del horario laboral: la golpea un cron externo (schedule de QStash)
 * en las horas exactas del horario de Jalisco y aquí se decide qué toca.
 *
 * Capa 1: `Authorization: Bearer RUTINA_SECRETO` — sin la env correcta no
 * entra; el secreto vive solo en Vercel y en el schedule del cron.
 * Capa 2: el guardia de `lib/rutina.ts` — aunque colara un POST forjado, solo
 * puede actuar dentro de un slot weekdays de 9 a 21 (nada en la noche, nada
 * en fin de semana).
 *
 * Siempre responde 200 cuando el motivo no es de seguridad: QStash reintenta
 * los 5xx y nos interesa que un slot ya atendido no se dispare de nuevo.
 */

import { revalidateTag } from 'next/cache';
import { ESTADOS } from '@/lib/datos';
import {
  ESTADO_REDIS_KEY,
  TAG_ESTADO,
  estadoVivo,
  redisGet,
  redisSet,
} from '@/lib/estado';
import { accionRutina, horaLocal, idDeSlot, teclado, textoDe, type Teclado } from '@/lib/rutina';

export const revalidate = 0;

const SECRETO = process.env.RUTINA_SECRETO;
const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = Number(process.env.TELEGRAM_CHAT_ID);

if (process.env.NODE_ENV === 'production') {
  if (!SECRETO) console.warn('[rutina] RUTINA_SECRETO no definida: el endpoint rechaza todo.');
}

/** sendMessage con teclado opcional para los avisos programados. */
async function enviar(texto: string, mark?: Teclado): Promise<boolean> {
  if (!TOKEN || !CHAT_ID) return false;
  try {
    const respuesta = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: texto,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        ...(mark ? { reply_markup: mark } : {}),
      }),
      signal: AbortSignal.timeout(8_000),
    });
    if (!respuesta.ok) console.error('[rutina] sendMessage falló:', respuesta.status);
    return respuesta.ok;
  } catch (error) {
    console.error('[rutina] sin respuesta de Telegram:', error);
    return false;
  }
}

export async function POST(request: Request) {
  // Capa 1: solo el cron con el secreto.
  if (
    !SECRETO ||
    request.headers.get('authorization') !== `Bearer ${SECRETO}`
  ) {
    return Response.json({ ok: false, motivo: 'sin autorización' }, { status: 401 });
  }

  const h = horaLocal();
  const slot = idDeSlot(h);
  const accion = accionRutina(h);
  if (!accion) return Response.json({ ok: true, motivo: 'fuera de horario', slot });

  const previo = await redisGet('rutina_ultimo');
  if (previo === slot) {
    return Response.json({ ok: true, motivo: 'slot ya atendido', slot });
  }

  // Se reclama el slot antes de actuar: dos disparos de QStash cerca no
  // preguntan dos veces. Si Telegram falla, se acepta la pérdida (el estado
  // sí se apunta; solo se pierde el texto del aviso).
  const reclamado = await redisSet('rutina_ultimo', slot);
  if (!reclamado) {
    return Response.json({ ok: false, motivo: 'almacenamiento caído', slot });
  }

  switch (accion.tipo) {
    case 'jornada': {
      const guardado = await redisSet(ESTADO_REDIS_KEY, 'work');
      if (guardado) revalidateTag(TAG_ESTADO, { expire: 0 });
      const mandado = await enviar(
        guardado
          ? textoDe(accion)
          : '⚠️ No pude poner el horario en el panel (almacenamiento). Manda /trabajo si sigues.',
        teclado(),
      );
      return Response.json({ ok: true, motivo: 'jornada', guardado, mandado, slot });
    }
    default: {
      const actual = await estadoVivo();
      const mandado = await enviar(textoDe(accion, ESTADOS[actual]?.etiqueta), teclado());
      return Response.json({ ok: true, motivo: accion.tipo, mandado, slot });
    }
  }
}
