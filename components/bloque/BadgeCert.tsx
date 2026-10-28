import type { Certificacion } from '@/lib/certs';

/**
 * Badge SVG de una certificacion.
 *
 * Se dibuja inline (no es una imagen de /public) para que herede el color de la
 * certificacion sin sumar archivos ni peticiones. El <title> da contexto al
 * lector de pantalla; el nombre de la certificacion ya esta en el <h3> de al
 * lado, asi que el badge es redundante a proposito pero no ruidoso.
 */
export default function BadgeCert({ certificacion }: { certificacion: Certificacion }) {
  const { badge, id, nombre } = certificacion;
  const gradiente = `badge-${id}-grad`;
  const titulo = `badge-${id}-titulo`;

  return (
    <svg
      className="cert__badge"
      width="64"
      height="64"
      viewBox="0 0 64 64"
      role="img"
      aria-labelledby={titulo}
      focusable="false"
    >
      <title id={titulo}>{`Insignia de ${nombre}`}</title>
      <defs>
        <linearGradient id={gradiente} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={badge.color} stopOpacity="0.9" />
          <stop offset="1" stopColor="#0d1630" />
        </linearGradient>
      </defs>
      <path
        d="M32 3 57 17.5v29L32 61 7 46.5v-29z"
        fill={`url(#${gradiente})`}
        stroke={badge.color}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M32 9 51.5 20.5v23L32 55 12.5 43.5v-23z"
        fill="none"
        stroke={badge.color}
        strokeOpacity="0.45"
        strokeWidth="1"
      />
      <text
        x="32"
        y="37"
        textAnchor="middle"
        fontFamily="var(--font-jetbrains-mono), ui-monospace, monospace"
        fontSize="15"
        fontWeight="700"
        letterSpacing="1"
        fill={badge.tinta}
      >
        {badge.sigla}
      </text>
    </svg>
  );
}
