import Link from 'next/link';
import type { ReactNode } from 'react';
import { esListo, type Fuente } from '@/lib/fuente';
import type { Commit } from '@/lib/github';
import type { ColaTickets, TicketActual, TicketEnCola } from '@/lib/jira';
import Estado from './Estado';

const PRIORIDAD: Record<NonNullable<TicketEnCola['prioridad']>, string> = {
  critica: 'Crítica',
  alta: 'Alta',
  media: 'Media',
  baja: 'Baja',
};

/** El id del ticket lleva a Jira cuando la fuente trae enlace. */
function EnlaceTicket({ href, children }: { href?: string | null; children: ReactNode }) {
  if (!href) return <>{children}</>;
  return (
    <Link href={href} target="_blank" rel="noreferrer">
      {children}
    </Link>
  );
}

function ListaTickets({ tickets }: { tickets: TicketEnCola[] }) {
  return (
    <ul className="queue">
      {tickets.map((t) => (
        <li key={t.clave}>
          {t.enlace ? (
            <Link href={t.enlace} target="_blank" rel="noreferrer" className="queue-key">
              {t.clave}
            </Link>
          ) : (
            <span className="queue-key">{t.clave}</span>
          )}
          <span>{t.resumen}</span>
          <span className={`tag ${t.prioridad ?? 'media'}`}>
            {PRIORIDAD[t.prioridad ?? 'media']}
          </span>
        </li>
      ))}
    </ul>
  );
}

export default function InfoCards({
  commit,
  ticketActual,
  colaTickets,
  colaAlt = null,
}: {
  commit: Fuente<Commit>;
  ticketActual: Fuente<TicketActual>;
  colaTickets: Fuente<ColaTickets>;
  colaAlt?: Fuente<TicketEnCola[]> | null;
}) {
  // Se leen aquí para no meter un <p> de Estado dentro de un <h2> (HTML inválido)
  // y para no pintar "En progreso" cuando en realidad no hay ticket.
  const ticket = esListo(ticketActual.senal) ? ticketActual.senal.datos : null;
  const cola = esListo(colaTickets.senal) ? colaTickets.senal.datos : null;
  const ticketsAlt = colaAlt && esListo(colaAlt.senal) ? colaAlt.senal.datos : null;

  return (
    <div className="info">
      <article className="card">
        <h2>
          Jira {ticket?.estado ? <span className="badge">{ticket.estado}</span> : null}
        </h2>
        <Estado senal={ticketActual.senal}>
          {(t) => (
            <>
              <small>Ticket</small>
              <div className="ticket-id">
                <EnlaceTicket href={t.enlace}>{t.clave}</EnlaceTicket>
              </div>
              <p>{t.resumen}</p>
            </>
          )}
        </Estado>
      </article>

      <article className="card card--queue">
        <h2>
          En cola de tickets{' '}
          {cola ? (
            <span className="badge">
              {cola.total}
              {cola.hayMas ? '+' : ''}
            </span>
          ) : null}
        </h2>
        <Estado senal={colaTickets.senal}>
          {({ tickets, total, hayMas }) => (
            <>
              <ListaTickets tickets={tickets} />
              {total > tickets.length ? (
                <p className="card-note">
                  Mostrando {tickets.length} de {total}
                  {hayMas ? '+' : ''}
                </p>
              ) : null}
            </>
          )}
        </Estado>
      </article>

      {/* La segunda bandeja solo existe si `JIRA_JQL_ALT` está configurado:
          `colaTicketsAlt()` devuelve null cuando no lo está. */}
      {colaAlt ? (
        <article className="card card--queue">
          <h2>
            Segundo Jira {ticketsAlt ? <span className="badge">{ticketsAlt.length}</span> : null}
          </h2>
          <Estado senal={colaAlt.senal}>
            {(tickets) => <ListaTickets tickets={tickets} />}
          </Estado>
        </article>
      ) : null}

      <article className="card">
        <h2>GitHub</h2>
        <small>Último commit enviado</small>
        <Estado senal={commit.senal}>
          {(c) => (
            <>
              <p className="commit" title={c.mensaje}>
                {c.mensaje}
              </p>
              <div className="meta">
                {/* La rama es el enlace: lleva al commit concreto, no al repo. */}
                <span>
                  {c.repo} ·{' '}
                  <Link href={c.url} target="_blank" rel="noreferrer" className="commit-rama">
                    {c.rama}
                  </Link>
                </span>
                <span>
                  <code>{c.sha}</code> · {c.cuando}
                </span>
              </div>
            </>
          )}
        </Estado>
      </article>
    </div>
  );
}
