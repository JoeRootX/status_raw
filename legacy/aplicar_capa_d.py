#!/usr/bin/env python3
"""Aplica sobre TU index.html: (1) flote con contenedor estable + retardos positivos,
y (2) Capa D: estados del formulario y vistas legales.
Uso:  python3 aplicar_capa_d.py index.html
Hace copia en index.html.bak y se detiene sin tocar nada si algun ancla no coincide."""
import re, sys, shutil

ruta = sys.argv[1] if len(sys.argv) > 1 else 'index.html'
s = open(ruta, encoding='utf-8').read()

def una_vez(texto, pieza):
    assert texto.count(pieza) == 1, f'Ancla no encontrada o repetida: {pieza[:60]!r}'

# ---------- 1. FLOTE: retardos positivos (0.2-2 s) ----------
RETARDOS = {
 '#spotify{--d:8.5s;--dl:-1.5s}':'#spotify{--d:8.5s;--dl:.4s}',
 '#youtube{--d:9.75s;--dl:-4.5s}':'#youtube{--d:9.75s;--dl:1.2s}',
 '#mensaje{--d:9s;--dl:-3s}':'#mensaje{--d:9s;--dl:2s}',
 '.chip[data-s="work"]{--d:8s;--dl:-0.8s}':'.chip[data-s="work"]{--d:8s;--dl:.2s}',
 '.chip[data-s="personal"]{--d:9s;--dl:-2.25s}':'.chip[data-s="personal"]{--d:9s;--dl:.8s}',
 '.chip[data-s="free"]{--d:10.5s;--dl:-3.75s}':'.chip[data-s="free"]{--d:10.5s;--dl:1.4s}',
 '.chip[data-s="eat"]{--d:8.5s;--dl:-5.5s}':'.chip[data-s="eat"]{--d:8.5s;--dl:1.8s}',
 '.chip[data-s="meet"]{--d:9.75s;--dl:-6.75s}':'.chip[data-s="meet"]{--d:9.75s;--dl:2s}',
}
for viejo in RETARDOS: una_vez(s, viejo)

# ---------- anclas de la Capa D ----------
una_vez(s, '</style>'); una_vez(s, '<script>')
assert len(re.findall(r'<form id="contacto">.*?</form>', s, re.S)) == 1, 'No encuentro el <form id="contacto">'
assert len(re.findall(r'/\* ===== formulario:.*?(?=</script>)', s, re.S)) == 1, 'No encuentro el bloque JS del formulario'
for i in ('spotify', 'youtube', 'mensaje'):
    una_vez(s, f'<article class="card blurable" id="{i}">')

# El anillo de foco del chip YA esta en el archivo (aplicado aparte).
# Si se añade aqui otra vez, :has(input:focus-visible) aparece dos veces.
una_vez(s, '.chip:has(input:focus-visible)>.chip__box{outline:2px solid var(--st);outline-offset:3px}')
print('  anillo de foco ya presente: se conserva, no se duplica')

shutil.copy(ruta, ruta + '.bak')
for viejo, nuevo in RETARDOS.items(): s = s.replace(viejo, nuevo)

# ---------- 2. contenedor estable: las 3 tarjetas se envuelven en .hold ----------
s = re.sub(r'(<article class="card blurable" id="(?:spotify|youtube|mensaje)">.*?</article>)',
           lambda m: '<div class="hold">' + m.group(1) + '</div>', s, flags=re.S)

# ---------- 3. CSS ----------
CSS = r'''
/* ===== CAPA C (correccion): el hover lo detecta una caja que NO se mueve ===== */
.hold{display:block}
.hold>.blurable{pointer-events:none}          /* la tarjeta en movimiento no recibe el hover */
.hold>.blurable *{pointer-events:auto}        /* pero sus campos y enlaces siguen funcionando */
.hold:hover>.blurable,.hold:focus-within>.blurable{
  filter:none;opacity:1;box-shadow:0 0 0 transparent;border-color:var(--line);animation:none}

/* ===== CAPA D: formulario ===== */
.field-err{color:#ff7a85;font-size:11px}
.field-err:empty{display:none}
input[aria-invalid="true"],textarea[aria-invalid="true"]{border-color:#ff5a67}
.form-err{font:12px var(--mono);color:#ff9aa3;background:#3a1218;border:1px solid #ff5a6755;border-radius:10px;padding:10px 12px}
button.send:disabled{opacity:.6;cursor:progress}
.hp{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}

/* ===== CAPA D: vistas legales ===== */
dialog{background:var(--panel);color:var(--text);border:1px solid var(--line);border-radius:var(--r-card);
  padding:0;width:min(640px,92vw);margin:auto}
dialog::backdrop{background:rgba(3,6,16,.75)}
.dlg{padding:24px;max-height:82vh;overflow:auto}
dialog h2{font-size:18px;font-weight:600;margin-bottom:4px}
dialog h3{font-size:13px;margin:16px 0 4px;color:#9fc0ff}
dialog p,dialog li{font-size:13px;line-height:1.55}
dialog ul{padding-left:18px}
.dlg-note{background:var(--warn-bg);color:var(--warn-fg);border-radius:10px;padding:10px 12px;font-size:12px;margin:10px 0 4px}
.dlg-close{margin-top:18px;font:600 13px var(--sans);color:#fff;background:var(--accent);border:0;border-radius:10px;padding:10px 18px;cursor:pointer}
'''
s = s.replace('</style>', CSS + '</style>', 1)

