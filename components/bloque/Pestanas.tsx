'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export const PESTANAS = [
  { href: '/', etiqueta: 'Inicio' },
  { href: '/portafolio', etiqueta: 'Portafolio' },
  { href: '/blog', etiqueta: 'Blog' },
  { href: '/cv', etiqueta: 'CV' },
  { href: '/certs', etiqueta: 'Certificaciones' },
] as const;

export function activa(pathname: string, href: string): boolean {
  return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
}

export default function Pestanas() {
  const pathname = usePathname() ?? '/';
  return (
    <nav className="pestanas" aria-label="Secciones">
      {PESTANAS.map((p) => (
        <Link key={p.href} href={p.href} aria-current={activa(pathname, p.href) ? 'page' : undefined}>
          {p.etiqueta}
        </Link>
      ))}
    </nav>
  );
}
