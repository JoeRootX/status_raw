import { fallo, listo, type Fuente } from './fuente';

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

export async function cancionActual(): Promise<Fuente<Cancion>> {
  if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
    return { modo: 'manual', senal: listo(CANCION_DE_EJEMPLO) };
  }

  try {
    // Implementación completa con Spotify API se hará cuando existan tokens.
    // Por ahora, mantenemos mock para que build y desarrollo funcionen.
    return { modo: 'auto', senal: listo(CANCION_DE_EJEMPLO) };
  } catch (error) {
    console.error('[spotify] fallo la consulta:', error);
    return { modo: 'auto', senal: fallo('No se pudo consultar Spotify ahora mismo.') };
  }
}
