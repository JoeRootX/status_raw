'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';

type Campo = 'nombre' | 'telefono' | 'correo' | 'mensaje' | 'consentimiento';

/** Cada regla devuelve `true` o el texto del error. */
type Regla = (valor: string, control: HTMLInputElement | HTMLTextAreaElement) => true | string;

/**
 * Las cinco son deliberadamente tacanas: la validacion de verdad la hara el
 * servidor cuando exista la ruta `/api/contacto`, y estas son solo la primera linea
 * para no mandar basura por la red.
 */
const REGLAS: Record<Campo, Regla> = {
  nombre: (v) => v.trim().length >= 3 || 'Escribe tu nombre completo.',
  telefono: (v) =>
    (/^[+()\d\s-]+$/.test(v) && v.replace(/\D/g, '').length >= 10) ||
    'Escribe un teléfono válido (10 dígitos o más).',
  correo: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) || 'Escribe un correo válido.',
  mensaje: (v) => v.trim().length >= 10 || 'El mensaje es muy corto (mínimo 10 caracteres).',
  consentimiento: (_v, control) =>
    (control as HTMLInputElement).checked || 'Debes aceptar el Aviso de privacidad para enviar.',
};

const CAMPOS = Object.keys(REGLAS) as Campo[];

type Errores = Partial<Record<Campo, string>>;
type Fase = 'inicial' | 'enviando' | 'enviado' | 'error';

const idDe = (campo: Campo) => `e-${campo}`;

/**
 * SIMULADO hasta que exista la ruta del servidor. El token del bot de Telegram NO
 * puede ir aqui: todo lo del navegador lo lee cualquiera que abra la pestana.
 * Cuando exista, esta funcion pasa a hacer POST a /api/contacto y el resto del
 * componente (validacion, estados, foco) no cambia.
 */
const ENVIAR_SIMULADO = 'ok'; // 'ok' | 'error' para probar los dos desenlaces

function enviarSimulado(): Promise<void> {
  return new Promise((resolver, rechazar) => {
    setTimeout(() => {
      if (ENVIAR_SIMULADO === 'ok') resolver();
      else rechazar(new Error('simulado'));
    }, 900);
  });
}

export default function ContactForm() {
  const [errores, setErrores] = useState<Errores>({});
  const [fase, setFase] = useState<Fase>('inicial');
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
      const resultado = REGLAS[campo](control.value, control);
      if (resultado !== true) {
        collected[campo] = resultado;
        primero ??= control;
      }
    }
    return { errores: collected, primero };
  }

  function limpiar(campo: Campo) {
    setErrores((previos) => (previos[campo] ? { ...previos, [campo]: undefined } : previos));
  }

  async function alEnviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const el = form.current;
    if (!el || fase === 'enviando') return;

    if (fase !== 'inicial') setFase('inicial');

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

    setFase('enviando');
    try {
      await enviarSimulado();
      el.reset();
      setErrores({});
      setFase('enviado');
    } catch {
      setFase('error');
    }
  }

  const err = (campo: Campo) => errores[campo];
  const invalido = (campo: Campo) => (errores[campo] ? 'true' : undefined);

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
          {fase === 'error'
            ? 'No se pudo enviar. Inténtalo de nuevo o escríbeme al correo del pie de página.'
            : null}
        </p>
      </form>
    </article>
  );
}