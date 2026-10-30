import type { Metadata } from 'next';
import Link from 'next/link';
import Footer from '@/components/bloque/Footer';
import Reloj from '@/components/bloque/Reloj';
import { formatearFecha, listarPosts } from '@/lib/blog';

export const metadata: Metadata = {
  title: 'Blog · joerootX',
  description: 'Notas sobre desarrollo, proyectos y lo que voy aprendiendo.',
  alternates: { canonical: '/blog' },
};

export default function Blog() {
  const posts = listarPosts();

  return (
    <>
      <header className="top">
        <div className="brand">&gt; joerootX_</div>
        <Reloj />
      </header>

      <main className="main--legal">
        <section className="legal">
          <h1>Blog</h1>
          <p>Notas sobre desarrollo, proyectos y lo que voy aprendiendo.</p>

          {posts.length === 0 ? (
            <p className="blog-vacio">Todavía no hay entradas.</p>
          ) : (
            <ul className="blog-lista">
              {posts.map((post) => (
                <li key={post.slug}>
                  <Link href={`/blog/${post.slug}`}>{post.titulo}</Link>
                  <time dateTime={post.fecha}>{formatearFecha(post.fecha)}</time>
                  {post.tags.length > 0 ? (
                    <span className="blog-tags">
                      {post.tags.map((tag) => (
                        <span className="tag media" key={tag}>
                          {tag}
                        </span>
                      ))}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          )}

          <Link className="back" href="/">
            ← Volver al inicio
          </Link>
        </section>
      </main>

      <Footer />
    </>
  );
}
