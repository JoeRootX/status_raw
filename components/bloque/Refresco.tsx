'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

/**
 * El cambio de estado tardaba en verse si nadie tocaba la pestaña: el render
 * del servidor no vuelve a preguntar sin una visita. Este poller consulta
 * `/api/estado` (una ruta barata que solo contesta el EstadoId) y cuando lo que
 * hay en Redis ya no coincide con el que se pintó, pide un re-render del
 * Server Component con `router.refresh()`. Como el webhook purga el cache al
 * guardar con `expire: 0`, ese re-render sale fresco de inmediato.
 *
 * Dos detalles de fluidez:
 * - Al volver a la pestaña (visibilitychange) se consulta al momento en vez de
 *   esperar hasta 30 s al siguiente tick del intervalo.
 * - El intervalo solo sondea con la pestaña visible: en segundo plano no
 *  serviría de nada refrescar y ahorra peticiones a la API barata.
 */
export default function Refresco({ estado }: { estado: string }) {
  const router = useRouter();
  const pintado = useRef(estado);

  useEffect(() => {
    pintado.current = estado;
  }, [estado]);

  useEffect(() => {
    let vivo = true;

    async function sondear() {
      try {
        const respuesta = await fetch('/api/estado', { cache: 'no-store' });
        if (!respuesta.ok) return;
        const { estado: actual } = (await respuesta.json()) as { estado?: string };
        if (vivo && actual && actual !== pintado.current) router.refresh();
      } catch {
        // Offline o error de red: se reintenta en el próximo sondeo.
      }
    }

    const sondeo = setInterval(() => {
      // Sin pestaña visible no interesa refrescar: se reintenta al volver.
      if (!document.hidden) void sondear();
    }, 30_000);

    // Al volver del fondo, sondeo inmediato en vez de esperar el próximo tick.
    const alVolver = () => {
      if (!document.hidden) void sondear();
    };
    document.addEventListener('visibilitychange', alVolver);

    return () => {
      vivo = false;
      clearInterval(sondeo);
      document.removeEventListener('visibilitychange', alVolver);
    };
  }, [router]);

  return null;
}
