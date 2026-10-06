import { cancionActual } from '@/lib/spotify';
export const revalidate = 0;

export async function GET() {
  const fuente = await cancionActual();
  return Response.json(fuente, {
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}
