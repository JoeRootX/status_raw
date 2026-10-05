/**
 * Aviso comun a las dos paginas legales.
 *
 * El texto de /aviso-de-privacidad y /terminos-y-condiciones sigue con corchetes:
 * son huecos reales, no marcadores de estilo. Mientras siga asi, ambas rutas se
 * sirven con robots noindex y esta nota lo dice sin rodeos para que quien las lea no
 * las tome por definitivas.
 */
export default function AvisoDelBorrador() {
  return (
    <p className="legal-note">
      BORRADOR de estructura. No es texto legal definitivo: debe revisarlo un abogado antes
      de publicar.
    </p>
  );
}