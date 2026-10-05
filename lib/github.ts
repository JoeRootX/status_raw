import { fallo, listo, vacio, type Fuente } from './fuente';
import { haceCuando } from './tiempo';

/**
 * Ultimo commit de cualquiera de los repos de Joe.
 *
 * La peticion son 21 pasos, pero en una sola llamada: GraphQL admite alias, asi que
 * una query con 20 alias trae el commit mas reciente de cada repo de una vez.
 */

export type Commit = {
  mensaje: string;
  sha: string;
  repo: string;
  rama: string;
  ticket: string | null;
  autor: string;
  cuando: string;
  url: string;
};

/** Tu rama de trabajo se llama como el ticket: SDT-1738, SDT-1742... */
const REPO_TICKET = /^[A-Z]+-\d+$/;

const API = 'https://api.github.com';
const DUENIO = process.env.GITHUB_DUENIO ?? 'JoeRootX';

/** El panel se contaria a si mismo si status_raw entrara en la lista. */
const EXCLUIDOS = new Set(
  (process.env.GITHUB_EXCLUIR ?? 'status_raw')
    .split(',')
    .map((n) => n.trim())
    .filter(Boolean),
);

/** Cuantas ramas traer por repo. siiges tiene 26, asi que 40 deja margen. */
const RAMAS_POR_REPO = 40;

function cabeceras(token: string): Record<string, string> {
  return {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

async function pedir<T>(url: string, token: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, headers: { ...cabeceras(token), ...init?.headers } });
  if (!res.ok) throw new Error(`GitHub respondio ${res.status} a ${url}`);
  return (await res.json()) as T;
}

type Repo = { name: string };

/** Todos los repos del dueño, menos los excluidos. */
async function listarRepos(token: string): Promise<string[]> {
  const repos = await pedir<Repo[]>(`${API}/users/${DUENIO}/repos?per_page=100&type=owner`, token);
  return repos.map((r) => r.name).filter((n) => !EXCLUIDOS.has(n));
}

type NodoRef = {
  name: string;
  target: {
    oid: string;
    committedDate: string;
    messageHeadline: string;
    url: string;
    author: { name: string | null; user: { login: string } | null } | null;
  } | null;
};

/**
 * Una query con un alias por repo. Cada repositorio pide sus ramas mas recientes.
 *
 * No se usa `orderBy` en las refs aunque GraphQL lo ofrezca: se probo y no ordena
 * (con `last` devolvia las ramas mas antiguas y con `first` mezclaba las fechas sin
 * orden ninguno). El orden lo pone `masReciente` de este archivo, no la API.
 */
function query(repos: string[]): string {
  // El alias va por indice, no por nombre: dos repos que solo difieran en un
  // caracter no valido (a-b frente a a_b) colapsarian en el mismo alias y una
  // consulta invalida silenciosamente uno de los dos.
  const campos = repos
    .map(
      (nombre, i) => `
      r${i}: repository(owner: "${DUENIO}", name: "${nombre}") {
        nameWithOwner
        refs(first: ${RAMAS_POR_REPO}, refPrefix: "refs/heads/") {
          nodes {
            name
            target { ... on Commit { oid committedDate messageHeadline url author { name user { login } } } }
          }
        }
      }`,
    )
    .join('\n');
  return `query { ${campos} }`;
}

type Respuesta = { data?: Record<string, { nameWithOwner: string; refs: { nodes: NodoRef[] } } | null>; errors?: unknown[] };

type Crudo = {
  sha: string;
  fecha: string;
  mensaje: string;
  url: string;
  autor: string;
  repo: string;
  rama: string;
};

async function commitsDeTodos(token: string, repos: string[]): Promise<Crudo[]> {
  const cuerpo = await pedir<Respuesta>(`${API}/graphql`, token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: query(repos) }),
  });

  if (cuerpo.errors?.length) throw new Error('GraphQL devolvio errores');
  if (!cuerpo.data) throw new Error('GraphQL no devolvio data');

  const crudos: Crudo[] = [];
  for (const repo of Object.values(cuerpo.data)) {
    if (!repo) continue;
    for (const nodo of repo.refs.nodes) {
      const t = nodo.target;
      if (!t) continue; // una ref puede apuntar a algo que no es un commit
      crudos.push({
        sha: t.oid,
        fecha: t.committedDate,
        mensaje: t.messageHeadline,
        url: t.url,
        autor: t.author?.user?.login ?? t.author?.name ?? 'desconocido',
        repo: repo.nameWithOwner.replace(`${DUENIO}/`, ''),
        rama: nodo.name,
      });
    }
  }
  return crudos;
}

/** El commit mas reciente de todos los repos. La fecha manda, no el orden de GitHub. */
function masReciente(crudos: Crudo[]): Crudo | undefined {
  return crudos.reduce<Crudo | undefined>(
    (mejor, c) => (!mejor || c.fecha > mejor.fecha ? c : mejor),
    undefined,
  );
}

/** Dato de ejemplo para cuando no hay token. Mismo texto que el sitio estatico. */
export const COMMIT_DE_EJEMPLO = {
  mensaje: 'feat: add validation for endpoints',
  sha: 'a3f5c7e',
  repo: 'siiges-services',
  rama: 'SDT-1738',
  ticket: 'SDT-1738',
  autor: 'JoeRootX',
  cuando: 'hace 2 horas',
  url: 'https://github.com/JoeRootX/siiges-services',
};

export async function ultimoCommit(): Promise<Fuente<Commit>> {
  const token = process.env.GITHUB_TOKEN?.trim();
  if (!token) {
    return { modo: 'manual', senal: listo(COMMIT_DE_EJEMPLO) };
  }

  try {
    const repos = await listarRepos(token);
    if (repos.length === 0) return { modo: 'auto', senal: vacio('No hay repositorios que consultar.') };

    const crudos = await commitsDeTodos(token, repos);
    const mejor = masReciente(crudos);
    if (!mejor) return { modo: 'auto', senal: vacio('Ningun commit en las ramas de tus repos.') };

    return {
      modo: 'auto',
      senal: listo({
        mensaje: mejor.mensaje,
        sha: mejor.sha.slice(0, 7),
        repo: mejor.repo,
        rama: mejor.rama,
        ticket: REPO_TICKET.test(mejor.rama) ? mejor.rama : null,
        autor: mejor.autor,
        // El texto "hace X" se resuelve aqui, en el servidor. Si se calculara en
        // el cliente, su reloj podria no coincidir con el nuestro y React lo
        // marcaria como error de hidratacion.
        cuando: haceCuando(mejor.fecha),
        url: mejor.url,
      }),
    };
  } catch (error) {
    console.error('[github] fallo la consulta:', error);
    return { modo: 'auto', senal: fallo('No se pudo consultar GitHub ahora mismo.') };
  }
}