import type { Metadata } from 'next';
import Footer from '@/components/bloque/Footer';
import Encabezado from '@/components/bloque/Encabezado';
import { PROYECTOS } from '@/lib/portafolio';

export const metadata: Metadata = {
  title: 'Portafolio · joerootX',
  description: 'Proyectos de backend, automatización con agentes de IA y herramientas local-first.',
  alternates: { canonical: '/portafolio' },
};

export default function Portafolio() {
  return (
    <>
      <Encabezado />
      <main className="main--legal">
        <section className="legal">
          <h1>Portafolio</h1>
          <p>Backend, automatización con agentes de IA y herramientas local-first. Lo privado se muestra bajo solicitud.</p>
        </section>
        <div className="portafolio">
          {PROYECTOS.map((p) => (
            <article className="proyecto" key={p.slug} id={p.slug}>
              <h2>{p.nombre}</h2>
              <p>{p.resumen}</p>
              <ul>
                {p.logros.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
              <div className="proyecto__stack">
                {p.stack.map((s) => (
                  <span className="tag media" key={s}>
                    {s}
                  </span>
                ))}
              </div>
              <div className="proyecto__enlaces">
                {p.repo ? (
                  <a href={p.repo} target="_blank" rel="noreferrer">
                    Código
                  </a>
                ) : (
                  <span>Código privado</span>
                )}
                {p.demo ? (
                  <a href={p.demo} target="_blank" rel="noreferrer">
                    Demo
                  </a>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
