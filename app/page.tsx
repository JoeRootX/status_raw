import { ultimoCommit } from '@/lib/github';
import { cancionActual } from '@/lib/spotify';
import { videoActual } from '@/lib/youtube';
import { colaTickets, colaTicketsAlt, ticketActual } from '@/lib/jira';
import { estadoActual } from '@/lib/estado';
import { esPanelPublico } from '@/lib/privacidad';
import ChipsEstado from '@/components/bloque/ChipsEstado';
import ContactForm from '@/components/bloque/ContactForm';
import Footer from '@/components/bloque/Footer';
import Identidad from '@/components/bloque/Identidad';
import InfoCards from '@/components/bloque/InfoCards';
import Multimedia from '@/components/bloque/Multimedia';
import Reloj from '@/components/bloque/Reloj';
import Refresco from '@/components/bloque/Refresco';

/**
 * Cinco minutos. Es lo que tarda GitHub en devolver los datos y lo que aguanta un
 * panel de estado sin que cada visita dispare una peticion a su API.
 */
export const revalidate = 300;

export default async function Inicio() {
  // Modo privado (por defecto): tarjeta estatica. Sin estado, sin Jira, sin
  // musica, sin video y sin formulario. Ni siquiera se llama a las fuentes:
  // si no se piden, no se pueden filtrar por error en el HTML.
  if (!esPanelPublico()) {
    return (
      <>
        <header className="top">
          <div className="brand">&gt; joerootX_</div>
          <Reloj />
        </header>
        <main id="contenido">
          <section className="center">
            <Identidad />
          </section>
        </main>
        <Footer />
      </>
    );
  }

  // Las fuentes en paralelo: el estado no depende de las demas, asi que
  // esperar primero la suya y luego el resto alargaba la primera pinta sin motivo.
  const [estado, commit, spotify, youtube, ticket, cola, colaAlt] = await Promise.all([
    estadoActual(),
    ultimoCommit(),
    cancionActual(),
    videoActual(),
    ticketActual(),
    colaTickets(),
    colaTicketsAlt(),
  ]);

  return (
    <>
      <header className="top">
        <div className="brand">&gt; joerootX_</div>
        <Reloj />
      </header>

      {/* data-state va aqui y no en <body>: en React no se puede poner un atributo
          en el body desde un componente, y al declararse --st en este elemento
          todo lo que cuelga lo hereda igual. De ahi `[data-state="..."]` en el CSS. */}
      <main id="contenido" data-state={estado}>
        {/* Auto-refresco: sondea /api/estado cada 30 s y re-renderiza si cambió. */}
        <Refresco estado={estado} />
        {/* CENTRO: identidad, estado y trabajo en curso */}
        <section className="center">
          <Identidad estado={estado} />
          <InfoCards commit={commit} ticketActual={ticket} colaTickets={cola} colaAlt={colaAlt} />
          <ChipsEstado actual={estado} />
        </section>

        {/* IZQUIERDA: Spotify + YouTube */}
        <Multimedia spotify={spotify} youtube={youtube} />

        {/* DERECHA: mensaje por Telegram */}
        <section className="col col--contact" aria-label="Contacto">
          <div className="hold">
            <ContactForm />
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
