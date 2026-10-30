import * as jsx from 'react/jsx-runtime';

/**
 * Compila y renderiza el cuerpo MDX de un post.
 *
 * Se hace en servidor: el resultado llega al navegador como HTML/React ya
 * resuelto, asi que no se envia el compilador al cliente ni hace falta `eval`
 * en el navegador (la CSP no permite `unsafe-eval`). El frontmatter ya viene
 * separado por lib/blog.ts.
 *
 * Si el MDX es invalido devuelve null para que la pagina degrade en vez de
 * responder con un 500.
 */
export async function renderizarMdx(cuerpo: string) {
  try {
    // Import dinamico: @mdx-js/mdx es ESM y tsx/Node no puede requerirlo desde CJS.
    const { compile, run } = await import('@mdx-js/mdx');
    const compilado = String(await compile(cuerpo, { outputFormat: 'function-body' }));
    const { default: Contenido } = await run(compilado, { ...jsx });

    if (!Contenido) return null;
    return <Contenido />;
  } catch (e) {
    console.error('[mdx]', e);
    return null;
  }
}
