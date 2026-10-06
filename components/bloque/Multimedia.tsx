import type { Cancion } from '@/lib/spotify';
import type { Video } from '@/lib/youtube';
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
  youtube: Fuente<Video>;
};

export default function Multimedia({ spotify, youtube }: Props) {
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
          <Estado senal={youtube.senal}>
            {(video) => (
              <>
                <small>{video.viendoAhora ? 'Reproduciendo…' : 'Último video…'}</small>
                <div className="media-card">
                  <div className="thumb" aria-hidden={video.imagen ? 'false' : 'true'} />
                  <div>
                    <strong>{video.titulo}</strong>
                    <br />
                    <small>{video.canal}</small>
                    <Barra avance={video.avance ?? 42} />
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