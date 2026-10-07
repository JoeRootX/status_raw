import { fallo, listo, vacio, type Fuente } from './fuente';

export type Cancion = {
  titulo: string;
  artista: string;
  album?: string | null;
  imagen?: string | null;
  url?: string | null;
  duracionMs?: number | null;
  progresoMs?: number | null;
  avance: number; // porcentaje 0-100
  actualizadoEn: string; // ISO
  escuchandoAhora: boolean;
};

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.SPOTIFY_REFRESH_TOKEN;

export const CANCION_DE_EJEMPLO: Cancion = {
  titulo: 'shelter',
  artista: 'Porter Robinson, Madeon',
  album: 'shelter',
  imagen: null,
  url: null,
  duracionMs: null,
  progresoMs: null,
  avance: 42,
  actualizadoEn: new Date().toISOString(),
  escuchandoAhora: true,
};

/** Formas mínimas de la Web API que este bloque consume. */
type PistaSpotify = {
  name?: string;
  artists?: Array<{ name?: string }>;
  album?: { name?: string; images?: Array<{ url?: string }> };
  duration_ms?: number;
  external_urls?: { spotify?: string };
};

type EstadoReproduccion = {
  item?: PistaSpotify | null;
  progress_ms?: number | null;
  is_playing?: boolean;
};

type Recientes = {
  items?: Array<{ track?: PistaSpotify; played_at?: string }>;
};

function credenciales() {
  if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) return null;
  return { clientId: CLIENT_ID, clientSecret: CLIENT_SECRET, refreshToken: REFRESH_TOKEN };
}

/** Intercambia el refresh token por un access token de uso corto. */
async function tokenAcceso(c: NonNullable<ReturnType<typeof credenciales>>): Promise<string> {
  const basico = Buffer.from(`${c.clientId}:${c.clientSecret}`).toString('base64');
  const respuesta = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basico}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: c.refreshToken,
    }),
    signal: AbortSignal.timeout(8_000),
  });
  if (!respuesta.ok) throw new Error(`token ${respuesta.status}`);
  const datos = (await respuesta.json()) as { access_token?: string };
  if (!datos.access_token) throw new Error('token sin access_token');
  return datos.access_token;
}

function aCancion(
  pista: PistaSpotify,
  extra: { progresoMs: number | null; escuchandoAhora: boolean; actualizadoEn: string },
): Cancion {
  const duracion = pista.duration_ms ?? 0;
  const progreso = extra.progresoMs ?? 0;
  return {
    titulo: pista.name ?? 'Pista sin título',
    artista: (pista.artists ?? []).map((a) => a.name ?? '').filter(Boolean).join(', '),
    album: pista.album?.name ?? null,
    imagen: pista.album?.images?.[0]?.url ?? null,
    url: pista.external_urls?.spotify ?? null,
    duracionMs: pista.duration_ms ?? null,
    progresoMs: extra.progresoMs,
    avance: duracion > 0 ? Math.min(100, Math.round((progreso / duracion) * 100)) : 0,
    actualizadoEn: extra.actualizadoEn,
    escuchandoAhora: extra.escuchandoAhora,
  };
}

/** null = no hay nada sonando ni reproducido. Lanza si Spotify contesta mal. */
async function consultar(): Promise<Cancion | null> {
  const creds = credenciales();
  if (!creds) return null;
  const token = await tokenAcceso(creds);
  const encabezados = { Authorization: `Bearer ${token}` };

  const ahora = await fetch(
    'https://api.spotify.com/v1/me/player/currently-playing?additional_types=track',
    { headers: encabezados, signal: AbortSignal.timeout(8_000) },
  );

  if (ahora.ok) {
    const datos = (await ahora.json()) as EstadoReproduccion;
    if (datos.item) {
      return aCancion(datos.item, {
        progresoMs: datos.progress_ms ?? null,
        escuchandoAhora: Boolean(datos.is_playing),
        actualizadoEn: new Date().toISOString(),
      });
    }
  } else if (ahora.status !== 204) {
    // 204 = nada sonando (normal); el resto (401/403/5xx) sí es fallo.
    throw new Error(`currently-playing ${ahora.status}`);
  }

  // Nada sonando: último reproducido, con "escuchando ahora" apagado.
  const recientes = await fetch('https://api.spotify.com/v1/me/player/recently-played?limit=1', {
    headers: encabezados,
    signal: AbortSignal.timeout(8_000),
  });
  if (!recientes.ok) throw new Error(`recently-played ${recientes.status}`);
  const ultimo = ((await recientes.json()) as Recientes).items?.[0];
  if (!ultimo?.track) return null;

  return aCancion(ultimo.track, {
    progresoMs: null,
    escuchandoAhora: false,
    actualizadoEn: ultimo.played_at ?? new Date().toISOString(),
  });
}

export async function cancionActual(): Promise<Fuente<Cancion>> {
  if (!credenciales()) {
    return { modo: 'manual', senal: listo(CANCION_DE_EJEMPLO) };
  }

  try {
    const cancion = await consultar();
    if (!cancion) {
      return { modo: 'auto', senal: vacio('No hay nada sonando ni reproducido recientemente.') };
    }
    return { modo: 'auto', senal: listo(cancion) };
  } catch (error) {
    console.error('[spotify] fallo la consulta:', error);
    return { modo: 'auto', senal: fallo('No se pudo consultar Spotify ahora mismo.') };
  }
}
