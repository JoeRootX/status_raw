import { colaTicketsAlt } from '@/lib/jira';

export const revalidate = 0;

export async function GET() {
  const fuente = await colaTicketsAlt();
  return Response.json(fuente, {
    headers: { 'Cache-Control': 'no-store, max-age=0' },
  });
}
