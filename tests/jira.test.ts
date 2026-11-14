import assert from 'node:assert/strict';
import test from 'node:test';
import { esListo } from '../lib/fuente';

// Credenciales antes de importar: lib/jira.ts las lee al cargarse.
process.env.JIRA_BASE_URL = 'https://jira.example.com';
process.env.JIRA_EMAIL = 'joe@example.com';
process.env.JIRA_API_TOKEN = 'token-de-prueba';

type Cuerpo = { issues?: unknown[]; nextPageToken?: string; isLast?: boolean };
type Llamada = { token: string | null; maxResults: string | null };

/** Sustituye `fetch` por una cola de páginas y registra cómo se pidieron. */
function simularJira(pagina: (token: string | null) => { cuerpo: Cuerpo; status?: number }) {
  const original = globalThis.fetch;
  const llamadas: Llamada[] = [];

  globalThis.fetch = (async (entrada: RequestInfo | URL) => {
    const url = entrada instanceof URL ? entrada : new URL(String(entrada));
    const token = url.searchParams.get('nextPageToken');
    llamadas.push({ token, maxResults: url.searchParams.get('maxResults') });

    const { cuerpo, status = 200 } = pagina(token);
    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => cuerpo,
    } as Response;
  }) as typeof fetch;

  return { llamadas, restaurar: () => (globalThis.fetch = original) };
}

const ticket = (n: number) => ({
  key: `SDT-${n}`,
  fields: { summary: `Ticket ${n}`, priority: { name: 'Medium' } },
});

const lote = (desde: number, cuantos: number) =>
  Array.from({ length: cuantos }, (_, i) => ticket(desde + i));

test('sigue nextPageToken y cuenta todos los To Do', async () => {
  const { colaTickets } = await import('../lib/jira');
  const jira = simularJira((token) => {
    if (token === null) return { cuerpo: { issues: lote(1, 5), nextPageToken: 'p2', isLast: false } };
    if (token === 'p2') return { cuerpo: { issues: lote(6, 5), nextPageToken: 'p3', isLast: false } };
    return { cuerpo: { issues: lote(11, 3), isLast: true } };
  });

  try {
    const { senal } = await colaTickets();
    if (!esListo(senal)) assert.fail(`se esperaba listo, vino ${senal.estado}`);

    assert.equal(senal.datos.total, 13);
    assert.equal(senal.datos.tickets.length, 5, 'la tarjeta no pinta más de cinco');
    assert.equal(senal.datos.hayMas, false);
    assert.deepEqual(
      jira.llamadas.map((l) => l.token),
      [null, 'p2', 'p3'],
    );
    assert.equal(jira.llamadas[0]?.maxResults, '5');
  } finally {
    jira.restaurar();
  }
});

test('un nextPageToken repetido no duplica tickets', async () => {
  const { colaTickets } = await import('../lib/jira');
  const jira = simularJira((token) => {
    if (token === null) return { cuerpo: { issues: lote(1, 5), nextPageToken: 'p2' } };
    if (token === 'p2') return { cuerpo: { issues: lote(6, 5), nextPageToken: 'p3' } };
    // Jira repite la página anterior y su token: los SDT-6..10 ya se leyeron.
    return { cuerpo: { issues: lote(6, 5), nextPageToken: 'p3' } };
  });

  try {
    const { senal } = await colaTickets();
    if (!esListo(senal)) assert.fail(`se esperaba listo, vino ${senal.estado}`);

    assert.equal(senal.datos.total, 10, 'no cuenta dos veces los tickets repetidos');
    assert.equal(senal.datos.tickets.length, 5);
    assert.equal(jira.llamadas.length, 3);
  } finally {
    jira.restaurar();
  }
});

test('una sola página con isLast no pide más', async () => {
  const { colaTickets } = await import('../lib/jira');
  const jira = simularJira(() => ({ cuerpo: { issues: lote(1, 3), isLast: true } }));

  try {
    const { senal } = await colaTickets();
    if (!esListo(senal)) assert.fail(`se esperaba listo, vino ${senal.estado}`);

    assert.equal(senal.datos.total, 3);
    assert.equal(senal.datos.tickets.length, 3);
    assert.equal(jira.llamadas.length, 1);
  } finally {
    jira.restaurar();
  }
});

test('una página vacía con token corta el bucle', async () => {
  const { colaTickets } = await import('../lib/jira');
  const jira = simularJira((token) =>
    token === null
      ? { cuerpo: { issues: lote(1, 3), nextPageToken: 'p2' } }
      : { cuerpo: { issues: [], nextPageToken: 'p3' } },
  );

  try {
    const { senal } = await colaTickets();
    if (!esListo(senal)) assert.fail(`se esperaba listo, vino ${senal.estado}`);

    assert.equal(senal.datos.total, 3);
    assert.equal(jira.llamadas.length, 2);
  } finally {
    jira.restaurar();
  }
});

test('el tope de páginas evita un nextPageToken infinito', async () => {
  const { colaTickets, COLA_MAX_PAGINAS } = await import('../lib/jira');
  let n = 0;
  const jira = simularJira(() => {
    n += 5;
    return { cuerpo: { issues: lote(n - 4, 5), nextPageToken: `p${n}` } };
  });

  try {
    const { senal } = await colaTickets();
    if (!esListo(senal)) assert.fail(`se esperaba listo, vino ${senal.estado}`);

    assert.equal(jira.llamadas.length, COLA_MAX_PAGINAS);
    assert.equal(senal.datos.total, COLA_MAX_PAGINAS * 5);
    assert.equal(senal.datos.hayMas, true, 'el total es un mínimo');
  } finally {
    jira.restaurar();
  }
});

test('si falla una página siguiente conserva lo leído', async () => {
  const { colaTickets } = await import('../lib/jira');
  const jira = simularJira((token) =>
    token === null
      ? { cuerpo: { issues: lote(1, 5), nextPageToken: 'p2' } }
      : { cuerpo: {}, status: 502 },
  );

  try {
    const { senal } = await colaTickets();
    if (!esListo(senal)) assert.fail(`se esperaba listo, vino ${senal.estado}`);

    assert.equal(senal.datos.total, 5);
    assert.equal(senal.datos.hayMas, true);
  } finally {
    jira.restaurar();
  }
});

test('Jira vacío no rompe: la señal es vacío', async () => {
  const { colaTickets } = await import('../lib/jira');
  const jira = simularJira(() => ({ cuerpo: { issues: [] } }));

  try {
    const { senal } = await colaTickets();
    assert.equal(senal.estado, 'vacio');
  } finally {
    jira.restaurar();
  }
});

test('Jira caído no rompe: la señal es error', async () => {
  const { colaTickets } = await import('../lib/jira');
  const jira = simularJira(() => ({ cuerpo: {}, status: 500 }));

  try {
    const { senal } = await colaTickets();
    assert.equal(senal.estado, 'error');
  } finally {
    jira.restaurar();
  }
});

test('sin JQL alternativo la segunda bandeja queda apagada', async () => {
  const { jqlAlternativo } = await import('../lib/jira');
  assert.equal(jqlAlternativo(undefined), null);
  assert.equal(jqlAlternativo(''), null);
  assert.equal(jqlAlternativo('   '), null);
});

test('el JQL alternativo configurado se usa tal cual, sin espacios de sobra', async () => {
  const { jqlAlternativo } = await import('../lib/jira');
  const jql = 'assignee = currentUser() AND project = OTRO ORDER BY updated DESC';
  assert.equal(jqlAlternativo(jql), jql);
  assert.equal(jqlAlternativo(`  ${jql}  `), jql);
});
