import type { Metadata } from 'next';
import Link from 'next/link';
import { CATEGORIAS, CERTIFICACIONES, agruparCertificaciones } from '@/lib/certs';
import BadgeCert from '@/components/bloque/BadgeCert';
import Footer from '@/components/bloque/Footer';
import Reloj from '@/components/bloque/Reloj';

export const metadata: Metadata = {
  title: 'Certificaciones · joerootX',
  description: 'Certificaciones de Joe agrupadas por categoría, con su badge SVG.',
  alternates: { canonical: '/certs' },
};

export default function Certificaciones() {
  const grupos = agruparCertificaciones();

  return (
    <>
      <header className="top">
        <div className="brand">&gt; joerootX_</div>
        <Reloj />
      </header>

      {/* Igual que /cv y las legales: se anula el grid de tres columnas del panel
          para que las categorias no caigan en una columna estrecha. */}
      <main className="main--certs">
        <div className="certs">
          <header className="certs__head">
            <h1>Certificaciones</h1>
            <p className="certs__intro">
              {CERTIFICACIONES.length} certificaciones en {CATEGORIAS.length} categorías. Cada
              badge se genera como SVG a partir de su sigla y su color.
            </p>
          </header>

          {grupos.map(({ categoria, certificaciones }) => (
            <section
              className="certs__categoria"
              key={categoria.id}
              aria-labelledby={`cat-${categoria.id}`}
            >
              <h2 id={`cat-${categoria.id}`}>
                <span
                  className="certs__dot"
                  style={{ background: categoria.color }}
                  aria-hidden="true"
                />
                {categoria.nombre}
                <span className="certs__cuenta">{certificaciones.length}</span>
              </h2>
              <p className="certs__desc">{categoria.descripcion}</p>

              <ul className="certs__grid">
                {certificaciones.map((certificacion) => (
                  <li className="cert" key={certificacion.id}>
                    <BadgeCert certificacion={certificacion} />
                    <div className="cert__info">
                      <h3>{certificacion.nombre}</h3>
                      <p className="cert__emisor">
                        {certificacion.emisor} · {certificacion.anio}
                      </p>
                      {/* Sin URL no se pinta un enlace muerto: el proyecto evita
                          href="#" cuando la credencial no tiene destino publico. */}
                      {certificacion.url ? (
                        <a href={certificacion.url} target="_blank" rel="noreferrer">
                          Ver credencial
                        </a>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}

          <Link className="back" href="/">
            &larr; Volver al panel
          </Link>
        </div>
      </main>

      <Footer />
    </>
  );
}
