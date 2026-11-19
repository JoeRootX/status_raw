import assert from 'node:assert/strict';
import test from 'node:test';
import { PROYECTOS } from '../lib/portafolio';
import { PESTANAS, activa } from '../components/bloque/Pestanas';

test('portafolio: slugs únicos, logros y sin enlaces en privados', () => {
  const slugs = new Set(PROYECTOS.map((p) => p.slug));
  assert.equal(slugs.size, PROYECTOS.length);
  for (const p of PROYECTOS) {
    assert.ok(p.logros.length > 0, p.slug);
    if (p.privado) assert.equal(p.repo, undefined, `${p.slug} es privado y tiene repo`);
  }
});

test('portafolio: frontera de marca (sin trabajo, entretenimiento ni clientes)', () => {
  const texto = JSON.stringify(PROYECTOS).toLowerCase();
  for (const prohibido of ['siges', 'siiges', 'eljoe', 'vtuber', 'anime', 'minneapolis', 'muelles', 'rp ']) {
    assert.ok(!texto.includes(prohibido), `aparece "${prohibido}"`);
  }
});

test('pestañas: activa marca la sección correcta', () => {
  assert.ok(PESTANAS.some((p) => p.href === '/portafolio'));
  assert.equal(activa('/', '/'), true);
  assert.equal(activa('/blog/x', '/'), false);
  assert.equal(activa('/blog/x', '/blog'), true);
  assert.equal(activa('/blogger', '/blog'), false);
});
