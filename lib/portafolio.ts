/**
 * Proyectos del portafolio profesional (marca joerootX).
 * Regla de frontera: nada de datos de clientes, del trabajo (SIGES) ni de
 * proyectos personales/entretenimiento. Los repos privados se describen sin enlace.
 */
export interface Proyecto {
  slug: string;
  nombre: string;
  resumen: string;
  logros: string[];
  stack: string[];
  repo?: string;
  demo?: string;
  privado: boolean;
}

export const PROYECTOS: Proyecto[] = [
  {
    slug: 'fabrica',
    nombre: 'Fábrica — orquestador de agentes de código',
    resumen:
      'Orquesta agentes de IA (Hermes + OpenCode) para implementar tareas acotadas con verificación determinista y revisión independiente.',
    logros: [
      'Cada tarea corre aislada: git worktree + sandbox bwrap + red sin salida salvo un proxy con allowlist.',
      'Gates obligatorios: lint, tests, tests inmutables con baseline, escaneo de secretos y alcance de archivos.',
      'Review fail-closed con un modelo de otra familia; evidencia JSON con coste real por sesión.',
      'Solo modelos con retención cero; si un acuerdo vence, el runner cambia de modelo solo.',
    ],
    stack: ['Python', 'Git', 'Linux namespaces', 'LLM agents'],
    privado: true,
  },
  {
    slug: 'cerebro-hq',
    nombre: 'Cerebro HQ — dashboard local-first',
    resumen:
      'Indexa un vault de notas Markdown en SQLite (FTS5 + grafo + embeddings locales) y lo expone en una API y un dashboard web.',
    logros: [
      'Búsqueda híbrida (texto + semántica local) con fusión RRF; sin enviar datos a la nube.',
      'API Fastify con OpenAPI, auth por token y despliegue como servicio systemd.',
      'Más de 200 pruebas automatizadas entre servidor y web.',
    ],
    stack: ['TypeScript', 'Fastify', 'React', 'SQLite', 'Vitest'],
    privado: true,
  },
  {
    slug: 'status-raw',
    nombre: 'joerootX — este sitio',
    resumen:
      'Panel de estado, portafolio, blog y CV en Next.js con ISR e integraciones con GitHub, Jira, Spotify, YouTube y Telegram.',
    logros: [
      'Modo privado por defecto: sin la variable explícita no expone ninguna fuente en vivo.',
      'Cada fuente distingue datos / vacío / error para no romper la página si una API falla.',
      'Blog MDX compilado en servidor compatible con una CSP estricta.',
    ],
    stack: ['Next.js', 'React', 'TypeScript', 'Upstash Redis', 'Vercel'],
    repo: 'https://github.com/JoeRootX/status_raw',
    privado: false,
  },
  {
    slug: 'status-mobile',
    nombre: 'Status Mobile — app de hábitos y salud',
    resumen: 'App personal para métricas corporales, rutinas, comidas y finanzas, con exportación al vault de notas.',
    logros: [
      'Construida por la Fábrica: cada módulo pasó gates y review automatizado.',
      'Exportación/importación de datos al Segundo Cerebro, sin servidor.',
    ],
    stack: ['React', 'TypeScript', 'Vitest'],
    privado: true,
  },
];
