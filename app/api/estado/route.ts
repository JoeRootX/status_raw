import { estadoVivo } from '@/lib/estado';

export const revalidate = 0;

/** GET barato para el poller del cliente: solo el EstadoId actual. */
export async function GET() {
  const estado = await estadoVivo();
  return Response.json(
    { estado },
    { headers: { 'Cache-Control': 'no-store, max-age=0' } },
  );
}
