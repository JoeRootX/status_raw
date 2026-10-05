import { SPOTIFY, YOUTUBE } from '@/lib/datos';
import Estado from './Estado';

function Barra({ avance }: { avance: number }) {
  return (
    <div className="bar">
      <span style={{ width: `${avance}%` }} />
    </div>
  );
}

export default function Multimedia() {
  return (
    <section className="col col--media" aria-label="Multimedia">
      {/* El .hold es el que escucha el hover: la tarjeta de dentro va flotando y no
          puede recibirlo sin que el raton "persiga" al elemento. */}
      <div className="hold">
        <article className="card blurable" id="spotify">
          <h2>Spotify</h2>
          <Estado senal={SPOTIFY.senal}>
            {(repro) => (
              <>
                <small>Reproduciendo…</small>
                <div className="media-card">
                  <div className="thumb" />
                  <div>
                    <strong>{repro.titulo}</strong>
                    <br />
                    <small>{repro.artista}</small>
                    <Barra avance={repro.avance} />
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