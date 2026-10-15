/* ============================================================
   ESTADOS
   El estado lo cambia Joe con un bot de Telegram, nunca el
   visitante. Los chips son de solo lectura por eso.
   ============================================================ */

export const ESTADOS = {
  work: { etiqueta: 'Trabajo', titulo: 'En trabajo · No molestar', lema: 'Enfocado en lo que importa.' },
  personal: { etiqueta: 'Personal', titulo: 'Proyecto personal', lema: 'Nada urgente, escríbeme.' },
  free: { etiqueta: 'Libre', titulo: 'Libre', lema: 'Buen momento para escribirme.' },
  eat: { etiqueta: 'Ausente', titulo: 'Ausente', lema: 'Vuelvo en un rato.' },
  meet: { etiqueta: 'Junta', titulo: 'En junta', lema: 'Respondo al salir.' },
} as const;

export type EstadoId = keyof typeof ESTADOS;

/** El orden en que se pintan los chips. Vive aparte para que el objeto de arriba
 *  no tenga que llevar ese orden implicito y sobreescribirlo rompa el diseno. */
export const ORDEN_ESTADOS = ['work', 'personal', 'free', 'eat', 'meet'] as const satisfies
  readonly EstadoId[];

export const esEstadoId = (v: string): v is EstadoId => Object.hasOwn(ESTADOS, v);

/** Donde esta Joe ahora mismo. Lo sobrescribe el bot de Telegram. */
export const ESTADO_ACTUAL: EstadoId = 'work';

/* ============================================================
   LEGAL
   ============================================================ */

export const CORREO = 'joeroot.dev@gmail.com';
/** Número de WhatsApp con país (ej. '523312345678'). Vacío = sin botón en el pie. */
export const WHATSAPP = '';
/* Responsable genérico a propósito: el sitio personal expone como titular al
   sitio mismo, no al nombre ni domicilio de la persona. */
export const NOMBRE = 'El titular del sitio joerootX';
export const DOMICILIO = 'Jalisco, México';
export const FECHA_ACTUALIZACION = '13 de octubre de 2026';

/* ============================================================
   TEXTOS DE ESTADO VACIO / ERROR
   Cada bloque usa los suyos si su senal no trae mensaje, para
   que un fallo siempre sea legible y especifico de la fuente.
   ============================================================ */

export const ERROR_POR_DEFECTO = 'No se pudo cargar esta informacion.';
export const SIN_DATOS_POR_DEFECTO = 'Sin datos por ahora.';

/* Nota: los datos de Jira, Spotify, YouTube y GitHub ya no viven aqui. Cada
   fuente tiene su modulo real (lib/jira.ts, lib/spotify.ts, lib/youtube.ts,
   lib/github.ts) con su propio valor de ejemplo para cuando faltan credenciales
   (patron mock-first). Los mocks duplicados de este archivo llevaban meses sin
   usarse y confundian: la tarjeta de Jira pintaba "SDT-1738" que ya no existia. */
