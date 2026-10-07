/**
 * Reglas de validación del formulario, puras y compartidas.
 *
 * Viven aquí y no en el componente porque las corre tanto el navegador
 * (primera línea) como la ruta `/api/contacto` (la de verdad): si cada lado
 * tuviera las suyas, podrían divergir y entrar basura por la red.
 */

export type Campo = 'nombre' | 'telefono' | 'correo' | 'mensaje';

export type Errores = Partial<Record<Campo, string>>;

/** Límites superiores: el navegador los impone con maxLength, aquí se refuerzan. */
export const LIMITES: Record<Campo, number> = {
  nombre: 80,
  telefono: 20,
  correo: 120,
  mensaje: 600,
};

/** Cada regla devuelve `true` o el texto del error. */
export const REGLAS: Record<Campo, (valor: string) => true | string> = {
  nombre: (v) => v.trim().length >= 3 || 'Escribe tu nombre completo.',
  telefono: (v) =>
    (/^[+()\d\s-]+$/.test(v) && v.replace(/\D/g, '').length >= 10) ||
    'Escribe un teléfono válido (10 dígitos o más).',
  correo: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) || 'Escribe un correo válido.',
  mensaje: (v) => v.trim().length >= 10 || 'El mensaje es muy corto (mínimo 10 caracteres).',
};

export const CAMPOS = Object.keys(REGLAS) as Campo[];

/**
 * Valida un objeto plano con los cuatro campos. Los ausentes o no-string
 * cuentan como vacíos y caen en su regla normal.
 */
export function validarCampos(datos: Partial<Record<Campo, unknown>>): Errores {
  const errores: Errores = {};
  for (const campo of CAMPOS) {
    const bruto = datos[campo];
    const valor = typeof bruto === 'string' ? bruto : '';
    if (valor.length > LIMITES[campo]) {
      errores[campo] = `Máximo ${LIMITES[campo]} caracteres.`;
      continue;
    }
    const resultado = REGLAS[campo](valor);
    if (resultado !== true) errores[campo] = resultado;
  }
  return errores;
}
