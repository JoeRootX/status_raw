/**
 * Contrato de una fuente de datos.
 *
 * Cada bloque del panel pide una `Fuente<T>` en vez de un valor pelado, para que
 * la interfaz pueda distinguir los tres casos que de verdad importan: que hay
 * datos, que la fuente contesto vacio, o que fallo. Sin esto, un `null` no dice si
 * es "no hay ticket en curso" o "la API de Jira se cayo".
 */

/** De donde sale el valor: la fuente real, o un valor fijo mientras no haya una. */
export type Modo = 'auto' | 'manual';

export type Listo<T> = { estado: 'listo'; datos: T };
export type Vacio = { estado: 'vacio'; mensaje: string };
export type Fallo = { estado: 'error'; mensaje: string };

export type Senal<T> = Listo<T> | Vacio | Fallo;

export type Fuente<T> = {
  modo: Modo;
  senal: Senal<T>;
};

export const listo = <T>(datos: T): Senal<T> => ({ estado: 'listo', datos });
export const vacio = (mensaje: string): Senal<never> => ({ estado: 'vacio', mensaje });
export const fallo = (mensaje: string): Senal<never> => ({ estado: 'error', mensaje });

/** Azucar de tipo: estrecha la senal a su rama `listo` sin castear a mano. */
export const esListo = <T>(senal: Senal<T>): senal is Listo<T> => senal.estado === 'listo';

/** Todo menos el mensaje de error, para no pintar dos avisos a la vez. */
export function conDatos<T, R>(senal: Senal<T>, cuandoHay: (datos: T) => R, siNo: (mensaje: string) => R): R {
  return esListo(senal) ? cuandoHay(senal.datos) : siNo(senal.mensaje);
}