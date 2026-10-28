import { generarPdfCv } from '@/lib/pdf';

/** El CV es estático: se puede generar una vez y servirse con cache. */
export const dynamic = 'force-static';

export function GET() {
  const pdf = generarPdfCv();
  return new Response(pdf, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="cv-joe.pdf"',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
