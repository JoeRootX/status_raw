import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { SITIO_URL } from '@/lib/datos';
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

const DESCRIPCION =
  'Panel de estado personal de Joe: estado actual, ticket en curso, cola de Jira, último commit, Spotify, YouTube y contacto directo.';

export const metadata: Metadata = {
  metadataBase: new URL(SITIO_URL),
  title: 'joerootX · Panel de estado personal',
  description: DESCRIPCION,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'es_MX',
    url: '/',
    siteName: 'joerootX',
    title: 'joerootX · Panel de estado personal',
    description: DESCRIPCION,
  },
  twitter: {
    card: 'summary',
    title: 'joerootX · Panel de estado personal',
    description: DESCRIPCION,
  },
};

export const viewport: Viewport = {
  themeColor: '#070d1c',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${inter.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}