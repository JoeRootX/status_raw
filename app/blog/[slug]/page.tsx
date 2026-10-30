import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Footer from '@/components/bloque/Footer';
import Reloj from '@/components/bloque/Reloj';
import { formatearFecha, listarPosts, obtenerPost } from '@/lib/blog';
import { renderizarMdx } from '@/lib/mdx';

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return listarPosts().map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = obtenerPost(slug);
  if (!post) return { title: 'Entrada no encontrada · joerootX' };

  return {
    title: `${post.titulo} · joerootX`,
    description: post.titulo,
    alternates: { canonical: `/blog/${post.slug}` },
  };
}

export default async function Entrada({ params }: Props) {
  const { slug } = await params;
  const post = obtenerPost(slug);
  if (!post) notFound();

  const contenido = await renderizarMdx(post.cuerpo);

  return (
    <>
      <header className="top">
        <div className="brand">&gt; joerootX_</div>
        <Reloj />
      </header>

      <main className="main--legal">
        <article className="legal">
          <h1>{post.titulo}</h1>
          <p className="blog-meta">
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
          </p>

          <div className="blog-cuerpo">{contenido}</div>

          <Link className="back" href="/blog">
            ← Todas las entradas
          </Link>
        </article>
      </main>

      <Footer />
    </>
  );
}
