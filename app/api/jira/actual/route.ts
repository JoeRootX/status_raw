import { ticketActual } from '@/lib/jira';
import { esPanelPublico, noDisponible } from '@/lib/privacidad';

export const revalidate = 0;

export async function GET() {
  if (!esPanelPublico()) return noDisponible();
  const fuente = await ticketActual();
  return Response.json(fuente, {
    headers: { 'Cache-Control': 'no-store, max-age=0' },
  });
}
