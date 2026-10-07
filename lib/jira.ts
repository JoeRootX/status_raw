import { fallo, listo, vacio, type Fuente } from './fuente';

export type TicketActual = {
  clave: string;
  resumen: string;
  estado?: string | null;
  enlace?: string | null;
};

export type TicketEnCola = {
  clave: string;
  resumen: string;
  prioridad: 'alta' | 'media' | 'baja' | 'critica' | null;
  enlace?: string | null;
};

export const TICKET_ACTUAL_EJEMPLO: TicketActual = {
  clave: 'SDT-1738',
  resumen: 'Crear Endpoints para los nuevos tipos de solicitudes',
  estado: 'In Progress',
  enlace: null,
};

export const COLA_TICKETS_EJEMPLO: TicketEnCola[] = [
  { clave: 'SDT-1742', resumen: 'Ajustes en validaciones', prioridad: 'media', enlace: null },
  { clave: 'SDT-1741', resumen: 'Corrección en módulo', prioridad: 'media', enlace: null },
  { clave: 'SDT-1739', resumen: 'Notificaciones en tiempo real', prioridad: 'baja', enlace: null },
];

const JIRA_BASE_URL = process.env.JIRA_BASE_URL;
const JIRA_EMAIL = process.env.JIRA_EMAIL;
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;

/**
 * JQL por defecto: lo que yo tengo en curso / en espera. Se pueden sobreescribir
 * con JIRA_JQL_ACTUAL y JIRA_JQL_COLA por si el flujo de trabajo usa otros
 * nombres de categoría o proyecto.
 */
const JQL_ACTUAL =
  process.env.JIRA_JQL_ACTUAL ??
  'assignee = currentUser() AND statusCategory = "In Progress" ORDER BY updated DESC';
const JQL_COLA =
  process.env.JIRA_JQL_COLA ??
  'assignee = currentUser() AND statusCategory = "To Do" ORDER BY priority DESC, created ASC';

function credenciales() {
  if (!JIRA_BASE_URL || !JIRA_EMAIL || !JIRA_API_TOKEN) return null;
  return {
    base: JIRA_BASE_URL.replace(/\/$/, ''),
    email: JIRA_EMAIL,
    token: JIRA_API_TOKEN,
  };
}

type Issue = {
  key?: string;
  fields?: {
    summary?: string;
    status?: { name?: string } | null;
    priority?: { name?: string } | null;
  };
};

type Busqueda = { issues?: Issue[] };

/** Prioridades de Jira (clásicas y de esquema nuevo) a las clases de la tarjeta. */
function prioridadDe(nombre?: string | null): TicketEnCola['prioridad'] {
  const n = (nombre ?? '').toLowerCase();
  if (n === 'blocker' || n === 'critical' || n === 'highest') return 'critica';
  if (n === 'major' || n === 'high') return 'alta';
  if (n === 'medium' || n === 'normal') return 'media';
  if (n === 'minor' || n === 'low' || n === 'lowest' || n === 'trivial') return 'baja';
  return null;
}

/**
 * `POST /rest/api/3/search/jql`: el endpoint nuevo; el viejo `/search` ya
 * devuelve 410 Gone en Cloud. Pide `fields` explícitos y pagina por
 * `nextPageToken` (aquí no hace falta: nunca pedimos más de 5).
 */
async function buscar(jql: string, maxResults: number): Promise<Issue[]> {
  const creds = credenciales();
  if (!creds) return [];

  const url = new URL(`${creds.base}/rest/api/3/search/jql`);
  url.search = new URLSearchParams({
    jql,
    fields: 'summary,status,priority',
    maxResults: String(maxResults),
  }).toString();

  const respuesta = await fetch(url, {
    headers: {
      Authorization: `Basic ${Buffer.from(`${creds.email}:${creds.token}`).toString('base64')}`,
      Accept: 'application/json',
    },
    signal: AbortSignal.timeout(8_000),
  });
  if (!respuesta.ok) throw new Error(`search/jql ${respuesta.status}`);

  const datos = (await respuesta.json()) as Busqueda;
  return datos.issues ?? [];
}

const enlaceDe = (base: string, clave: string) => `${base}/browse/${clave}`;

export async function ticketActual(): Promise<Fuente<TicketActual>> {
  const creds = credenciales();
  if (!creds) {
    return { modo: 'manual', senal: listo(TICKET_ACTUAL_EJEMPLO) };
  }
  try {
    const issues = await buscar(JQL_ACTUAL, 1);
    const issue = issues[0];
    if (!issue?.key) {
      return { modo: 'auto', senal: vacio('No hay ningún ticket en curso.') };
    }
    return {
      modo: 'auto',
      senal: listo({
        clave: issue.key,
        resumen: issue.fields?.summary ?? issue.key,
        estado: issue.fields?.status?.name ?? null,
        enlace: enlaceDe(creds.base, issue.key),
      }),
    };
  } catch (error) {
    console.error('[jira] fallo ticketActual:', error);
    return { modo: 'auto', senal: fallo('No se pudo consultar Jira ahora mismo.') };
  }
}

export async function colaTickets(): Promise<Fuente<TicketEnCola[]>> {
  const creds = credenciales();
  if (!creds) {
    return { modo: 'manual', senal: listo(COLA_TICKETS_EJEMPLO) };
  }
  try {
    const issues = await buscar(JQL_COLA, 5);
    if (issues.length === 0) {
      return { modo: 'auto', senal: vacio('La cola de tickets está vacía.') };
    }
    return {
      modo: 'auto',
      senal: listo(
        issues
          .filter((issue): issue is Issue & { key: string } => Boolean(issue.key))
          .map((issue) => ({
            clave: issue.key,
            resumen: issue.fields?.summary ?? issue.key,
            prioridad: prioridadDe(issue.fields?.priority?.name),
            enlace: enlaceDe(creds.base, issue.key),
          })),
      ),
    };
  } catch (error) {
    console.error('[jira] fallo colaTickets:', error);
    return { modo: 'auto', senal: fallo('No se pudo consultar Jira ahora mismo.') };
  }
}
