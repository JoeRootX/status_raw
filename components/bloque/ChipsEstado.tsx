import { ESTADOS, ORDEN_ESTADOS, type EstadoId } from '@/lib/datos';

/**
 * Chips de solo lectura.
 *
 * Antes eran radios y el visitante podia moverse su propio estado ahi mismo. Ahora
 * el estado lo cambia Joe con el bot de Telegram, asi que cada chip es un <div> y el
 * activo se marca con [data-activo]. Esa sustitucion es la que deja el CSS de blur y
 * flote intacto: `input:not(:checked)` paso a ser `:not([data-activo])`.
 *
 * El grupo lleva tabindex=0 a proposito. Al no haber controles que enfocar, sin el
 * los chips no se podrian ver nitidos con el teclado; enfocando el grupo una sola
 * vez, `.chips:focus-within` los aclara todos. Un solo tabulador en vez de cinco.
 */
export default function ChipsEstado({ actual }: { actual: EstadoId }) {
  const { etiqueta: activa } = ESTADOS[actual];

  return (
    <div className="chips" role="group" aria-label={`Estado actual: ${activa}`} tabIndex={0}>
      {ORDEN_ESTADOS.map((id) => {
        const activo = id === actual;
        return (
          <div
            key={id}
            className="chip"
            data-s={id}
            data-activo={activo ? '' : undefined}
            aria-current={activo ? 'true' : undefined}
          >
            <span className="chip__box">
              <i aria-hidden="true" />
              {ESTADOS[id].etiqueta}
            </span>
          </div>
        );
      })}
    </div>
  );
}