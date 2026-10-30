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

/** Lo que pinta la tarjeta de la cola: las visibles y cuántas hay en total. */
export type ColaTickets = {
  /** Solo las que caben en la tarjeta; el resto se cuenta pero no se pinta. */
  tickets: TicketEnCola[];
  /** Tickets To Do contados siguiendo `nextPageToken`. */
  total: number;
  /** `true` si el total es un mínimo: se llegó al tope o falló una página. */
  hayMas: boolean;
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

/** Los tickets que caben en la tarjeta; el resto solo se cuenta. */
export const COLA_PAGINA = 5;
/** Tope de páginas: 10 × 5 = 50. Corta un `nextPageToken` que no termine nunca. */
export const COLA_MAX_PAGINAS = 10;

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

type Pagina = {
  issues?: Issue[];
  nextPageToken?: string | null;
  isLast?: boolean;
};

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
 * `GET /rest/api/3/search/jql`: el endpoint nuevo; el viejo `/search` ya
 * devuelve 410 Gone en Cloud. Se usa GET con query params (POST también vale),
 * con `fields` explícitos y `nextPageToken` para pedir la página siguiente.
 */
async function buscarPagina(jql: string, maxResults: number, token?: string): Promise<Pagina> {
  const creds = credenciales();
  if (!creds) return {};

  const params = new URLSearchParams({
    jql,
    fields: 'summary,status,priority',
    maxResults: String(maxResults),
  });
  if (token) params.set('nextPageToken', token);

  const url = new URL(`${creds.base}/rest/api/3/search/jql`);
  url.search = params.toString();

  const respuesta = await fetch(url, {
    headers: {
      Authorization: `Basic ${Buffer.from(`${creds.email}:${creds.token}`).toString('base64')}`,
      Accept: 'application/json',
    },
    signal: AbortSignal.timeout(8_000),
  });
  if (!respuesta.ok) throw new Error(`search/jql ${respuesta.status}`);

  return (await respuesta.json()) as Pagina;
}

/**
 * Recorre la cola siguiendo `nextPageToken` para saber cuántos To Do hay de
 * verdad. La primera página manda: si falla, es un fallo de la fuente. Si falla
 * una siguiente, se queda con lo ya leído y lo marca con `hayMas` en vez de
 * tirar la tarjeta entera.
 */
async function buscarTodas(
  jql: string,
  maxResults: number,
): Promise<{ issues: Issue[]; hayMas: boolean }> {
  const issues: Issue[] = [];
  const vistos = new Set<string>();
  let token: string | undefined;

  for (let pagina = 1; pagina <= COLA_MAX_PAGINAS; pagina++) {
    let datos: Pagina;
    try {
      datos = await buscarPagina(jql, maxResults, token);
    } catch (error) {
      if (pagina === 1) throw error;
      console.error('[jira] paginación interrumpida:', error);
      return { issues, hayMas: true };
    }

    const lote = datos.issues ?? [];
    issues.push(...lote);
    token = datos.nextPageToken ?? undefined;

    // Sin token, con `isLast` o con una página vacía no hay a dónde seguir:
    // insistir con el mismo token solo repetiría tickets.
    if (!token || datos.isLast || lote.length === 0 || vistos.has(token)) {
      return { issues, hayMas: false };
    }
    vistos.add(token);
  }

  return { issues, hayMas: true };
}

const enlaceDe = (base: string, clave: string) => `${base}/browse/${clave}`;

export async function ticketActual(): Promise<Fuente<TicketActual>> {
  const creds = credenciales();
  if (!creds) {
    return { modo: 'manual', senal: listo(TICKET_ACTUAL_EJEMPLO) };
  }
  try {
    const pagina = await buscarPagina(JQL_ACTUAL, 1);
    const issue = pagina.issues?.[0];
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

export async function colaTickets(): Promise<Fuente<ColaTickets>> {
  const creds = credenciales();
  if (!creds) {
    return {
      modo: 'manual',
      senal: listo({
        tickets: COLA_TICKETS_EJEMPLO.slice(0, COLA_PAGINA),
        total: COLA_TICKETS_EJEMPLO.length,
        hayMas: false,
      }),
    };
  }
  try {
    const { issues, hayMas } = await buscarTodas(JQL_COLA, COLA_PAGINA);
    const tickets = issues
      .filter((issue): issue is Issue & { key: string } => Boolean(issue.key))
      .map((issue) => ({
        clave: issue.key,
        resumen: issue.fields?.summary ?? issue.key,
        prioridad: prioridadDe(issue.fields?.priority?.name),
        enlace: enlaceDe(creds.base, issue.key),
      }));
    if (tickets.length === 0) {
      return { modo: 'auto', senal: vacio('La cola de tickets está vacía.') };
    }
    return {
      modo: 'auto',
      senal: listo({
        tickets: tickets.slice(0, COLA_PAGINA),
        total: tickets.length,
        hayMas,
      }),
    };
  } catch (error) {
    console.error('[jira] fallo colaTickets:', error);
    return { modo: 'auto', senal: fallo('No se pudo consultar Jira ahora mismo.') };
  }
}
