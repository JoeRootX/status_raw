import type { NextConfig } from 'next';
import { networkInterfaces } from 'node:os';

/**
 * Next 16 devuelve 403 a /_next/* (JS de dev incluido) si la pagina se abre por
 * la IP local en vez de localhost: sin JS no hidrata nada (el reloj se queda en
 * --:--). Se listan las IPv4 no internas de la maquina para que funcione hoy y
 * tambien si cambia la IP por DHCP.
 */
const IPsLocales = Object.values(networkInterfaces())
  .flat()
  .filter((i): i is NonNullable<typeof i> => i !== undefined && i.family === 'IPv4' && !i.internal)
  .map((i) => i.address);

/**
 * Cabeceras de seguridad, ajustadas a lo que este sitio de verdad carga:
 * - style-src con 'unsafe-inline': el <Thumb> de Multimedia pinta el background
 *   de la portada con style inline; sin esto todas las caratulas se romperian.
 * - script-src con 'unsafe-inline': el bootstrap/hidratacion de App Router
 *   inlinea el payload; 'strict-dynamic' con nonces no aporta aqui y romperia
 *   la hidratacion.
 * - img-src cubre los thumbs de Spotify (la.url en <img> si se usa) y YouTube
 *   (i.ytimg.com, ahora via CSS background-image, que tambien cae en img-src).
 * - connect-src 'self': el poller solo habla con /api/*.
 * - frame-ancestors 'none' + X-Frame-Options: el panel no es para iframes.
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https://i.scdn.co https://i.ytimg.com",
  "font-src 'self' data:",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

const nextConfig: NextConfig = {
  allowedDevOrigins: IPsLocales,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: CSP },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

export default nextConfig;
