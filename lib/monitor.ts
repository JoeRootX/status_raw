/**
 * Monitoreo de las fuentes del panel y armado del digest por correo.
 *
 * La revisión es pura: recibe un mapa de comprobaciones y clasifica cada
 * `Fuente<T>` en un nivel legible. El endpoint `/api/monitor` inyecta los
 * loaders reales; así los tests no tocan la red ni dependen de credenciales.
 *
 * Mismo contrato que el resto del panel: un `error` es una fuente caída, un
 * `vacio` es una fuente que contestó pero sin datos, y `modo: 'manual'` es una
 * fuente que todavía no tiene credenciales (muestra su dato de ejemplo).
 */

import type { Fuente, Modo } from './fuente';

export type Nivel = 'ok' | 'aviso' | 'falla' | 'sin-configurar';

export type Revision = {
  fuente: string;
  nivel: Nivel;
  detalle: string;
  modo: Modo;
};

/** Una comprobación es cualquier loader del panel (`ultimoCommit`, etc.). */
export type Comprobacion = () => Promise<Fuente<unknown>>;
export type Comprobaciones = Record<string, Comprobacion>;

export type Digest = {
  asunto: string;
  texto: string;
  html: string;
  fallas: number;
  avisos: number;
  sinConfigurar: number;
};

const ICONO: Record<Nivel, string> = {
  ok: '✅',
  aviso: '⚠️',
  falla: '❌',
  'sin-configurar': '➖',
};

/** Clasifica la señal de una fuente sin importar de dónde venga el dato. */
export function clasificar(fuente: string, { modo, senal }: Fuente<unknown>): Revision {
  if (senal.estado === 'error') {
    return { fuente, nivel: 'falla', detalle: senal.mensaje, modo };
  }
  if (modo === 'manual') {
    return {
      fuente,
      nivel: 'sin-configurar',
      detalle: 'Sin credenciales: la tarjeta muestra el dato de ejemplo.',
      modo,
    };
  }
  if (senal.estado === 'vacio') {
    return { fuente, nivel: 'aviso', detalle: senal.mensaje, modo };
  }
  return { fuente, nivel: 'ok', detalle: 'Responde con datos.', modo };
}

/** Corre todas las comprobaciones en paralelo; una excepción es una falla más. */
export async function revisarFuentes(comprobaciones: Comprobaciones): Promise<Revision[]> {
  const nombres = Object.keys(comprobaciones);
  return Promise.all(
    nombres.map(async (nombre) => {
      try {
        return clasificar(nombre, await comprobaciones[nombre]!());
      } catch (error) {
        return {
          fuente: nombre,
          nivel: 'falla' as const,
          detalle: error instanceof Error ? error.message : 'La fuente lanzó una excepción.',
          modo: 'auto' as const,
        };
      }
    }),
  );
}

function escapar(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Arma asunto, texto plano y HTML del digest con lo que devolvió la revisión. */
export function componerDigest(revisiones: Revision[], ahora: Date = new Date()): Digest {
  const fallas = revisiones.filter((r) => r.nivel === 'falla').length;
  const avisos = revisiones.filter((r) => r.nivel === 'aviso').length;
  const sinConfigurar = revisiones.filter((r) => r.nivel === 'sin-configurar').length;

  const resumen = fallas
    ? `${fallas} fuente${fallas === 1 ? '' : 's'} con falla`
    : avisos
      ? `${avisos} aviso${avisos === 1 ? '' : 's'}`
      : 'todo en orden';
  const fecha = ahora.toISOString().replace('T', ' ').slice(0, 16);

  const lineas = revisiones.map((r) => `${ICONO[r.nivel]} ${r.fuente}: ${r.detalle}`);
  const texto = [
    `Monitor de fuentes · ${fecha} UTC`,
    resumen,
    '',
    ...lineas,
    '',
    sinConfigurar
      ? `${sinConfigurar} fuente(s) sin credenciales: revisa las variables de entorno.`
      : 'Todas las fuentes configuradas tienen credenciales.',
  ].join('\n');

  const items = revisiones
    .map(
      (r) =>
        `<li><b>${escapar(r.fuente)}</b> — ${ICONO[r.nivel]} ${escapar(r.detalle)}</li>`,
    )
    .join('');
  const html = [
    `<h2>Monitor de fuentes</h2>`,
    `<p>${escapar(fecha)} UTC · <b>${escapar(resumen)}</b></p>`,
    `<ul>${items}</ul>`,
    `<p>${escapar(
      sinConfigurar
        ? `${sinConfigurar} fuente(s) sin credenciales: revisa las variables de entorno.`
        : 'Todas las fuentes configuradas tienen credenciales.',
    )}</p>`,
  ].join('');

  return {
    asunto: `[joerootX] Monitor de fuentes · ${resumen}`,
    texto,
    html,
    fallas,
    avisos,
    sinConfigurar,
  };
}
