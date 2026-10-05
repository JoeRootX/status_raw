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
  { texto: 'Aviso de privacidad', href: '/aviso-de-privacidad' },
  { texto: 'Términos y condiciones', href: '/terminos-y-condiciones' },
];

export const REDES: readonly Enlace[] = [
  { texto: 'GitHub', href: null },
  { texto: 'Instagram', href: null },
  { texto: 'LinkedIn', href: null },
  { texto: 'X', href: null },
];