import type { Metadata } from 'next';
import Link from 'next/link';
import { CORREO, DOMICILIO, FECHA_ACTUALIZACION, NOMBRE } from '@/lib/datos';
import AvisoDelBorrador from '@/components/legal/AvisoDelBorrador';
import Reloj from '@/components/bloque/Reloj';

export const metadata: Metadata = {
  title: 'Aviso de privacidad · joerootX',
  description: 'Qué datos se recaban al escribir por el formulario de contacto y para qué se usan.',
  // El texto sigue con corchetes y sin revision legal: no debe indexarse hasta
  // que un abogado lo valide.
  robots: { index: false, follow: true },
};

export default function AvisoDePrivacidad() {
  return (
    <>
      <header className="top">
        <div className="brand">&gt; joerootX_</div>
        <Reloj />
      </header>

      <main className="main--legal">
        <article className="legal">
          <h1>Aviso de privacidad</h1>
          <AvisoDelBorrador />

          <h2>Responsable</h2>
          <p>
            {NOMBRE}, con domicilio en {DOMICILIO} y correo {CORREO}, es responsable del
            tratamiento de tus datos personales.
          </p>

          <h2>Datos que se recaban</h2>
          <ul>
            <li>Nombre, teléfono y correo electrónico.</li>
            <li>El contenido del mensaje que escribas.</li>
          </ul>

          <h2>Finalidad</h2>
          <p>
            Recibir tu mensaje y poder responderte. No se usan para publicidad ni se venden.
          </p>

          <h2>Transferencia a terceros</h2>
          <p>
            Tu mensaje se entrega mediante Telegram, un servicio de un tercero con servidores
            fuera de México. [REVISAR cómo debe declararse.]
          </p>

          <h2>Conservación</h2>
          <p>[DEFINIR por cuánto tiempo se conservan los mensajes.]</p>

          <h2>Derechos ARCO y revocación</h2>
          <p>
            Puedes acceder, rectificar, cancelar u oponerte al tratamiento, y revocar tu
            consentimiento, escribiendo a {CORREO}. [REVISAR el procedimiento y los plazos que
            marca la ley vigente.]
          </p>

          <h2>Cambios al aviso</h2>
          <p>
            Los cambios se publicarán en esta página. Última actualización: {FECHA_ACTUALIZACION}.
          </p>

          <Link className="back" href="/">
            &larr; Volver al panel
          </Link>
        </article>
      </main>
    </>
  );
}