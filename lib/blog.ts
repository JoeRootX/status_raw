import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

/**
 * Posts del blog en MDX.
 *
 * El contenido vive en `content/blog/*.mdx`. El frontmatter se extrae aqui, sin
 * dependencias, para que el listado no tenga que compilar MDX: solo el detalle
 * necesita el compilador (lib/mdx.tsx). Asi `npm test` sigue siendo barato.
 */

export type PostMeta = {
  slug: string;
  titulo: string;
  fecha: string;
  tags: string[];
};

export type Post = PostMeta & { cuerpo: string };

/** Slug seguro: minusculas, numeros y guiones. Evita `../` y rutas absolutas. */
export const SLUG_VALIDO = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const DIRECTORIO = path.join(process.cwd(), 'content', 'blog');
const FECHA = /^\d{4}-\d{2}-\d{2}$/;
const DELIMITADOR = /^---\s*$/;

function sinComillas(valor: string): string {
  const m = /^(['"])(.*)\1$/.exec(valor.trim());
  return m ? (m[2] ?? '') : valor.trim();
}

function lista(valor: string): string[] {
  return valor
    .split(',')
    .map((t) => sinComillas(t))
    .filter(Boolean);
}

function valorDe(linea: string): string | string[] {
  const limpio = sinComillas(linea);
  if (limpio.startsWith('[') && limpio.endsWith(']')) return lista(limpio.slice(1, -1));
  if (limpio.includes(',')) return lista(limpio);
  return limpio;
}

/**
 * Separa el frontmatter del cuerpo. Si no hay bloque `---` al inicio, devuelve
 * el texto intacto y `datos` vacio (un post sin metadatos simplemente se ignora).
 */
export function parsearFrontmatter(fuente: string): {
  datos: Record<string, string | string[]>;
  cuerpo: string;
} {
  const texto = fuente.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  const lineas = texto.split('\n');
  if (!DELIMITADOR.test(lineas[0] ?? '')) return { datos: {}, cuerpo: texto };

  const cierre = lineas.findIndex((linea, i) => i > 0 && DELIMITADOR.test(linea));
  if (cierre === -1) return { datos: {}, cuerpo: texto };

  const datos: Record<string, string | string[]> = {};
  for (const linea of lineas.slice(1, cierre)) {
    const limpia = linea.trim();
    if (!limpia || limpia.startsWith('#')) continue;
    const separador = linea.indexOf(':');
    if (separador <= 0) continue;
    const clave = linea.slice(0, separador).trim().toLowerCase();
    datos[clave] = valorDe(linea.slice(separador + 1));
  }

  return { datos, cuerpo: lineas.slice(cierre + 1).join('\n').replace(/^\n+/, '') };
}

function metaDe(slug: string, datos: Record<string, string | string[]>): PostMeta | null {
  const titulo = typeof datos.title === 'string' ? datos.title.trim() : '';
  const fecha = typeof datos.date === 'string' ? datos.date.trim() : '';
  if (!titulo || !FECHA.test(fecha)) return null;

  const tags = Array.isArray(datos.tags)
    ? datos.tags
    : typeof datos.tags === 'string' && datos.tags
      ? [datos.tags]
      : [];

  return { slug, titulo, fecha, tags };
}

/** Fecha ISO (YYYY-MM-DD) en texto es-MX, siempre en UTC para no variar por zona. */
export function formatearFecha(fecha: string): string {
  const d = new Date(`${fecha}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return fecha;
  return new Intl.DateTimeFormat('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(d);
}

/** Listado ordenado por fecha descendente (y slug para empates estables). */
export function listarPosts(): PostMeta[] {
  let archivos: string[];
  try {
    archivos = readdirSync(DIRECTORIO);
  } catch {
    return [];
  }

  return archivos
    .filter((archivo) => archivo.endsWith('.mdx'))
    .map((archivo) => archivo.slice(0, -'.mdx'.length))
    .map((slug) => obtenerPost(slug))
    .filter((post): post is Post => post !== null)
    .map(({ slug, titulo, fecha, tags }) => ({ slug, titulo, fecha, tags }))
    .sort((a, b) => b.fecha.localeCompare(a.fecha) || a.slug.localeCompare(b.slug));
}

/** Post individual; `null` si el slug no es valido o el archivo no existe. */
export function obtenerPost(slug: string): Post | null {
  if (!SLUG_VALIDO.test(slug)) return null;

  let fuente: string;
  try {
    fuente = readFileSync(path.join(DIRECTORIO, `${slug}.mdx`), 'utf8');
  } catch {
    return null;
  }

  const { datos, cuerpo } = parsearFrontmatter(fuente);
  const meta = metaDe(slug, datos);
  return meta ? { ...meta, cuerpo } : null;
}
