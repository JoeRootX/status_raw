/**
 * Rutina del horario laboral: la golpea el cron de GitHub Actions
 * (`.github/workflows/rutina.yml`) en las horas exactas del horario de Jalisco
 * y aquí se decide qué toca. `scripts/cron-setup.mjs` queda como alternativa
 * QStash si Actions dejara de servir.
 *
 * Capa 1: `Authorization: Bearer RUTINA_SECRETO` — sin la env correcta no
 * entra; el secreto vive solo en Vercel y en el secreto del repo de GitHub.
 * Capa 2: el guardia de `lib/rutina.ts` — aunque colara un POST forjado, solo
 * puede actuar dentro de un slot weekdays de 9 a 21 (nada en la noche, nada
 * en fin de semana).
 *
 * Siempre responde 200 cuando el motivo no es de seguridad: el cron no
 * reintenta los 5xx y nos interesa que un slot ya atendido no se dispare de
 * nuevo. El workflow usa `curl --fail-with-body` para que un 401/5xx sí se
 * vea como run fallido.
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

  // Se reclama el slot con un SET NX atómico por slot: dos disparos del cron
  // a la misma hora no pueden mandar dos avisos ni siquiera si llegan a la
  // vez (el check-then-set de `rutina_ultimo` tenía esa carrera). La marca
  // caduca sola; si Telegram falla, se acepta la pérdida (el estado sí se
  // apunta; solo se pierde el texto del aviso).
  const marcaSlot = `rutina_slot_${slot}`;
  const reclamado = await redisSet(marcaSlot, '1', { nx: true, ex: 60 * 60 * 48 });
  if (!reclamado) {
    const yaEstaba = (await redisGet(marcaSlot)) === '1';
    return Response.json({
      ok: yaEstaba,
      motivo: yaEstaba ? 'slot ya atendido' : 'almacenamiento caído',
      slot,
    });
  }

  // Se conserva la clave vieja como bitácora del último slot atendido.
  await redisSet('rutina_ultimo', slot);

  switch (accion.tipo) {
    case 'jornada': {
      const guardado = await redisSet(ESTADO_REDIS_KEY, 'work');
      if (guardado) {
        try {
          revalidateTag(TAG_ESTADO, { expire: 0 });
        } catch (error) {
          // El estado ya quedó guardado; el cache se refresca en 5 min.
          console.error('[rutina] no se pudo purgar el cache:', error);
        }
      }
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
