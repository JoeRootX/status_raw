import { listo, type Fuente } from './fuente';

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
   JIRA
   ============================================================ */

export type TicketActual = {
  clave: string;
  resumen: string;
};

export type TicketEnCola = {
  clave: string;
  resumen: string;
  prioridad: 'media' | 'baja';
};

export const TICKET_ACTUAL: Fuente<TicketActual> = {
  modo: 'manual',
  senal: listo({ clave: 'SDT-1738', resumen: 'Crear Endpoints para los nuevos tipos de solicitudes' }),
};

export const COLA_TICKETS: Fuente<TicketEnCola[]> = {
  modo: 'manual',
  senal: listo([
    { clave: 'SDT-1742', resumen: 'Ajustes en validaciones', prioridad: 'media' },
    { clave: 'SDT-1741', resumen: 'Corrección en módulo', prioridad: 'media' },
    { clave: 'SDT-1739', resumen: 'Notificaciones en tiempo real', prioridad: 'baja' },
  ]),
};

/* ============================================================
   GITHUB
   El commit ya no vive aqui: lo pide la API de GitHub, asi que
   lo trae `ultimoCommit()` en lib/github.ts. El dato de ejemplo
   que se usa sin token tambien esta ahi.
   ============================================================ */

/* ============================================================
   MULTIMEDIA
   ============================================================ */

export type Reproduccion = {
  titulo: string;
  artista: string;
  album?: string | null;
  imagen?: string | null;
  url?: string | null;
  avance: number;
};

export type Video = {
  titulo: string;
  canal: string;
  url?: string | null;
  imagen?: string | null;
  duracionSeg?: number | null;
  progresoSeg?: number | null;
  avance?: number;
  viendoAhora?: boolean;
};

export const SPOTIFY: Fuente<Reproduccion> = {
  modo: 'manual',
  senal: listo({
    titulo: 'shelter',
    artista: 'Porter Robinson, Madeon',
    album: 'shelter',
    imagen: null,
    url: null,
    avance: 42,
  }),
};

export const YOUTUBE: Fuente<Video> = {
  modo: 'manual',
  senal: listo({
    titulo: 'Título del video de ejemplo',
    canal: 'Nombre del canal',
    url: null,
    imagen: null,
    duracionSeg: null,
    progresoSeg: null,
    avance: 42,
    viendoAhora: true,
  }),
};

/* ============================================================
   LEGAL
   Hasta que un abogado revise el texto, estas rutas se sirven
   con robots noindex. Los corchetes son huecos reales.
   ============================================================ */

export const CORREO = 'correo@ejemplo.com';
export const NOMBRE = '[NOMBRE COMPLETO]';
export const DOMICILIO = '[DOMICILIO]';
export const FECHA_ACTUALIZACION = '[FECHA]';

/* ============================================================
   TEXTOS DE ESTADO VACIO / ERROR
   Cada bloque usa los suyos si su senal no trae mensaje, para
   que un fallo siempre sea legible y especifico de la fuente.
   ============================================================ */

export const ERROR_POR_DEFECTO = 'No se pudo cargar esta informacion.';
export const SIN_DATOS_POR_DEFECTO = 'Sin datos por ahora.';