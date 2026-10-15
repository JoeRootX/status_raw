/**
 * Horario laboral de Joe y la rutina de avisos del bot.
 *
 * La jornada es L-V de 9:00 a 17:00: a las 9:00 el panel gira a Trabajo.
 * El bot sondea cada 2 h (11, 13, 15 dentro de la jornada; 17 es la pregunta
 * de salida; 19 y 21 son seguimiento para cuando se sigue de noche).
 * Fuera de esos slots —incluido el silencio 23:00–05:00— y los sábados y
 * domingos no se manda nada de nada.
 *
 * La hora se calcula SIEMPRE en America/Mexico_City con Intl (offset fijo
 * UTC-6: México abolió el horario de verano en 2022). El servidor de Vercel
 * vive en UTC, así que `new Date().getHours()` daría otra hora.
 */

export const RUTINA_TZ = 'America/Mexico_City';

type HoraLocal = {
  ano: number;
  mes: number;
  dia: number;
  hora: number; // 0-23 en hora de Jalisco
  diaSemana: number; // 0 = domingo … 6 = sábado
};

const DIAS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

/** La hora/día de Jalisco en este instante. */
export function horaLocal(fecha: Date = new Date()): HoraLocal {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: RUTINA_TZ,
    hour12: false,
    weekday: 'short',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
  });
  const p = Object.fromEntries(fmt.formatToParts(fecha).map((x) => [x.type, x.value]));
  let hora = Number(p.hour);
  // Algunos runtimes representan la medianoche como "24" con hour12: false.
  if (hora === 24) hora = 0;
  return {
    ano: Number(p.year),
    mes: Number(p.month),
    dia: Number(p.day),
    hora,
    diaSemana: Math.max(0, DIAS.indexOf((p.weekday ?? 'Sun') as (typeof DIAS)[number])),
  };
}

export type AccionRutina =
  | { tipo: 'jornada' } // 9:00 — arranca el día: estado → Trabajo
  | { tipo: 'sondeo' } // 11, 13, 15 — en jornada: ¿sigues trabajando?
  | { tipo: 'fin-jornada' } // 17:00 — ¿sigues trabajando o ya saliste?
  | { tipo: 'seguimiento' }; // 19, 21 — ¿sigues haciendo <estado>?

const SLOTS_SONDEO = new Set([11, 13, 15]);
const SLOTS_SEGUIMIENTO = new Set([19, 21]);

/**
 * Qué toca hacer a esta hora de Jalisco, o null si no toca nada (notas:
 * fin de semana completo y silencio 22:00–08:59 —el supuesto "23:00–05:00"
 * queda cubierto de sobra porque no hay ningún aviso entre 21:59 y 09:00).
 */
export function accionRutina(h: HoraLocal): AccionRutina | null {
  if (h.diaSemana === 0 || h.diaSemana === 6) return null; // sábado / domingo
  if (h.hora === 9) return { tipo: 'jornada' };
  if (SLOTS_SONDEO.has(h.hora)) return { tipo: 'sondeo' };
  if (h.hora === 17) return { tipo: 'fin-jornada' };
  if (SLOTS_SEGUIMIENTO.has(h.hora)) return { tipo: 'seguimiento' };
  return null; // silencio (noche y madrugada)
}

/** Id del slot actual (fecha de Jalisco + hora): para no avisar 2 veces. */
export function idDeSlot(h: HoraLocal): string {
  const dos = (n: number) => String(n).padStart(2, '0');
  return `${h.ano}-${dos(h.mes)}-${dos(h.dia)}T${dos(h.hora)}`;
}

/** Texto del aviso según lo que toca y el estado que la página ya muestra. */
export function textoDe(accion: AccionRutina, etiquetaActual?: string): string {
  switch (accion.tipo) {
    case 'jornada':
      return '🌅 <b>9:00</b> · Empieza la jornada. El panel pasa a <b>Trabajo</b>.';
    case 'sondeo':
      return '💼 ¿Sigues trabajando?';
    case 'fin-jornada':
      return '🌇 <b>5:00 pm</b> · Se acabó el horario. ¿Sigues en la jornada o ya estás libre?';
    case 'seguimiento':
      return etiquetaActual
        ? `🔁 ¿Sigues en <b>${etiquetaActual}</b>?`
        : '🔁 ¿Sigues haciendo lo mismo?';
  }
}

/* Botones: apretas y queda. 'sigo' solo tumba el aviso sin cambiar nada;
   los demas mandan el estado directo (mismas 5 respuestas de siempre). */
export type Teclado = {
  inline_keyboard: Array<Array<{ text: string; callback_data: string }>>;
};

const BOTON = (texto: string, id: string) => ({ text: texto, callback_data: `estado:${id}` });

export function teclado(): Teclado {
  return {
    inline_keyboard: [
      [BOTON('💼 Trabajo', 'work'), BOTON('🏠 Personal', 'personal'), BOTON('🟢 Libre', 'free')],
      [BOTON('🍚 Ausente', 'eat'), BOTON('👥 Junta', 'meet'), BOTON('✅ Sigo así', 'sigo')],
    ],
  };
}
