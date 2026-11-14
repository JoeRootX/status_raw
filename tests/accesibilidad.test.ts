import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const leer = (ruta: string) => readFileSync(new URL(`../${ruta}`, import.meta.url), 'utf8');

test('el layout incluye un skip link al contenido principal', () => {
  const layout = leer('app/layout.tsx');

  assert.match(layout, /className="skip-link"[^>]*href="#contenido"/, 'falta el skip link');
});

test('globals.css define :focus-visible para enlaces y botones', () => {
  const css = leer('app/globals.css');

  assert.match(css, /a:focus-visible/, 'falta foco visible en enlaces');
  assert.match(css, /button:focus-visible/, 'falta foco visible en botones');
});