# ---------- 4. formulario con estados ----------
FORM = r'''<form id="contacto" novalidate>
        <label>Nombre completo<input name="nombre" autocomplete="name" maxlength="80" required aria-describedby="e-nombre"><span class="field-err" id="e-nombre" role="alert"></span></label>
        <label>Teléfono<input name="telefono" type="tel" inputmode="tel" autocomplete="tel" maxlength="20" required aria-describedby="e-telefono"><span class="field-err" id="e-telefono" role="alert"></span></label>
        <label>Correo electrónico<input name="correo" type="email" autocomplete="email" maxlength="120" required aria-describedby="e-correo"><span class="field-err" id="e-correo" role="alert"></span></label>
        <label>Mensaje<textarea name="mensaje" maxlength="600" required aria-describedby="e-mensaje"></textarea><span class="field-err" id="e-mensaje" role="alert"></span></label>
        <div class="hp" aria-hidden="true"><input name="web" tabindex="-1" autocomplete="off"></div>
        <label class="consent"><input type="checkbox" name="consentimiento" required aria-describedby="e-consentimiento">
          <span>Acepto el <a href="#aviso">Aviso de privacidad</a> y el tratamiento de mis datos para recibir respuesta.</span></label>
        <span class="field-err" id="e-consentimiento" role="alert"></span>
        <button class="send" type="submit">Enviar mensaje</button>
        <p class="form-ok" id="ok" role="status" hidden></p>
        <p class="form-err" id="fallo" role="alert" hidden></p>
      </form>'''
s = re.sub(r'<form id="contacto">.*?</form>', lambda m: FORM, s, count=1, flags=re.S)

# ---------- 5. vistas legales (BORRADOR de estructura) ----------
LEGAL = r'''<dialog id="aviso" aria-labelledby="t-aviso"><div class="dlg">
  <h2 id="t-aviso">Aviso de privacidad</h2>
  <p class="dlg-note">BORRADOR de estructura. No es texto legal definitivo: debe revisarlo un abogado antes de publicar.</p>
  <h3>Responsable</h3><p>[NOMBRE COMPLETO], con domicilio en [DOMICILIO] y correo [CORREO], es responsable del tratamiento de tus datos personales.</p>
  <h3>Datos que se recaban</h3><ul><li>Nombre, teléfono y correo electrónico.</li><li>El contenido del mensaje que escribas.</li></ul>
  <h3>Finalidad</h3><p>Recibir tu mensaje y poder responderte. No se usan para publicidad ni se venden.</p>
  <h3>Transferencia a terceros</h3><p>Tu mensaje se entrega mediante Telegram, un servicio de un tercero con servidores fuera de México. [REVISAR cómo debe declararse.]</p>
  <h3>Conservación</h3><p>[DEFINIR por cuánto tiempo se conservan los mensajes.]</p>
  <h3>Derechos ARCO y revocación</h3><p>Puedes acceder, rectificar, cancelar u oponerte al tratamiento, y revocar tu consentimiento, escribiendo a [CORREO]. [REVISAR el procedimiento y los plazos que marca la ley vigente.]</p>
  <h3>Cambios al aviso</h3><p>Los cambios se publicarán en esta página. Última actualización: [FECHA].</p>
  <button class="dlg-close" data-cerrar>Cerrar</button></div></dialog>
<dialog id="terminos" aria-labelledby="t-terminos"><div class="dlg">
  <h2 id="t-terminos">Términos y condiciones</h2>
  <p class="dlg-note">BORRADOR de estructura. No es texto legal definitivo: debe revisarlo un abogado antes de publicar.</p>
  <h3>Qué es este sitio</h3><p>Una página personal que muestra mi estado, mi ticket en curso y mi actividad pública.</p>
  <h3>Información mostrada</h3><p>Los datos de estado, música, video y commits se muestran con fines informativos y pueden no estar actualizados.</p>
  <h3>Uso del formulario</h3><p>No envíes datos sensibles ni contenido ilegal, ofensivo o publicitario. Puedo ignorar o bloquear mensajes abusivos.</p>
  <h3>Propiedad y enlaces</h3><p>[DEFINIR propiedad del contenido y responsabilidad por enlaces a terceros.]</p>
  <h3>Cambios y contacto</h3><p>Puedo modificar estos términos. Contacto: [CORREO]. Última actualización: [FECHA].</p>
  <button class="dlg-close" data-cerrar>Cerrar</button></div></dialog>

'''
s = s.replace('<script>', LEGAL + '<script>', 1)

