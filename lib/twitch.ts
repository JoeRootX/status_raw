/**
 * Directo de Twitch para el panel de estado.
 *
 * La bandera `LIVE` se lee en cada peticion (no se memoriza) para que un
 * redeploy o un cambio de entorno la refleje sin tocar codigo. Se aceptan
 * `1` y `true` sin distinguir mayusculas.
 */

export const CANAL_TWITCH = 'https://twitch.tv/joerootx';
export const TEXTO_LIVE = 'LIVE';

export function estaEnDirecto(): boolean {
  const valor = process.env.LIVE?.trim().toLowerCase();
  return valor === '1' || valor === 'true';
}
