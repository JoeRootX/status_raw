'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

/**
 * El cambio de estado tardaba en verse si nadie tocaba la pestaña: el(Server)
 * render no vuelve a preguntar sin una visita. Este poller de 30 s consulta
 * `/api/estado` (una ruta barata que solo contesta el EstadoId) y cuando lo que
 * hay en Redis ya no coincide con el que se pintó, pide un re-render del
 * Server Component con `router.refresh()`. Como el webhook purga el cache al
 * guardar, ese re-render sale fresco de inmediato.
 */
export default function Refresco({ estado }: { estado: string }) {
  const router = useRouter();
  const pintado = useRef(estado);

  useEffect(() => {
    pintado.current = estado;
  }, [estado]);

  useEffect(() => {
    let vivo = true;
    const sondeo = setInterval(async () => {
      try {
        const respuesta = await fetch('/api/estado', { cache: 'no-store' });
        if (!respuesta.ok) return;
        const { estado: actual } = (await respuesta.json()) as { estado?: string };
        if (vivo && actual && actual !== pintado.current) router.refresh();
      } catch {
        // Offline o error de red: se reintenta en el próximo sondeo.
      }
    }, 30_000);
    return () => {
      vivo = false;
      clearInterval(sondeo);
    };
  }, [router]);

  return null;
}
