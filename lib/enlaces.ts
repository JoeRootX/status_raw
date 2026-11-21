/**
 * Enlaces del pie de pagina.
 *
 * `href: null` significa "aun sin destino". En ese caso el pie lo pinta como texto
 * plano y no como enlace: un `href="#"` lleva al inicio de la pagina y no hace
 * nada, que es peor que no parecer clicable. Al rellenar la URL basta cambiar el
 * null por la cadena y el enlace aparece solo, sin tocar el componente.
 */

export type Enlace = {
  texto: string;
  href: string | null;
};

export const esExterno = (href: string): boolean => /^https?:\/\//.test(href);

export const LEGALES: readonly Enlace[] = [
  { texto: 'CV', href: '/cv' },
  { texto: 'Aviso de privacidad', href: '/aviso-de-privacidad' },
  { texto: 'Términos y condiciones', href: '/terminos-y-condiciones' },
];

/** LinkedIn es el perfil real (el mismo que enlaza el README de GitHub).
 *  El resto usa el identificador de la marca profesional, joerootx; las cuentas
 *  se abrieron el 2026-11-20. Nunca se enlaza aquí la marca de entretenimiento. */
export const REDES: readonly Enlace[] = [
  { texto: 'GitHub', href: 'https://github.com/JoeRootX' },
  { texto: 'Instagram', href: 'https://www.instagram.com/joerootx' },
  { texto: 'LinkedIn', href: 'https://www.linkedin.com/in/joel-aaron-duran-castro-57123a199/' },
  { texto: 'TikTok', href: 'https://www.tiktok.com/@joerootx' },
  { texto: 'Twitch', href: 'https://www.twitch.tv/joerootx' },
  { texto: 'X', href: 'https://x.com/joerootx' },
  { texto: 'YouTube', href: 'https://www.youtube.com/@joerootx' },
];