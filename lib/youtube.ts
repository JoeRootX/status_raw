import { fallo, listo, vacio, type Fuente } from './fuente';

export type Video = {
  titulo: string;
  canal: string;
  url?: string | null;
  imagen?: string | null;
  duracionSeg?: number | null;
  progresoSeg?: number | null;
  avance: number; // porcentaje 0-100
  actualizadoEn: string; // ISO
  viendoAhora: boolean;
};

export const VIDEO_DE_EJEMPLO: Video = {
  titulo: 'Título del video de ejemplo',
  canal: 'Nombre del canal',
  url: null,
  imagen: null,
  duracionSeg: null,
  progresoSeg: null,
  avance: 0,
  actualizadoEn: new Date().toISOString(),
  viendoAhora: false,
};

type ItemPlaylist = {
  snippet?: {
    title?: string;
    channelTitle?: string;
    publishedAt?: string;
    resourceId?: { videoId?: string };
    thumbnails?: { high?: { url?: string }; medium?: { url?: string } };
  };
};

type RespuestaPlaylist = { items?: ItemPlaylist[] };

function credenciales() {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const channelId = process.env.YOUTUBE_CHANNEL_ID;
  const playlistId = process.env.YOUTUBE_PLAYLIST_ID;
  if (!playlistId && !channelId) return null;
  return { apiKey, channelId: channelId ?? '', playlistId };
}

// ---------- RSS ----------
//
// playlistItems (Data API) NO respeta fecha: devuelve el primer item de la
// playlist de subidas en su orden manual (un video viejo fijado arriba queda
// "último" para siempre). El feed RSS de canal/playlist sí llega ordenado por
// publicación y además no gasta cuota ni pide API key. Empieza por RSS y cae
// a la Data API (pidiendo varios y ordenando por fecha, como hicimos con
// GitHub) solo si el RSS falla.

