'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { CAMPOS, REGLAS, type Campo } from '@/lib/validacion';

type CampoForm = Campo | 'consentimiento';

type Errores = Partial<Record<CampoForm, string>>;
type Fase = 'inicial' | 'enviando' | 'enviado' | 'error';

const idDe = (campo: CampoForm) => `e-${campo}`;

const TEXTO_FALLA =
  'No se pudo enviar. Inténtalo de nuevo o escríbeme al correo del pie de página.';

/**
 * El envio de verdad es POST a /api/contacto: ahi se re-valida y ahi vive el
 * token del bot de Telegram, que no puede ir nunca aqui — todo lo del
 * navegador lo lee cualquiera que abra la pestana. Devuelve el texto de
 * error a mostrar, o null si todo fue bien.
 */
async function enviar(payload: Record<string, unknown>): Promise<string | null> {
  try {
    const respuesta = await fetch('/api/contacto', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (respuesta.ok) return null;
    const datos = (await respuesta.json()) as { error?: unknown };
    return typeof datos.error === 'string' && datos.error ? datos.error : TEXTO_FALLA;
  } catch {
    return TEXTO_FALLA;
  }
}

export default function ContactForm() {
  const [errores, setErrores] = useState<Errores>({});
  const [fase, setFase] = useState<Fase>('inicial');
  const [motivo, setMotivo] = useState('');
  const form = useRef<HTMLFormElement>(null);

  /** Devuelve los errores de todos los campos y el primero que falla, para enfocarlo. */
  function comprobar(): { errores: Errores; primero: HTMLInputElement | HTMLTextAreaElement | null } {
    const el = form.current;
    if (!el) return { errores: {}, primero: null };

    const collected: Errores = {};
    let primero: HTMLInputElement | HTMLTextAreaElement | null = null;

    for (const campo of CAMPOS) {
      const control = el.elements.namedItem(campo);
      if (!(control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement)) continue;
      const resultado = REGLAS[campo](control.value);
      if (resultado !== true) {
        collected[campo] = resultado;
        primero ??= control;
      }
    }

    const consentimiento = el.elements.namedItem('consentimiento');
    if (consentimiento instanceof HTMLInputElement && !consentimiento.checked) {
      collected.consentimiento = 'Debes aceptar el Aviso de privacidad para enviar.';
      primero ??= consentimiento;
    }

    return { errores: collected, primero };
  }

  function limpiar(campo: CampoForm) {
    setErrores((previos) => (previos[campo] ? { ...previos, [campo]: undefined } : previos));
  }

  async function alEnviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const el = form.current;
    if (!el || fase === 'enviando') return;

    if (fase !== 'inicial') setFase('inicial');
    if (motivo) setMotivo('');

    const { errores: nuevos, primero } = comprobar();
    setErrores(nuevos);
    if (primero) {
      primero.focus();
      return; // estado: invalido
    }

    // Trampa anti-bots: se descarta en silencio, sin dar pistas a quien la lleno.
    const trampa = el.elements.namedItem('web');
    if (trampa instanceof HTMLInputElement && trampa.value) {
      console.warn('envio descartado: campo trampa relleno');
      return;
    }

    const leer = (nombre: string) => {
      const control = el.elements.namedItem(nombre);
      return control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement
        ? control.value.trim()
        : '';
    };
    const consentimiento = el.elements.namedItem('consentimiento');

    setFase('enviando');
    const fallo = await enviar({
      nombre: leer('nombre'),
      telefono: leer('telefono'),
      correo: leer('correo'),
      mensaje: leer('mensaje'),
      consentimiento: consentimiento instanceof HTMLInputElement && consentimiento.checked,
      web: trampa instanceof HTMLInputElement ? trampa.value : '',
    });

    if (fallo) {
      setMotivo(fallo);
      setFase('error');
      return;
    }

    el.reset();
    setErrores({});
    setFase('enviado');
  }

  const err = (campo: CampoForm) => errores[campo];
  const invalido = (campo: CampoForm) => (errores[campo] ? 'true' : undefined);

  return (
    <article className="card blurable" id="mensaje">
      <h2>Enviar mensaje por Telegram</h2>
      <form ref={form} onSubmit={alEnviar} noValidate>
        <label>
          Nombre completo
          <input
            name="nombre"
            autoComplete="name"
            maxLength={80}
            required
            aria-describedby={idDe('nombre')}
            aria-invalid={invalido('nombre')}
            onChange={() => limpiar('nombre')}
          />
          <span className="field-err" id={idDe('nombre')}>
            {err('nombre')}
          </span>
        </label>

        <label>
          Teléfono
          <input
            name="telefono"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            maxLength={20}
            required
            aria-describedby={idDe('telefono')}
            aria-invalid={invalido('telefono')}
            onChange={() => limpiar('telefono')}
          />
          <span className="field-err" id={idDe('telefono')}>
            {err('telefono')}
          </span>
        </label>

        <label>
          Correo electrónico
          <input
            name="correo"
            type="email"
            autoComplete="email"
            maxLength={120}
            required
            aria-describedby={idDe('correo')}
            aria-invalid={invalido('correo')}
            onChange={() => limpiar('correo')}
          />
          <span className="field-err" id={idDe('correo')}>
            {err('correo')}
          </span>
        </label>

        <label>
          Mensaje
          <textarea
            name="mensaje"
            maxLength={600}
            required
            aria-describedby={idDe('mensaje')}
            aria-invalid={invalido('mensaje')}
            onChange={() => limpiar('mensaje')}
          />
          <span className="field-err" id={idDe('mensaje')}>
            {err('mensaje')}
          </span>
        </label>

        <div className="hp" aria-hidden="true">
          <input name="web" tabIndex={-1} autoComplete="off" />
        </div>

        {/* El checkbox va como hermano del <label>, no dentro. Con el enlace de
            privacidad dentro de un <label> que envuelve al input, pulsar el enlace
            puede acabar alternando la casilla ademas de navegar. Aqui el texto se
            asocia por htmlFor y asi el enlace queda fuera de la activacion del label. */}
        <div className="consent">
          <input
            id="consentimiento"
            name="consentimiento"
            type="checkbox"
            required
            aria-describedby={idDe('consentimiento')}
            aria-invalid={invalido('consentimiento')}
            onChange={() => limpiar('consentimiento')}
          />
          <label htmlFor="consentimiento">
            Acepto el{' '}
            <Link href="/aviso-de-privacidad" target="_blank" rel="noreferrer">
              Aviso de privacidad
            </Link>{' '}
            y el tratamiento de mis datos para recibir respuesta.
          </label>
        </div>
        <span className="field-err" id={idDe('consentimiento')}>
          {err('consentimiento')}
        </span>

        <button className="send" type="submit" disabled={fase === 'enviando'}>
          {fase === 'enviando' ? 'Enviando…' : 'Enviar mensaje'}
        </button>

        {/* Estas dos regiones viven siempre en el DOM: una region viva declarada
            en el mismo instante que aparece su contenido no la anuncian todos los
            lectores de pantalla. Se ocultan por :empty cuando no tocante a nada. */}
        <p className="form-ok" role="status">
          {fase === 'enviado' ? 'Mensaje enviado. Gracias, te respondo en cuanto pueda.' : null}
        </p>
        <p className="form-err" role="alert">
          {fase === 'error' ? motivo || TEXTO_FALLA : null}
        </p>
      </form>
    </article>
  );
}