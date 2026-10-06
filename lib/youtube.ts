import { fallo, listo, type Fuente } from './fuente';

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

export async function videoActual(): Promise<Fuente<Video>> {
  if (!API_KEY || !CHANNEL_ID) {
    return { modo: 'manual', senal: listo(VIDEO_DE_EJEMPLO) };
  }

  try {
    // Implementación real con YouTube Data API (search/liveBroadcasts) cuando existan credenciales.
    // Mock-first para no romper build.
    return { modo: 'auto', senal: listo(VIDEO_DE_EJEMPLO) };
  } catch (error) {
    console.error('[youtube] fallo la consulta:', error);
    return { modo: 'auto', senal: fallo('No se pudo consultar YouTube ahora mismo.') };
  }
}
