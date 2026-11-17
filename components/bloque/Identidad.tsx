import Image from 'next/image';
import { ESTADOS, type EstadoId } from '@/lib/datos';
import { canalTwitch, TEXTO_LIVE, estaEnDirecto } from '@/lib/twitch';

/**
 * Sin `estado` (modo privado) la tarjeta se queda en identidad: no dice que
 * esta haciendo Joe ni cuando. El titulo y el lema fijos salen de aqui y no de
 * `ESTADOS` porque no son un estado, son la presentacion.
 *
 * El letrero LIVE depende de `estaEnDirecto()`, que ya exige panel publico: en
 * modo privado no se pinta aunque `LIVE=true`.
 */
export default function Identidad({ estado }: { estado?: EstadoId }) {
  const titulo = estado ? ESTADOS[estado].titulo : 'joerootX';
  const lema = estado ? ESTADOS[estado].lema : 'Desarrollador · Creador de contenido';
  const canal = canalTwitch();

  return (
    <div className="me">
      {estaEnDirecto() &&
        (canal ? (
          <a className="live" href={canal} target="_blank" rel="noopener noreferrer">
            {TEXTO_LIVE}
          </a>
        ) : (
          <span className="live">{TEXTO_LIVE}</span>
        ))}
      <Image
        className="avatar"
        src="/avatar.jpg"
        alt="Foto de perfil de Joe"
        width={480}
        height={480}
        priority
      />
      {/* aria-live: cuando el bot cambie el estado, el lector de pantalla lo anuncia. */}
      <h1>
        <span aria-live="polite">{titulo}</span>
        <span className="dot" aria-hidden="true" />
      </h1>
      <p>{lema}</p>
    </div>
  );
}
