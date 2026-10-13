import type { Metadata } from 'next';
import Link from 'next/link';
import { CORREO, FECHA_ACTUALIZACION } from '@/lib/datos';
import AvisoDelBorrador from '@/components/legal/AvisoDelBorrador';
import Reloj from '@/components/bloque/Reloj';

export const metadata: Metadata = {
  title: 'Términos y condiciones · joerootX',
  description: 'Qué muestra este sitio, cómo se usa el formulario de contacto y qué responsabilidades hay.',
  robots: { index: false, follow: true },
};

export default function TerminosYCondiciones() {
  return (
    <>
      <header className="top">
        <div className="brand">&gt; joerootX_</div>
        <Reloj />
      </header>

      <main className="main--legal">
        <article className="legal">
          <h1>Términos y condiciones</h1>
          <AvisoDelBorrador />

          <h2>Qué es este sitio</h2>
          <p>
            Una página personal que muestra mi estado, mi ticket en curso y mi actividad
            pública.
          </p>

          <h2>Información mostrada</h2>
          <p>
            Los datos de estado, música, video y commits se muestran con fines informativos y
            pueden no estar actualizados.
          </p>

          <h2>Uso del formulario</h2>
          <p>
            No envíes datos sensibles ni contenido ilegal, ofensivo o publicitario. Puedo
            ignorar o bloquear mensajes abusivos.
          </p>

          <h2>Contacto directo</h2>
          <p>
            Además del formulario puedes escribirme por los canales del pie de página: correo
            electrónico ({CORREO}) o WhatsApp, que abre tu app con el chat directo a mí; ahí el
            trato de datos lo hace WhatsApp conforme a sus propios términos.
          </p>

          <h2>Propiedad y enlaces</h2>
          <p>
            El contenido de este sitio (textos, diseño y código) me pertenece. Los enlaces de
            referencia a terceros (Spotify, YouTube, GitHub, Jira, Telegram y similares) se
            ofrecen tal cual: no controlo su contenido ni sus políticas, y la actividad que
            muestran es información pública de esas plataformas.
          </p>

          <h2>Cambios y contacto</h2>
          <p>
            Puedo modificar estos términos. Contacto: {CORREO}. Última actualización:{' '}
            {FECHA_ACTUALIZACION}.
          </p>

          <Link className="back" href="/">
            &larr; Volver al panel
          </Link>
        </article>
      </main>
    </>
  );
}