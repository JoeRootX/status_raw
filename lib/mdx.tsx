import { compile, run } from '@mdx-js/mdx';
import * as jsx from 'react/jsx-runtime';

/**
 * Compila y renderiza el cuerpo MDX de un post.
 *
 * Se hace en servidor: el resultado llega al navegador como HTML/React ya
 * resuelto, asi que no se envia el compilador al cliente ni hace falta `eval`
 * en el navegador (la CSP no permite `unsafe-eval`). El frontmatter ya viene
 * separado por lib/blog.ts.
 */
export async function renderizarMdx(cuerpo: string) {
  const compilado = String(await compile(cuerpo, { outputFormat: 'function-body' }));
  const { default: Contenido } = await run(compilado, { ...jsx });

  if (!Contenido) throw new Error('MDX no devolvio un componente');
  return <Contenido />;
}
