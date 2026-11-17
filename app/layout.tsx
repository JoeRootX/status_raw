import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { COLOR_ESTADO, SITIO_URL } from '@/lib/datos';
import { estadoActual } from '@/lib/estado';
import { esPanelPublico } from '@/lib/privacidad';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

/**
 * Con el panel cerrado tambien cambian el titulo y el noindex: la pestaña y las
 * tarjetas sociales decian "Panel de estado personal" aunque ya no se publicara
 * nada, y el titulo es lo primero que ve alguien al compartir el enlace.
 */
const PUBLICO = esPanelPublico();

const TITULO = PUBLICO ? 'joerootX · Panel de estado personal' : 'joerootX · Desarrollador';

const DESCRIPCION = PUBLICO
  ? 'Panel de estado personal de Joe: estado actual, ticket en curso, cola de Jira, último commit, Spotify, YouTube y contacto directo.'
  : 'joerootX — desarrollo de software, auditoría de código y creación de contenido.';

export const metadata: Metadata = {
  metadataBase: new URL(SITIO_URL),
  title: TITULO,
  description: DESCRIPCION,
  alternates: { canonical: '/' },
  // robots.txt ya bloquea el rastreo; el meta es la segunda capa, por si alguien
  // llega por enlace directo o el fichero no se sirve.
  robots: PUBLICO ? undefined : { index: false, follow: false },
  openGraph: {
    type: 'website',
    locale: 'es_MX',
    url: '/',
    siteName: 'joerootX',
    title: TITULO,
    description: DESCRIPCION,
  },
  twitter: {
    card: 'summary',
    title: TITULO,
    description: DESCRIPCION,
  },
};

/**
 * theme-color dinamico: la barra del navegador toma el color del estado actual.
 * Se lee con la misma cache etiquetada que la pagina, asi que el
 * `revalidateTag('estado')` del webhook tambien refresca este metadato.
 */
export async function generateViewport(): Promise<Viewport> {
  // El theme-color sigue al estado y por eso tambien lo delata: es un canal
  // lateral (la barra del navegador cambia de color). Cerrado, color neutro.
  if (!esPanelPublico()) return { themeColor: '#111214' };
  const estado = await estadoActual();
  return { themeColor: COLOR_ESTADO[estado] };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${inter.variable} ${mono.variable}`}>
      <body>
        {/* Primer elemento enfocable: con Tab se revela y salta al contenido. */}
        <a className="skip-link" href="#contenido">
          Saltar al contenido
        </a>
        {children}
      </body>
    </html>
  );
}