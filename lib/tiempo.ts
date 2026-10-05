/**
 * "hace 2 horas", "hace 3 días".
 *
 * Se calcula en el servidor y el resultado llega al cliente como texto ya hecho,
 * no como fecha: si el navegador lo calculara por su cuenta, su reloj podria no
 * coincidir con el del servidor y React marcaria la diferencia como error de
 * hidratacion.
 */

const rtf = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });

/** De la unidad mas gruesa a la mas fina. Los segundos son el tope de la tabla. */
const ESCALAS: readonly [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 31_536_000],
  ['month', 2_592_000],
  ['week', 604_800],
  ['day', 86_400],
  ['hour', 3_600],
  ['minute', 60],
];

export function haceCuando(iso: string, ahora: number = Date.now()): string {
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return '';

  // Negativo cuando la fecha ya paso, que es lo que quiere decir "hace".
  const segundos = (fecha.getTime() - ahora) / 1000;
  const magnitud = Math.abs(segundos);

  for (const [unidad, tamano] of ESCALAS) {
    if (magnitud >= tamano) return rtf.format(Math.round(segundos / tamano), unidad);
  }
  return rtf.format(Math.round(segundos), 'second');
}

/** ISO corto, para el title por si el texto relativo no alcanza. */
export function fechaCorta(iso: string): string {
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return '';
  return fecha.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}