import type { ReactNode } from 'react';
import { esListo, type Senal } from '@/lib/fuente';
import { ERROR_POR_DEFECTO, SIN_DATOS_POR_DEFECTO } from '@/lib/datos';

/**
 * Dibuja una `Senal` sin repetir el `if (esListo(...))` en cada bloque.
 *
 * El fallback importa: una fuente vacia y una caida se leen distinto, asi que el
 * mensaje se elige por rama y no se muestra un error generico cuando en realidad
 * no hay nada que mostrar.
 */
export default function Estado<T>({
  senal,
  children,
}: {
  senal: Senal<T>;
  children: (datos: T) => ReactNode;
}) {
  if (esListo(senal)) return <>{children(senal.datos)}</>;

  const texto = senal.mensaje || (senal.estado === 'error' ? ERROR_POR_DEFECTO : SIN_DATOS_POR_DEFECTO);

  return (
    <p className="card-note" role={senal.estado === 'error' ? 'alert' : undefined}>
      {texto}
    </p>
  );
}