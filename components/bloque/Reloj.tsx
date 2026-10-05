'use client';

import { useSyncExternalStore } from 'react';

const AFORO = 30_000;

type Reloj = { hora: string; fecha: string };

let cache: Reloj | null = null;
const oyentes = new Set<() => void>();
let temporizador: ReturnType<typeof setInterval> | null = null;

function leer(): Reloj {
  const d = new Date();
  return {
    hora: d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false }),
    fecha: d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }),
  };
}

/**
 * El servidor no puede saber la hora del visitante: si renderizara la real, al
 * hidratar React compararia el HTML del servidor con el del cliente y saltaria el
 * error de hidratacion. Por eso el snapshot del servidor es un marcador fijo y el
 * primer tick real llega en cuanto el componente monta en el navegador.
 */
const SIN_HIDRATAR: Reloj = { hora: '--:--', fecha: '' };

function getSnapshot(): Reloj {
  cache ??= leer();
  return cache;
}

function getServerSnapshot(): Reloj {
  return SIN_HIDRATAR;
}

function tick(): void {
  cache = leer();
  for (const oyente of oyentes) oyente();
}

/**
 * `useSyncExternalStore` en vez de `useState` + `setInterval` en un `useEffect`:
 * el store es la fuente de verdad, React no necesita un estado propio para
 * redibujarse y no aparece el aviso de lint por setear estado dentro del efecto.
 */
function subscribe(oyente: () => void): () => void {
  oyentes.add(oyente);
  if (temporizador === null) {
    tick(); // el primer refresco es inmediato, no a los 30 s
    temporizador = setInterval(tick, AFORO);
  }
  return () => {
    oyentes.delete(oyente);
    if (oyentes.size === 0 && temporizador !== null) {
      clearInterval(temporizador);
      temporizador = null;
    }
  };
}

export default function Reloj() {
  const { hora, fecha } = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return (
    <div className="clock">
      <b>{hora}</b>
      <span>{fecha}</span>
    </div>
  );
}