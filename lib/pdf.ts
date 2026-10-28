/**
 * Generador de PDF del CV, sin dependencias.
 *
 * Un PDF de una sola fuente (Helvetica) y texto plano no necesita una libreria
 * completa: basta con escribir los objetos, el stream de contenido y la tabla
 * xref. Asi el endpoint no suma peso ni superficie de ataque al proyecto.
 * Solo se usan caracteres que existen en WinAnsi; las comillas/flechas
 * tipograficas se normalizan a ASCII antes de escribir el texto.
 */

import { CV, type GrupoSkill, type Educacion, type Experiencia } from './cv';

const ANCHO = 595; // A4 en puntos
const ALTO = 842;
const MARGEN = 48;
const ANCHO_UTIL = ANCHO - MARGEN * 2;

type Linea = {
  texto: string;
  tam: number;
  negrita: boolean;
  /** Puntos en blanco antes de esta linea. */
  espacio?: number;
  /** Color RGB 0-1; por defecto negro. */
  color?: readonly [number, number, number];
};

const NEGRO = [0, 0, 0] as const;
const GRIS = [0.35, 0.35, 0.35] as const;
const AZUL = [0.18, 0.42, 1] as const;

/** WinAnsi cubre Latin-1 salvo el rango 0x80-0x9F: se normaliza a ASCII. */
function normalizar(texto: string): string {
  return texto
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/\u2026/g, '...')
    .replace(/\u00a0/g, ' ');
}

function escapar(texto: string): string {
  return normalizar(texto).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

/** Corte de linea por palabras con un ancho aproximado de Helvetica (0.52 em). */
function envolver(texto: string, tam: number): string[] {
  const maximo = Math.max(20, Math.floor(ANCHO_UTIL / (tam * 0.52)));
  const lineas: string[] = [];
  let actual = '';
  for (const palabra of normalizar(texto).split(/\s+/)) {
    const candidata = actual ? `${actual} ${palabra}` : palabra;
    if (candidata.length > maximo && actual) {
      lineas.push(actual);
      actual = palabra;
    } else {
      actual = candidata;
    }
  }
  if (actual) lineas.push(actual);
  return lineas;
}

function contenido(): Linea[] {
  const lineas: Linea[] = [];
  const agregar = (
    texto: string,
    tam: number,
    negrita: boolean,
    espacio = 0,
    color: readonly [number, number, number] = NEGRO,
  ) => {
    envolver(texto, tam).forEach((l, i) => {
      lineas.push({ texto: l, tam, negrita, espacio: i === 0 ? espacio : 0, color });
    });
  };
  const seccion = (titulo: string) => agregar(titulo, 14, true, 20, AZUL);

  agregar(CV.nombre, 24, true);
  agregar(CV.rol, 12, false, 4, AZUL);
  agregar(
    `${CV.ubicacion} · ${CV.correo} · ${CV.github.replace('https://', '')}`,
    10,
    false,
    4,
    GRIS,
  );
  agregar(CV.resumen, 10, false, 14);

  seccion('Experiencia');
  for (const e of CV.experiencia as readonly Experiencia[]) {
    agregar(`${e.puesto} · ${e.organizacion}`, 11, true, 6);
    agregar(e.periodo, 9, false, 2, GRIS);
    for (const logro of e.logros) agregar(`- ${logro}`, 10, false, 2);
  }

  seccion('Educación');
  for (const e of CV.educacion as readonly Educacion[]) {
    agregar(e.titulo, 11, true, 6);
    agregar(`${e.institucion} · ${e.periodo}`, 9, false, 2, GRIS);
  }

  seccion('Skills');
  for (const g of CV.skills as readonly GrupoSkill[]) {
    agregar(g.grupo, 10, true, 6);
    agregar(g.items.join(' · '), 10, false, 2);
  }

  return lineas;
}

function paginar(lineas: readonly Linea[]): string[][] {
  const paginas: string[][] = [[]];
  let y = ALTO - MARGEN;

  for (const linea of lineas) {
    const alto = linea.tam * 1.35;
    const espacio = linea.espacio ?? 0;
    if (y - espacio - alto < MARGEN) {
      paginas.push([]);
      y = ALTO - MARGEN;
    } else {
      y -= espacio;
    }
    y -= linea.tam;
    const color = (linea.color ?? NEGRO).map((c) => c.toFixed(3)).join(' ');
    paginas[paginas.length - 1]!.push(
      `${color} rg\nBT /${linea.negrita ? 'F2' : 'F1'} ${linea.tam} Tf ${MARGEN} ${y.toFixed(2)} Td (${escapar(linea.texto)}) Tj ET`,
    );
  }
  return paginas;
}

export function generarPdfCv(): Uint8Array<ArrayBuffer> {
  const paginas = paginar(contenido());
  const idPagina = (i: number) => 6 + i * 2;

  const objetos: string[] = [];
  objetos[0] = '<< /Type /Catalog /Pages 2 0 R >>';
  objetos[1] = `<< /Type /Pages /Kids [${paginas
    .map((_, i) => `${idPagina(i)} 0 R`)
    .join(' ')}] /Count ${paginas.length} >>`;
  objetos[2] =
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';
  objetos[3] =
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>';
  objetos[4] = `<< /Title (${escapar('CV - ' + CV.nombre)}) /Author (${escapar(CV.nombre)}) >>`;

  paginas.forEach((comandos, i) => {
    const contenidoPdf = comandos.join('\n');
    objetos[idPagina(i) - 1] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${ANCHO} ${ALTO}] ` +
      `/Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${idPagina(i) + 1} 0 R >>`;
    objetos[idPagina(i)] =
      `<< /Length ${Buffer.byteLength(contenidoPdf, 'latin1')} >>\nstream\n${contenidoPdf}\nendstream`;
  });

  let pdf = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
  const offsets: number[] = [];
  for (let i = 0; i < objetos.length; i++) {
    offsets[i] = Buffer.byteLength(pdf, 'latin1');
    pdf += `${i + 1} 0 obj\n${objetos[i] ?? ''}\nendobj\n`;
  }

  const inicioXref = Buffer.byteLength(pdf, 'latin1');
  pdf += `xref\n0 ${objetos.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets) {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objetos.length + 1} /Root 1 0 R /Info 5 0 R >>\nstartxref\n${inicioXref}\n%%EOF\n`;

  return new Uint8Array(Buffer.from(pdf, 'latin1'));
}
