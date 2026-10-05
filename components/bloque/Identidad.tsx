import Image from 'next/image';
import { ESTADOS, type EstadoId } from '@/lib/datos';

export default function Identidad({ estado }: { estado: EstadoId }) {
  const { titulo, lema } = ESTADOS[estado];

  return (
    <div className="me">
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