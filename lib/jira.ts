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

function tieneCreds() {
  return Boolean(JIRA_BASE_URL && JIRA_EMAIL && JIRA_API_TOKEN);
}

export async function ticketActual(): Promise<Fuente<TicketActual>> {
  if (!tieneCreds()) {
    return { modo: 'manual', senal: listo(TICKET_ACTUAL_EJEMPLO) };
  }
  try {
    // Mock-first: placeholder para implementación real JQL/REST
    return { modo: 'auto', senal: listo(TICKET_ACTUAL_EJEMPLO) };
  } catch (error) {
    console.error('[jira] fallo ticketActual:', error);
    return { modo: 'auto', senal: fallo('No se pudo consultar Jira ahora mismo.') };
  }
}

export async function colaTickets(): Promise<Fuente<TicketEnCola[]>> {
  if (!tieneCreds()) {
    return { modo: 'manual', senal: listo(COLA_TICKETS_EJEMPLO) };
  }
  try {
    return { modo: 'auto', senal: listo(COLA_TICKETS_EJEMPLO) };
  } catch (error) {
    console.error('[jira] fallo colaTickets:', error);
    return { modo: 'auto', senal: fallo('No se pudo consultar Jira ahora mismo.') };
  }
}
