import { COLA_TICKETS, TICKET_ACTUAL, ULTIMO_COMMIT } from '@/lib/datos';
import Estado from './Estado';

export default function InfoCards() {
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
        <Estado senal={ULTIMO_COMMIT.senal}>
          {(commit) => (
            <>
              <p className="commit">{commit.mensaje}</p>
              <div className="meta">
                <span>{commit.autor}</span>
                <span>{commit.cuando}</span>
              </div>
            </>
          )}
        </Estado>
      </article>
    </div>
  );
}