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

const nextConfig: NextConfig = {
  allowedDevOrigins: IPsLocales,
};

export default nextConfig;