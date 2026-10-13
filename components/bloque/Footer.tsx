import Link from 'next/link';
import { CORREO, WHATSAPP } from '@/lib/datos';
import { esExterno, LEGALES, REDES, type Enlace } from '@/lib/enlaces';

function Item({ texto, href }: Enlace) {
  if (href === null) return <span className="sin-destino">{texto}</span>;

  // Las rutas internas con Link para la navegacion de cliente; las externas con
  // <a> normal, rel=noreferrer porque no sabemos si third-party.
  if (esExterno(href)) {
    return (
      <a href={href} target="_blank" rel="noreferrer">
        {texto}
      </a>
    );
  }
  return <Link href={href}>{texto}</Link>;
}

export default function Footer() {
  return (
    <footer>
      <div>
        <span className="who">joerootX</span> &nbsp;|&nbsp; Desarrollador · Creador de contenido
      </div>
      <nav aria-label="Legal y contacto">
        {LEGALES.map((enlace) => (
          <Item key={enlace.texto} {...enlace} />
        ))}
        <a href={`mailto:${CORREO}`}>{CORREO}</a>
        {/* Click-to-chat: abre WhatsApp del teléfono, sin pasar por el servidor.
            Sin número configurado no se pinta nada (cero placeholders falsos). */}
        {WHATSAPP ? (
          <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noreferrer">
            WhatsApp
          </a>
        ) : null}
      </nav>
      <nav aria-label="Redes">
        {REDES.map((enlace) => (
          <Item key={enlace.texto} {...enlace} />
        ))}
      </nav>
    </footer>
  );
}