# ---------- 6. JS: estados del formulario + apertura de vistas legales ----------
JS = r'''/* ===== formulario (Capa D): vacio -> invalido -> enviando -> enviado | error ===== */
const form = $('contacto');
const REGLAS = {
  nombre:         (v) => v.trim().length >= 3 || 'Escribe tu nombre completo.',
  telefono:       (v) => (/^[+()\d\s-]+$/.test(v) && v.replace(/\D/g, '').length >= 10) || 'Escribe un teléfono válido (10 dígitos o más).',
  correo:         (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) || 'Escribe un correo válido.',
  mensaje:        (v) => v.trim().length >= 10 || 'El mensaje es muy corto (mínimo 10 caracteres).',
  consentimiento: (v, el) => el.checked || 'Debes aceptar el Aviso de privacidad para enviar.'
};
const marcar = (n, texto) => {
  $('e-' + n).textContent = texto;
  form.elements[n].setAttribute('aria-invalid', String(!!texto));
};
form.addEventListener('input', e => { if (e.target.name in REGLAS) marcar(e.target.name, ''); });

/* SIMULADO hasta tener backend. El token del bot de Telegram NO puede ir aqui: lo leeria cualquiera. */
const SIMULAR = 'ok';   // 'ok' | 'error' para probar los dos estados finales
const enviarMensaje = (datos) => new Promise((ok, fallo) =>
  setTimeout(() => SIMULAR === 'ok' ? ok() : fallo(new Error('simulado')), 900));

form.addEventListener('submit', async e => {
  e.preventDefault();
  $('ok').hidden = $('fallo').hidden = true;
  let primero = null;
  for (const n in REGLAS) {
    const el = form.elements[n], r = REGLAS[n](el.value, el);
    marcar(n, r === true ? '' : r);
    if (r !== true && !primero) primero = el;
  }
  if (primero) { primero.focus(); return; }          // estado: invalido
  if (form.elements.web.value) {                     // trampa anti-bots: se ignora sin avisar
    console.warn('envio descartado: campo trampaia relleno');
    return;
  }
  const boton = form.querySelector('.send');
  boton.disabled = true; boton.textContent = 'Enviando…';   // estado: enviando
  try {
    await enviarMensaje(Object.fromEntries(new FormData(form)));
    $('ok').textContent = 'Mensaje enviado. Gracias, te respondo en cuanto pueda.';   // estado: enviado
    $('ok').hidden = false; form.reset();
  } catch {
    $('fallo').textContent = 'No se pudo enviar. Inténtalo de nuevo o escríbeme al correo del pie de página.';   // estado: error
    $('fallo').hidden = false;
  } finally {
    boton.disabled = false; boton.textContent = 'Enviar mensaje';
  }
});

/* ===== vistas legales ===== */
document.addEventListener('click', e => {
  const a = e.target.closest('a[href="#aviso"],a[href="#terminos"]');
  if (a) { e.preventDefault(); $(a.hash.slice(1)).showModal(); }
});
document.querySelectorAll('dialog').forEach(d => d.addEventListener('click', e => {
  if (e.target === d || e.target.closest('[data-cerrar]')) d.close();
}));
'''
s = re.sub(r'/\* ===== formulario:.*?(?=</script>)', lambda m: JS, s, count=1, flags=re.S)

open(ruta, 'w', encoding='utf-8').write(s)
print('Listo. Copia de seguridad en', ruta + '.bak')