function decodificar(texto: string): string {
  return texto
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

type Entrada = { videoId: string; titulo: string; canal: string; publicado: string };

/** Primer `<entry>` del feed RSS de canal o playlist (el más nuevo publicado). */
function primeraEntrada(xml: string): Entrada | null {
  const bloque = ((xml.split('<entry>')[1] ?? '').split('</entry>')[0]) ?? '';
  const videoId = /<yt:videoId>([^<]+)<\/yt:videoId>/.exec(bloque)?.[1];
  const titulo = decodificar(/<title>([^<]+)<\/title>/.exec(bloque)?.[1] ?? '');
  const publicado = /<published>([^<]+)<\/published>/.exec(bloque)?.[1] ?? '';
  const canal = decodificar(/<author>[\s\S]*?<name>([^<]+)<\/name>/.exec(bloque)?.[1] ?? '');
  if (!videoId || !titulo) return null;
  return { videoId, titulo, canal, publicado };
}

function aVideo(entrada: Entrada): Video {
  return {
    titulo: entrada.titulo,
    canal: entrada.canal,
    url: `https://www.youtube.com/watch?v=${entrada.videoId}`,
    // La miniatura canónica del video va directa; el feed la trae pero en
    // versión default (baja) como primer media:thumbnail.
    imagen: `https://i.ytimg.com/vi/${entrada.videoId}/hqdefault.jpg`,
    // La duración exigiría una segunda llamada (videos?part=contentDetails);
    // sin ella la barra de progreso no tiene de qué hablar, y la API pública
    // tampoco expone lo que alguien esté viendo ahora.
    duracionSeg: null,
    progresoSeg: null,
    avance: 0,
    actualizadoEn: entrada.publicado || new Date().toISOString(),
    viendoAhora: false,
  };
}

/**
 * El feed https://www.youtube.com/feeds/videos.xml?playlist_id=… comparte
 * videos que marque como "lo que comparto/viengo" si PLAYLIST_ID apunta a una
 * playlist pública adminstrada por mí; sin ella cae al feed del canal (sus
 * subidas, ya en orden real).
 */
async function porRSS(feedUrl: string): Promise<Video | null> {
  const respuesta = await fetch(feedUrl, {
    headers: { Accept: 'application/atom+xml, application/xml, text/xml' },
    signal: AbortSignal.timeout(8_000),
  });
  if (!respuesta.ok) throw new Error(`RSS ${respuesta.status}`);
  const entrada = primeraEntrada(await respuesta.text());
  return entrada ? aVideo(entrada) : null;
}

// ---------- Data API (respaldo) ----------

/**
 * Data API playlistItems: no admite orderBy, así que pido varios y ordeno por
 * fecha de alta en la playlist (snippet.publishedAt = cuando se agregó, no
 * cuándo se publicó el video) — para una playlist "lo que comparto" el último
 * agregado es el que interesa, aunque el video sea viejo. Sirve tanto para la
 * playlist de subidas de un canal (UC…→UU…) como para cualquier playlist
 * pública dada por id.
 */
async function porDataAPI(playlistId: string, apiKey: string): Promise<Video | null> {
  const url = new URL('https://www.googleapis.com/youtube/v3/playlistItems');
  url.search = new URLSearchParams({
    part: 'snippet',
    playlistId: playlistId.startsWith('UC') ? `UU${playlistId.slice(2)}` : playlistId,
    maxResults: '10',
    key: apiKey,
  }).toString();

  const respuesta = await fetch(url, { signal: AbortSignal.timeout(8_000) });
  if (!respuesta.ok) throw new Error(`playlistItems ${respuesta.status}`);
  const datos = (await respuesta.json()) as RespuestaPlaylist;

  const mejor = (datos.items ?? [])
    .map((item) => item.snippet)
    .filter((s): s is NonNullable<typeof s> => Boolean(s?.resourceId?.videoId))
    .sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''))[0];
  if (!mejor) return null;

  return aVideo({
    videoId: mejor.resourceId!.videoId!,
    titulo: mejor.title ?? 'Video sin título',
    canal: mejor.channelTitle ?? '',
    publicado: mejor.publishedAt ?? '',
  });
}

async function consultar(): Promise<Video | null> {
  const creds = credenciales();
  if (!creds) return null;

  // 1) Playlist personal (lo que comparto), si la configuré. Algunas playlists
  //    no tienen feed RSS (404) y a otras puede caérselos: el dato puro en
  //    cualquier caso aguanta por el respaldo con la API key.
  if (creds.playlistId) {
    const playlistRSS = await porRSS(`https://www.youtube.com/feeds/videos.xml?playlist_id=${creds.playlistId}`).catch(() => null);
    if (playlistRSS) return playlistRSS;
    if (creds.apiKey) {
      const playlistAPI = await porDataAPI(creds.playlistId, creds.apiKey).catch(() => null);
      if (playlistAPI) return playlistAPI;
    }
  }

  // 2) RSS del canal: subidas en orden real, sin cuota.
  if (creds.channelId) {
    const video = await porRSS(`https://www.youtube.com/feeds/videos.xml?channel_id=${creds.channelId}`);
    if (video) return video;
  }

  // 3) Último recurso con key: subidas del canal ordenadas por publicación.
  if (creds.apiKey && creds.channelId) {
    return porDataAPI(creds.channelId, creds.apiKey);
  }

  return null;
}

export async function videoActual(): Promise<Fuente<Video>> {
  if (!credenciales()) {
    return { modo: 'manual', senal: listo(VIDEO_DE_EJEMPLO) };
  }

  try {
    const video = await consultar();
    if (!video) {
      return { modo: 'auto', senal: vacio('Todavía no hay videos publicados.') };
    }
    return { modo: 'auto', senal: listo(video) };
  } catch (error) {
    console.error('[youtube] fallo la consulta:', error);
    return { modo: 'auto', senal: fallo('No se pudo consultar YouTube ahora mismo.') };
  }
}
