/**
 * Certificaciones y categorias que pinta /certs.
 *
 * Los datos viven aqui (y no en la pagina) para que la vista solo se encargue de
 * agrupar y dibujar. Los badges son SVG generados por `BadgeCert` a partir de la
 * sigla y el color de cada certificacion, sin imagenes externas ni peticiones.
 *
 * Los registros son de ejemplo, igual que los del CV: actualizar este archivo es
 * lo unico necesario para publicar las credenciales reales. `url: null` significa
 * "sin credencial publica" y la pagina lo omite en vez de inventar un enlace.
 */

export type CategoriaId = 'desarrollo' | 'datos' | 'herramientas' | 'idiomas';

export type Categoria = {
  id: CategoriaId;
  nombre: string;
  descripcion: string;
  /** Color de la marca de la categoria; tambien lo usan los badges. */
  color: string;
};

export type Badge = {
  /** Dos o tres caracteres que caben dentro del SVG. */
  sigla: string;
  color: string;
  tinta: string;
};

export type Certificacion = {
  id: string;
  nombre: string;
  emisor: string;
  anio: number;
  categoria: CategoriaId;
  badge: Badge;
  url: string | null;
};

export type GrupoCertificaciones = {
  categoria: Categoria;
  certificaciones: Certificacion[];
};

export const CATEGORIAS = [
  {
    id: 'desarrollo',
    nombre: 'Desarrollo',
    descripcion: 'Lenguajes, frameworks y fundamentos de la web.',
    color: '#2f6bff',
  },
  {
    id: 'datos',
    nombre: 'Datos',
    descripcion: 'Consultas, almacenamiento y caché.',
    color: '#2fd16b',
  },
  {
    id: 'herramientas',
    nombre: 'Herramientas',
    descripcion: 'Flujos de trabajo, integración continua y gestión.',
    color: '#ff9f2e',
  },
  {
    id: 'idiomas',
    nombre: 'Idiomas',
    descripcion: 'Comunicación profesional.',
    color: '#a24bff',
  },
] as const satisfies readonly Categoria[];

export const CERTIFICACIONES = [
  {
    id: 'typescript-avanzado',
    nombre: 'TypeScript Avanzado',
    emisor: 'Platzi',
    anio: 2025,
    categoria: 'desarrollo',
    badge: { sigla: 'TS', color: '#2f6bff', tinta: '#ffffff' },
    url: null,
  },
  {
    id: 'next-app-router',
    nombre: 'Next.js 16: App Router',
    emisor: 'Vercel Academy',
    anio: 2026,
    categoria: 'desarrollo',
    badge: { sigla: 'NX', color: '#8fb0ff', tinta: '#04102a' },
    url: null,
  },
  {
    id: 'accesibilidad-wcag',
    nombre: 'Accesibilidad Web (WCAG 2.2)',
    emisor: 'W3Cx',
    anio: 2024,
    categoria: 'desarrollo',
    badge: { sigla: 'AW', color: '#14b8a6', tinta: '#04102a' },
    url: null,
  },
  {
    id: 'sql-analisis',
    nombre: 'SQL para análisis de datos',
    emisor: 'DataCamp',
    anio: 2024,
    categoria: 'datos',
    badge: { sigla: 'SQL', color: '#2fd16b', tinta: '#04102a' },
    url: null,
  },
  {
    id: 'redis-desarrolladores',
    nombre: 'Redis para desarrolladores',
    emisor: 'Redis University',
    anio: 2025,
    categoria: 'datos',
    badge: { sigla: 'RD', color: '#ff3b4a', tinta: '#ffffff' },
    url: null,
  },
  {
    id: 'github-actions',
    nombre: 'GitHub Actions',
    emisor: 'GitHub Skills',
    anio: 2025,
    categoria: 'herramientas',
    badge: { sigla: 'GH', color: '#ff9f2e', tinta: '#04102a' },
    url: null,
  },
  {
    id: 'jira-agile',
    nombre: 'Jira para equipos ágiles',
    emisor: 'Atlassian University',
    anio: 2024,
    categoria: 'herramientas',
    badge: { sigla: 'JR', color: '#a24bff', tinta: '#ffffff' },
    url: null,
  },
  {
    id: 'ingles-b2',
    nombre: 'Inglés B2',
    emisor: 'EF SET',
    anio: 2023,
    categoria: 'idiomas',
    badge: { sigla: 'EN', color: '#ff9f2e', tinta: '#04102a' },
    url: null,
  },
] as const satisfies readonly Certificacion[];

/**
 * Agrupa por categoria respetando el orden de `CATEGORIAS` y descarta las
 * categorias vacias. Asi la pagina no repite ni el `filter` ni el `find`.
 */
export function agruparCertificaciones(
  certificaciones: readonly Certificacion[] = CERTIFICACIONES,
): GrupoCertificaciones[] {
  return CATEGORIAS.map((categoria) => ({
    categoria,
    certificaciones: certificaciones.filter((c) => c.categoria === categoria.id),
  })).filter((grupo) => grupo.certificaciones.length > 0);
}
