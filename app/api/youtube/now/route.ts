import { videoActual } from '@/lib/youtube';

export const revalidate = 0;

export async function GET() {
  const fuente = await videoActual();
  return Response.json(fuente, {
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}
