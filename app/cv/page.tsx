import type { Metadata } from 'next';
import Link from 'next/link';
import { CV } from '@/lib/cv';
import Footer from '@/components/bloque/Footer';
import Reloj from '@/components/bloque/Reloj';

export const metadata: Metadata = {
  title: 'CV · joerootX',
  description: 'Experiencia, educación y skills de Joe. Descarga el CV en PDF.',
  alternates: { canonical: '/cv' },
};

export default function Cv() {
  return (
    <>
      <header className="top">
        <div className="brand">&gt; joerootX_</div>
        <Reloj />
      </header>

      <main className="main--cv">
        <article className="cv">
          <div className="cv__head">
            <h1>{CV.nombre}</h1>
            <p className="cv__rol">{CV.rol}</p>
            <p className="cv__contacto">
              <span>{CV.ubicacion}</span>
              <a href={`mailto:${CV.correo}`}>{CV.correo}</a>
              <a href={CV.github} target="_blank" rel="noreferrer">
                GitHub
              </a>
            </p>
            <p className="cv__resumen">{CV.resumen}</p>
            <a className="cv__descarga" href="/api/cv" download="cv-joe.pdf">
              Descargar PDF
            </a>
          </div>

          <section className="cv__seccion" aria-labelledby="cv-experiencia">
            <h2 id="cv-experiencia">Experiencia</h2>
            {CV.experiencia.map((e) => (
              <div className="cv__item" key={`${e.puesto}-${e.periodo}`}>
                <h3>
                  {e.puesto} · {e.organizacion}
                </h3>
                <p className="cv__meta">{e.periodo}</p>
                <ul>
                  {e.logros.map((logro) => (
                    <li key={logro}>{logro}</li>
                  ))}
                </ul>
              </div>
            ))}
          </section>

          <section className="cv__seccion" aria-labelledby="cv-educacion">
            <h2 id="cv-educacion">Educación</h2>
            {CV.educacion.map((e) => (
              <div className="cv__item" key={`${e.titulo}-${e.periodo}`}>
                <h3>{e.titulo}</h3>
                <p className="cv__meta">
                  {e.institucion} · {e.periodo}
                </p>
              </div>
            ))}
          </section>

          <section className="cv__seccion" aria-labelledby="cv-skills">
            <h2 id="cv-skills">Skills</h2>
            <div className="cv__skills">
              {CV.skills.map((g) => (
                <div key={g.grupo}>
                  <h3>{g.grupo}</h3>
                  <p>{g.items.join(' · ')}</p>
                </div>
              ))}
            </div>
          </section>

          <Link className="back" href="/">
            &larr; Volver al panel
          </Link>
        </article>
      </main>

      <Footer />
    </>
  );
}
