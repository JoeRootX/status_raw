import { esPanelPublico } from './privacidad';

/**
 * Canal del directo. Configurable por entorno y vacio por defecto.
 *
 * No se fija un canal por defecto a proposito: la capa 1 (profesional) y la de
 * streaming son identidades distintas y un enlace duro entre ellas es un puente
 * que la arquitectura prohibe (ver Identidad-Publica en el vault). Sin
 * `TWITCH_CANAL` el letrero se pinta sin enlace: un enlace muerto es peor que
 * ninguno. Decisión 2026-11-20 (B7): el canal es el profesional,
 * https://www.twitch.tv/joerootx, y se activa poniendo TWITCH_CANAL en Vercel.
 *
 * Solo se acepta https absoluto; cualquier otra cosa se descarta en vez de
 * acabar como href arbitrario.
 */
export function canalTwitch(): string {
  const valor = process.env.TWITCH_CANAL?.trim() ?? '';
  return /^https:\/\/[a-z0-9-]+(\.[a-z0-9-]+)+(\/\S*)?$/i.test(valor) ? valor : '';
}

export const TEXTO_LIVE = 'LIVE';

/**
 * El letrero solo existe con el panel publico.
 *
 * Leer `LIVE` sin mirar `PANEL_PUBLICO` hacia que el modo privado siguiera
 * anunciando el directo en tiempo real: la fuga de presencia sobrevivia al
 * cierre del panel (H-01 de la auditoria del 2026-11-11).
 */
export function estaEnDirecto(): boolean {
  if (!esPanelPublico()) return false;
  const valor = process.env.LIVE?.trim().toLowerCase();
  return valor === '1' || valor === 'true';
}
