import { validarCampos, type Campo } from '@/lib/validacion';
import { enviarATelegram, type MensajeContacto } from '@/lib/telegram';

export const revalidate = 0;

/**
 * Límite por IP: un envío por minuto. Mapa en memoria, suficiente en dev y
 * en Vercel (cada instancia pone el suyo: limitado, pero corta el spam
 * evidente). Los intentos cuentan, no solo los exitosos.
 */
const ULTIMOS_ENVIOS = new Map<string, number>();
const VENTANA_MS = 60_000;

type Cuerpo = Partial<Record<Campo, unknown>> & {
  consentimiento?: unknown;
  web?: unknown;
};

function leerTexto(cuerpo: Cuerpo, campo: Campo): string {
  const valor = cuerpo[campo];
  return typeof valor === 'string' ? valor.trim() : '';
}

export async function POST(request: Request) {
  const ip = (request.headers.get('x-forwarded-for') ?? 'local').split(',')[0]?.trim() || 'local';

  const ahora = Date.now();
  for (const [clave, cuando] of ULTIMOS_ENVIOS) {
    if (ahora - cuando > VENTANA_MS) ULTIMOS_ENVIOS.delete(clave);
  }
  const ultimo = ULTIMOS_ENVIOS.get(ip);
  if (ultimo !== undefined && ahora - ultimo < VENTANA_MS) {
    return Response.json(
      { ok: false, error: 'Espera un minuto antes de escribir de nuevo.' },
      { status: 429 },
    );
  }

  let cuerpo: Cuerpo;
  try {
    cuerpo = (await request.json()) as Cuerpo;
  } catch {
    return Response.json({ ok: false, error: 'Cuerpo inválido.' }, { status: 400 });
  }
  if (typeof cuerpo !== 'object' || cuerpo === null) {
    return Response.json({ ok: false, error: 'Cuerpo inválido.' }, { status: 400 });
  }

  // Trampa anti-bots: se finge éxito para no delatar que existe.
  if (typeof cuerpo.web === 'string' && cuerpo.web.trim()) {
    return Response.json({ ok: true, simulado: true });
  }

  const errores = validarCampos(cuerpo);
  if (Object.keys(errores).length > 0) {
    return Response.json(
      { ok: false, error: 'Revisa los campos marcados.', errores },
      { status: 400 },
    );
  }
  if (cuerpo.consentimiento !== true) {
    return Response.json(
      { ok: false, error: 'Debes aceptar el Aviso de privacidad.', errores: { consentimiento: 'Debes aceptar el Aviso de privacidad para enviar.' } },
      { status: 400 },
    );
  }

  ULTIMOS_ENVIOS.set(ip, ahora);

  const mensaje: MensajeContacto = {
    nombre: leerTexto(cuerpo, 'nombre'),
    telefono: leerTexto(cuerpo, 'telefono'),
    correo: leerTexto(cuerpo, 'correo'),
    mensaje: leerTexto(cuerpo, 'mensaje'),
    consentimiento: true,
  };

  const resultado = await enviarATelegram(mensaje);
  if (!resultado.ok) {
    console.error('[contacto] no se pudo enviar a Telegram:', resultado.detalle);
    return Response.json(
      { ok: false, error: 'No se pudo enviar el mensaje.' },
      { status: 502 },
    );
  }

  return Response.json({ ok: true, simulado: resultado.simulado });
}
