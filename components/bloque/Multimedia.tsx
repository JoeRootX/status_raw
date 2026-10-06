import { YOUTUBE } from '@/lib/datos';
import type { Cancion } from '@/lib/spotify';
import type { Fuente } from '@/lib/fuente';
import Estado from './Estado';

function Barra({ avance }: { avance: number }) {
  return (
    <div className="bar">
      <span style={{ width: `${Math.max(0, Math.min(100, avance))}%` }} />
    </div>
  );
}

type Props = {
  spotify: Fuente<Cancion>;
};

export default function Multimedia({ spotify }: Props) {
  return (
    <section className="col col--media" aria-label="Multimedia">
      {/* El .hold es el que escucha el hover: la tarjeta de dentro va flotando y no
          puede recibirlo sin que el raton "persiga" al elemento. */}
      <div className="hold">
        <article className="card blurable" id="spotify">
          <h2>Spotify</h2>
          <Estado senal={spotify.senal}>
            {(cancion) => (
              <>
                <small>{cancion.escuchandoAhora ? 'Reproduciendo…' : 'Última canción…'}</small>
                <div className="media-card">
                  <div className="thumb" aria-hidden={cancion.imagen ? 'false' : 'true'} />
                  <div>
                    <strong>{cancion.titulo}</strong>
                    <br />
                    <small>{cancion.artista}</small>
                    <Barra avance={cancion.avance} />
                  </div>
                </div>
              </>
            )}
          </Estado>
        </article>
      </div>

      <div className="hold">
        <article className="card blurable" id="youtube">
          <h2>YouTube</h2>
          <Estado senal={YOUTUBE.senal}>
            {(video) => (
              <>
                <small>Ahora viendo…</small>
                <div className="media-card">
                  <div className="thumb" />
                  <div>
                    <strong>{video.titulo}</strong>
                    <br />
                    <small>{video.canal}</small>
                    <Barra avance={42} />
                  </div>
                </div>
              </>
            )}
          </Estado>
        </article>
      </div>
    </section>
  );
}