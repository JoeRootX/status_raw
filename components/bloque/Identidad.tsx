import Image from 'next/image';
import { ESTADOS, type EstadoId } from '@/lib/datos';
import { CANAL_TWITCH, TEXTO_LIVE, estaEnDirecto } from '@/lib/twitch';

/**
 * Sin `estado` (modo privado) la tarjeta se queda en identidad: no dice que
 * esta haciendo Joe ni cuando. El titulo y el lema fijos salen de aqui y no de
 * `ESTADOS` porque no son un estado, son la presentacion.
 */
export default function Identidad({ estado }: { estado?: EstadoId }) {
  const titulo = estado ? ESTADOS[estado].titulo : 'joerootX';
  const lema = estado ? ESTADOS[estado].lema : 'Desarrollador · Creador de contenido';

  return (
    <div className="me">
      {estaEnDirecto() && (
        <a className="live" href={CANAL_TWITCH} target="_blank" rel="noopener noreferrer">
          {TEXTO_LIVE}
        </a>
      )}
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
