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

const API_KEY = process.env.YOUTUBE_API_KEY;
const CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID;

export const VIDEO_DE_EJEMPLO: Video = {
  titulo: 'Título del video de ejemplo',
  canal: 'Nombre del canal',
  url: null,
  imagen: null,
  duracionSeg: null,
  progresoSeg: null,
  avance: 42,
  actualizadoEn: new Date().toISOString(),
  viendoAhora: true,
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
  if (!API_KEY || !CHANNEL_ID) return null;
  return { apiKey: API_KEY, channelId: CHANNEL_ID };
}

/**
 * La lista de "subidas" de un canal es una playlist interna cuyo id es el del
 * canal `UC...` con el prefijo cambiado a `UU...`. Si llega cualquier otro id
 * (por ejemplo ya `UU...`), se usa tal cual.
 */
function playlistDeSubidas(channelId: string): string {
  return channelId.startsWith('UC') ? `UU${channelId.slice(2)}` : channelId;
}

/** null = el canal todavía no publicó nada. Lanza si la API contesta mal. */
async function consultar(): Promise<Video | null> {
  const creds = credenciales();
  if (!creds) return null;

  const url = new URL('https://www.googleapis.com/youtube/v3/playlistItems');
  url.search = new URLSearchParams({
    part: 'snippet',
    playlistId: playlistDeSubidas(creds.channelId),
    maxResults: '1',
    key: creds.apiKey,
  }).toString();

  const respuesta = await fetch(url, { signal: AbortSignal.timeout(8_000) });
  if (!respuesta.ok) throw new Error(`playlistItems ${respuesta.status}`);

  const datos = (await respuesta.json()) as RespuestaPlaylist;
  const ultimo = datos.items?.[0]?.snippet;
  const videoId = ultimo?.resourceId?.videoId;
  if (!ultimo || !videoId) return null;

  return {
    titulo: ultimo.title ?? 'Video sin título',
    canal: ultimo.channelTitle ?? '',
    url: `https://www.youtube.com/watch?v=${videoId}`,
    imagen: ultimo.thumbnails?.high?.url ?? ultimo.thumbnails?.medium?.url ?? null,
    // La duración exigiría una segunda llamada (videos?part=contentDetails);
    // sin ella la barra de progreso no tiene de qué hablar, y la API pública
    // tampoco expone lo que alguien esté viendo ahora.
    duracionSeg: null,
    progresoSeg: null,
    avance: 0,
    actualizadoEn: ultimo.publishedAt ?? new Date().toISOString(),
    viendoAhora: false,
  };
}

export async function videoActual(): Promise<Fuente<Video>> {
  if (!credenciales()) {
    return { modo: 'manual', senal: listo(VIDEO_DE_EJEMPLO) };
  }

  try {
    const video = await consultar();
    if (!video) {
      return { modo: 'auto', senal: vacio('Este canal todavía no tiene videos publicados.') };
    }
    return { modo: 'auto', senal: listo(video) };
  } catch (error) {
    console.error('[youtube] fallo la consulta:', error);
    return { modo: 'auto', senal: fallo('No se pudo consultar YouTube ahora mismo.') };
  }
}
