import { ESTADO_ACTUAL } from '@/lib/datos';
import { ultimoCommit } from '@/lib/github';
import { cancionActual } from '@/lib/spotify';
import { videoActual } from '@/lib/youtube';
import ChipsEstado from '@/components/bloque/ChipsEstado';
import ContactForm from '@/components/bloque/ContactForm';
import Footer from '@/components/bloque/Footer';
import Identidad from '@/components/bloque/Identidad';
import InfoCards from '@/components/bloque/InfoCards';
import Multimedia from '@/components/bloque/Multimedia';
import Reloj from '@/components/bloque/Reloj';

/**
 * Cinco minutos. Es lo que tarda GitHub en devolver los datos y lo que aguanta un
 * panel de estado sin que cada visita dispare una peticion a su API.
 */
export const revalidate = 300;

export default async function Inicio() {
  const commit = await ultimoCommit();
  const spotify = await cancionActual();
  const youtube = await videoActual();

  return (
    <>
      <header className="top">
        <div className="brand">&gt; joerootX_</div>
        <Reloj />
      </header>

      {/* data-state va aqui y no en <body>: en React no se puede poner un atributo
          en el body desde un componente, y al declararse --st en este elemento
          todo lo que cuelga lo hereda igual. De ahi `[data-state="..."]` en el CSS. */}
      <main data-state={ESTADO_ACTUAL}>
        {/* CENTRO: identidad, estado y trabajo en curso */}
        <section className="center">
          <Identidad estado={ESTADO_ACTUAL} />
          <InfoCards commit={commit} />
          <ChipsEstado actual={ESTADO_ACTUAL} />
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