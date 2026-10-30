/**
 * Monitoreo periódico de las fuentes del panel: revisa cada loader, arma el
 * digest y lo manda por correo.
 *
 * Lo dispara el cron de Vercel (`vercel.json`) con
 * `Authorization: Bearer CRON_SECRET`; también acepta POST con
 * `MONITOR_SECRETO` para probarlo a mano o desde QStash. Sin secreto, rechaza
 * todo: igual que `/api/rutina`, el endpoint hace trabajo real (peticiones a
 * las APIs y un correo) y no puede quedar abierto.
 *
 * Sin credenciales de correo el envío es simulado; la revisión de fuentes sí
 * corre siempre y el resumen se ve en la respuesta.
 */

import { colaTickets, ticketActual } from '@/lib/jira';
import { ultimoCommit } from '@/lib/github';
import { cancionActual } from '@/lib/spotify';
import { videoActual } from '@/lib/youtube';
import { enviarDigest } from '@/lib/correo';
import { componerDigest, revisarFuentes, type Comprobaciones } from '@/lib/monitor';

export const revalidate = 0;

const SECRETO = process.env.MONITOR_SECRETO ?? process.env.CRON_SECRET;

/** Los mismos loaders que pinta la página: el monitor vigila lo que se ve. */
const COMPROBACIONES: Comprobaciones = {
  github: ultimoCommit,
  'jira-actual': ticketActual,
  'jira-cola': colaTickets,
  spotify: cancionActual,
  youtube: videoActual,
};

if (process.env.NODE_ENV === 'production' && !SECRETO) {
  console.warn('[monitor] MONITOR_SECRETO/CRON_SECRET no definido: el endpoint rechaza todo.');
}

async function manejar(request: Request): Promise<Response> {
  if (!SECRETO || request.headers.get('authorization') !== `Bearer ${SECRETO}`) {
    return Response.json({ ok: false, motivo: 'sin autorización' }, { status: 401 });
  }

  const revisiones = await revisarFuentes(COMPROBACIONES);
  const digest = componerDigest(revisiones);
  const correo = await enviarDigest(digest);

  if (digest.fallas) {
    console.error(
      '[monitor] fuentes con falla:',
      revisiones.filter((r) => r.nivel === 'falla').map((r) => `${r.fuente}: ${r.detalle}`),
    );
  }
  if (!correo.ok) console.error('[monitor] no se pudo enviar el digest:', correo.detalle);

  return Response.json({
    ok: true,
    asunto: digest.asunto,
    fallas: digest.fallas,
    avisos: digest.avisos,
    sinConfigurar: digest.sinConfigurar,
    correo,
    revisiones,
  });
}

export const GET = manejar;
export const POST = manejar;
