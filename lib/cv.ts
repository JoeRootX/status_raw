/**
 * Datos del CV que pinta /cv y exporta /api/cv en PDF.
 *
 * Vive aparte de la pagina para que la vista y el PDF lean la misma fuente: si
 * se edita aqui, ambos cambian a la vez. Los textos son de ejemplo; actualizar
 * este archivo es lo unico necesario para publicar el CV real.
 */

import { CORREO } from './datos';

export type Experiencia = {
  puesto: string;
  organizacion: string;
  periodo: string;
  logros: readonly string[];
};

export type Educacion = {
  titulo: string;
  institucion: string;
  periodo: string;
};

export type GrupoSkill = {
  grupo: string;
  items: readonly string[];
};

export const CV = {
  nombre: 'Joe',
  rol: 'Desarrollador Full Stack · Creador de contenido',
  ubicacion: 'Jalisco, México',
  correo: CORREO,
  github: 'https://github.com/JoeRootX',
  resumen:
    'Desarrollador full stack enfocado en TypeScript y Next.js. Construyo paneles y automatizaciones que conectan APIs (Jira, GitHub, Telegram, Spotify) y cuido el detalle de la interfaz.',
  experiencia: [
    {
      puesto: 'Desarrollador Full Stack',
      organizacion: 'Independiente',
      periodo: '2022 - actualidad',
      logros: [
        'Panel de estado personal en Next.js 16 con ISR e integraciones de Jira, GitHub, Spotify y YouTube.',
        'Bot de Telegram para cambiar el estado del panel y automatizar los avisos de la rutina laboral con GitHub Actions.',
        'Formulario de contacto con validación compartida cliente/servidor, honeypot y límite de peticiones; entrega vía Telegram.',
      ],
    },
    {
      puesto: 'Desarrollador Web',
      organizacion: 'Freelance',
      periodo: '2020 - 2022',
      logros: [
        'Sitios y landings responsivos con HTML, CSS y JavaScript, sin dependencias innecesarias.',
        'Migración de sitios estáticos a componentes reutilizables y despliegue en Vercel.',
      ],
    },
  ] satisfies readonly Experiencia[],
  educacion: [
    {
      titulo: 'Ingeniería en Sistemas Computacionales',
      institucion: 'Jalisco, México',
      periodo: '2016 - 2020',
    },
  ] satisfies readonly Educacion[],
  skills: [
    {
      grupo: 'Frontend',
      items: ['TypeScript', 'React 19', 'Next.js 16', 'CSS nativo', 'Accesibilidad'],
    },
    {
      grupo: 'Backend y datos',
      items: ['Node.js', 'APIs REST', 'Redis / Upstash', 'Validación de entrada'],
    },
    {
      grupo: 'Herramientas',
      items: ['Git', 'GitHub Actions', 'Jira', 'Vercel', 'Telegram Bot API'],
    },
  ] satisfies readonly GrupoSkill[],
} as const;
