import assert from 'node:assert/strict';
import test from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { formatearFecha, listarPosts, obtenerPost, parsearFrontmatter } from '../lib/blog';
import { renderizarMdx } from '../lib/mdx';

test('parsearFrontmatter separa metadatos y cuerpo', () => {
  const { datos, cuerpo } = parsearFrontmatter(
    ['---', 'title: "Hola MDX"', 'date: 2026-10-26', 'tags: [nextjs, mdx]', '---', '', 'Cuerpo.'].join('\n'),
  );

  assert.equal(datos.title, 'Hola MDX');
  assert.equal(datos.date, '2026-10-26');
  assert.deepEqual(datos.tags, ['nextjs', 'mdx']);
  assert.equal(cuerpo, 'Cuerpo.');
});

test('parsearFrontmatter tolera CRLF, comillas y listas separadas por coma', () => {
  const { datos, cuerpo } = parsearFrontmatter(
    "---\r\ntitle: 'Sin comillas'\r\ndate: 2026-01-02\r\ntags: uno, dos\r\n---\r\n\r\nTexto",
  );

  assert.equal(datos.title, 'Sin comillas');
  assert.deepEqual(datos.tags, ['uno', 'dos']);
  assert.equal(cuerpo, 'Texto');
});

test('sin frontmatter devuelve el texto intacto', () => {
  const fuente = '# Solo markdown\n\nSin metadatos.';
  const { datos, cuerpo } = parsearFrontmatter(fuente);
  assert.deepEqual(datos, {});
  assert.equal(cuerpo, fuente);
});

test('listarPosts ordena por fecha descendente y expone title/date/tags', () => {
  const posts = listarPosts();
  assert.ok(posts.length >= 2);

  const fechas = posts.map((p) => p.fecha);
  assert.deepEqual(fechas, [...fechas].sort((a, b) => b.localeCompare(a)));
  assert.equal(posts[0]?.slug, 'mdx-en-next');
  assert.deepEqual(posts[0]?.tags, ['nextjs', 'mdx']);
  for (const post of posts) {
    assert.match(post.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.ok(post.titulo);
    assert.match(post.fecha, /^\d{4}-\d{2}-\d{2}$/);
  }
});

test('obtenerPost devuelve cuerpo sin frontmatter y rechaza slugs peligrosos', () => {
  const post = obtenerPost('mdx-en-next');
  assert.ok(post);
  assert.equal(post.titulo, 'MDX en Next 16 sin romper la CSP');
  assert.ok(post.cuerpo.includes('## Por qué en el servidor'));
  assert.ok(!post.cuerpo.includes('title:'));

  assert.equal(obtenerPost('no-existe'), null);
  assert.equal(obtenerPost('../package'), null);
  assert.equal(obtenerPost('/etc/passwd'), null);
});

test('renderizarMdx compila encabezado, lista, enlace y bloque de codigo', async () => {
  const contenido = await renderizarMdx(
    [
      '## Seccion',
      '',
      '- uno',
      '- dos',
      '',
      '[Enlace](https://example.com)',
      '',
      '```js',
      'const x = 1;',
      '```',
    ].join('\n'),
  );

  assert.ok(contenido);
  const html = renderToStaticMarkup(contenido);
  assert.match(html, /<h2>Seccion<\/h2>/);
  assert.match(html, /<ul>/);
  assert.match(html, /<li>uno<\/li>/);
  assert.match(html, /href="https:\/\/example\.com"/);
  assert.match(html, /<pre><code[^>]*>/);
  assert.match(html, /const x = 1;/);
});

test('renderizarMdx devuelve null con MDX invalido', async () => {
  assert.equal(await renderizarMdx('## Sin cerrar\n\n<div>'), null);
});

test('formatearFecha usa es-MX sin variar por zona horaria', () => {
  const texto = formatearFecha('2026-10-26');
  assert.ok(texto.includes('26'));
  assert.ok(texto.includes('octubre'));
  assert.ok(texto.includes('2026'));
});
