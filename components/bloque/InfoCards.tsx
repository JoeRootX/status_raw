import Link from 'next/link';
import type { Fuente } from '@/lib/fuente';
import type { Commit } from '@/lib/github';
import { COLA_TICKETS, TICKET_ACTUAL } from '@/lib/datos';
import Estado from './Estado';

export default function InfoCards({ commit }: { commit: Fuente<Commit> }) {
  return (
    <div className="info">
      <article className="card">
        <h2>
          Jira <span className="badge">En progreso</span>
        </h2>
        <Estado senal={TICKET_ACTUAL.senal}>
          {(ticket) => (
            <>
              <small>Ticket</small>
              <div className="ticket-id">{ticket.clave}</div>
              <p>{ticket.resumen}</p>
            </>
          )}
        </Estado>
      </article>

      <article className="card card--queue">
        <h2>
          En cola de tickets{' '}
          <Estado senal={COLA_TICKETS.senal}>
            {(cola) => <span className="badge">{cola.length}</span>}
          </Estado>
        </h2>
        <Estado senal={COLA_TICKETS.senal}>
          {(cola) => (
            <ul className="queue">
              {cola.map((ticket) => (
                <li key={ticket.clave}>
                  <span>{ticket.clave}</span>
                  <span>{ticket.resumen}</span>
                  <span className={`tag ${ticket.prioridad}`}>{ticket.prioridad}</span>
                </li>
              ))}
            </ul>
          )}
        </Estado>
      </article>

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