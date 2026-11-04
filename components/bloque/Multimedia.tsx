import Image from 'next/image';
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

/**
 * El thumb por defecto es el degradado del CSS. Cuando la fuente trae portada
 * (álbum de Spotify, miniatura de YouTube) la pinta encima con next/image:
 * el optimizador sirve el tamaño exacto (64 px) y difiere la carga.
 */
function Thumb({ imagen, alt }: { imagen?: string | null; alt: string }) {
  if (!imagen) return <div className="thumb" aria-hidden="true" />;

  return (
    <Image
      className="thumb"
      src={imagen}
      alt={alt}
      width={64}
      height={64}
      sizes="64px"
    />
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
                  <Thumb imagen={cancion.imagen} alt={`Portada de ${cancion.titulo}`} />
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
                <small>{video.viendoAhora ? 'Reproduciendo…' : 'Último video visto…'}</small>
                <div className="media-card">
                  <Thumb imagen={video.imagen ?? null} alt={`Miniatura de ${video.titulo}`} />
                  <div>
                    <strong>{video.titulo}</strong>
                    <br />
                    <small>{video.canal}</small>
                    <Barra avance={video.avance} />
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