/* Modo administrador: acceso (Ctrl+Shift+A), barra, editor de obras, ajustes, respaldo y restauración.
   Nada de esto existe en el DOM para el público: se crea sólo tras iniciar sesión. */
(function (T) {
'use strict';
const { $, h, clamp, toast, modal, closeModals, mkImg, safeUrl, hex, unhex, hashPw, legacyHashPw, nextTick, sameStr } = T;
let bar = null, pubBtn = null;

const icon = d => { const s = h('span', { style: 'display:contents' }); s.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`; return s.firstChild; };
const ICO_RESPALDO = '<path d="M4 6.500h16V10H4zM5.500 10v8.500h13V10"/><path d="M12 12.300v4.600M9.800 14.800l2.200 2.200 2.200-2.200"/>';
const ICO_RESTAURAR = '<path d="M4 12a8 8 0 1 0 2.700-6"/><path d="M4 4v4.600h4.600"/><path d="M12 8v4.500l3 1.800"/>';
const ICO_DATOS = '<ellipse cx="12" cy="6" rx="7" ry="2.600"/><path d="M5 6v6c0 1.400 3.100 2.600 7 2.600s7-1.200 7-2.600V6"/><path d="M5 12v6c0 1.400 3.100 2.600 7 2.600s7-1.200 7-2.600v-6"/>';
const ICO_CARET = '<path d="M6 9.500l6 6 6-6"/>';

/* Un solo icono (RESPALDO / RESTAURACIÓN) que despliega RESPALDAR o RESTAURAR */
let menu = null, menuBtn = null;
function closeMenu() { if (menu) { menu.remove(); menu = null; } if (menuBtn) menuBtn.setAttribute('aria-expanded', 'false'); }
function toggleMenu() {
  if (menu) { closeMenu(); return; }
  const item = (label, ico, sub, fn) => h('button', { type: 'button', role: 'menuitem', onclick: () => { closeMenu(); fn(); } }, icon(ico), h('span', null, h('strong', null, label), h('small', null, sub)));
  menu = h('div', { class: 'pop', role: 'menu' },
    item('RESPALDAR', ICO_RESPALDO, 'Descarga un archivo con todas tus obras', T.respaldar),
    item('RESTAURAR', ICO_RESTAURAR, 'Carga un respaldo y reemplaza la galería', T.restaurar));
  document.body.append(menu); menuBtn.setAttribute('aria-expanded', 'true');
  const r = menuBtn.getBoundingClientRect(), w = menu.offsetWidth;
  menu.style.top = (r.bottom + 8) + 'px'; menu.style.left = clamp(r.left + r.width / 2 - w / 2, 8, innerWidth - w - 8) + 'px';
}
addEventListener('pointerdown', e => { if (menu && !menu.contains(e.target) && !(menuBtn && menuBtn.contains(e.target))) closeMenu(); }, true);
addEventListener('keydown', e => { if (e.key === 'Escape' && menu) { e.stopPropagation(); closeMenu(); } }, true);
addEventListener('resize', closeMenu);

/* ---------- sesión ---------- */
function enterAdmin() { T.admin = true; try { sessionStorage.setItem(T.SS, '1'); } catch (e) {} buildBar(); T.render(); }
function exitAdmin() { closeMenu(); T.admin = false; try { sessionStorage.removeItem(T.SS); } catch (e) {} if (bar) { bar.remove(); bar = null; } document.body.classList.remove('is-admin'); closeModals(); T.render(); }
function buildBar() {
  if (bar) bar.remove(); document.body.classList.add('is-admin');
  menuBtn = h('button', { class: 'btn ibtn only', type: 'button', title: 'Respaldo y restauración', 'aria-label': 'Respaldo y restauración', 'aria-haspopup': 'menu', 'aria-expanded': 'false', onclick: toggleMenu }, icon(ICO_DATOS), icon(ICO_CARET));
  pubBtn = h('button', { class: 'btn' + (T.sinPublicar() ? ' pend' : ''), title: 'Descarga data/obras.json para publicar los cambios', onclick: T.publicar }, 'PUBLICAR');
  bar = h('div', { class: 'abar' },
    h('span', { class: 'lbl' }, h('i'), h('em', null, 'MODO ADMINISTRADOR')),
    h('button', { class: 'btn main', onclick: () => editor(null) }, 'SUBIR OBRA'),
    h('button', { class: 'btn', onclick: settings }, 'AJUSTES'),
    h('span', { class: 'sep' }),
    menuBtn,
    h('span', { class: 'sep' }),
    pubBtn,
    h('button', { class: 'btn', onclick: exitAdmin }, 'SALIR'));
  document.body.append(bar);
}
T.onPersist = () => { if (pubBtn) pubBtn.classList.toggle('pend', T.sinPublicar()); };

let fails = 0, lockUntil = 0;
function promptLogin() {
  closeModals();
  const setup = !T.DB.auth;
  const pw = h('input', { type: 'password', autocomplete: 'new-password', minlength: setup ? '12' : null, placeholder: setup ? 'Nueva contraseña (mín. 12 caracteres)' : 'Contraseña' });
  const pw2 = setup ? h('input', { type: 'password', autocomplete: 'new-password', minlength: '12', placeholder: 'Repite la contraseña' }) : null;
  const msg = h('p', { class: 'msg' }); const go = h('button', { class: 'btn main' }, setup ? 'CREAR Y ENTRAR' : 'ENTRAR');
  const updateSetupMessage = () => {
    if (!setup || !pw.value || msg.classList.contains('ok')) return;
    if (!window.isSecureContext || !window.crypto || !window.crypto.subtle) {
      msg.textContent = 'Para crear la contraseña, abre el sitio mediante HTTPS o localhost.';
      return;
    }
    msg.textContent = pw.value.length < 12 ? 'La contraseña debe tener al menos 12 caracteres.' : pw2.value && pw.value !== pw2.value ? 'Las contraseñas no coinciden.' : '';
  };
  if (setup) {
    pw.addEventListener('input', updateSetupMessage);
    pw2.addEventListener('input', updateSetupMessage);
    if (!window.isSecureContext || !window.crypto || !window.crypto.subtle) {
      msg.textContent = 'Para crear la contraseña, abre el sitio mediante HTTPS o localhost.';
    }
  }
  const run = async () => {
    msg.className = 'msg'; msg.textContent = '';
    if (Date.now() < lockUntil) { msg.textContent = 'Demasiados intentos. Espera ' + Math.ceil((lockUntil - Date.now()) / 1000) + ' s.'; return; }
    if (setup) {
      if (!window.isSecureContext || !window.crypto || !window.crypto.subtle) { msg.textContent = 'Para crear la contraseña, abre el sitio mediante HTTPS o localhost.'; return; }
      if (pw.value.length < 12) { msg.textContent = 'Usa al menos 12 caracteres.'; return; }
      if (pw.value !== pw2.value) { msg.textContent = 'Las contraseñas no coinciden.'; return; }
      go.disabled = true; msg.className = 'msg ok'; msg.textContent = 'Protegiendo…'; await nextTick();
      try {
        const salt = T.randomSalt();
        T.DB.auth = { algorithm: 'PBKDF2-SHA256', salt: hex(salt), hash: await hashPw(pw.value, salt), it: T.IT };
        T.persist(); m.close(); enterAdmin();
        toast('Contraseña creada y guardada en este navegador. Conserva un respaldo para recuperarla.');
      } catch (e) { go.disabled = false; msg.className = 'msg'; msg.textContent = e.message || 'No se pudo proteger la contraseña.'; }
      return;
    }
    if (!pw.value) return; go.disabled = true; msg.className = 'msg ok'; msg.textContent = 'Verificando…'; await nextTick();
    try {
      const auth = T.DB.auth, salt = unhex(auth.salt);
      const candidate = auth.algorithm === 'legacy-sha256' ? legacyHashPw(pw.value, salt, auth.it) : await hashPw(pw.value, salt);
      if (sameStr(candidate, auth.hash)) {
        fails = 0;
        if (auth.algorithm === 'legacy-sha256') {
          const newSalt = T.randomSalt();
          T.DB.auth = { algorithm: 'PBKDF2-SHA256', salt: hex(newSalt), hash: await hashPw(pw.value, newSalt), it: T.IT };
          T.persist();
        }
        m.close(); enterAdmin();
      } else {
        fails++; lockUntil = Date.now() + Math.min(30000, fails * fails * 1000); go.disabled = false; msg.className = 'msg'; msg.textContent = 'Contraseña incorrecta.'; pw.value = ''; pw.focus();
      }
    } catch (e) { go.disabled = false; msg.className = 'msg'; msg.textContent = e.message || 'No se pudo verificar la contraseña.'; }
  };
  go.onclick = run; [pw, pw2].forEach(i => i && i.addEventListener('keydown', e => { if (e.key === 'Enter') run(); }));
  const m = modal({ title: setup ? 'Crear contraseña de administrador' : 'Acceso de administrador',
    body: [setup ?     h('p', { class: 'note' }, 'Primera vez: define la contraseña para este navegador. Se guarda sólo su verificador derivado; no se incluye en el JSON público.') : null,
      h('div', { class: 'fld' }, pw), pw2 ? h('div', { class: 'fld' }, pw2) : null, msg],
    actions: [h('button', { class: 'btn', onclick: () => m.close() }, 'CANCELAR'), go] });
  setTimeout(() => pw.focus(), 50);
}
/* Ctrl + Shift + A */
addEventListener('keydown', e => {
  if (e.ctrlKey && e.shiftKey && !e.altKey && e.code === 'KeyA') {
    e.preventDefault(); e.stopPropagation();
    if (T.admin) exitAdmin(); else if ($('.modalbg')) closeModals(); else promptLogin();
  }
}, true);
/* Alternativa para móvil (sin teclado): mantener pulsado el título 1,5 s */
(() => { let t = null; const el = $('#siteTitle'); const on = () => { t = setTimeout(() => { if (!T.admin) promptLogin(); }, 1500); }, off = () => clearTimeout(t);
  el.addEventListener('pointerdown', on); ['pointerup', 'pointerleave', 'pointercancel'].forEach(k => el.addEventListener(k, off)); })();

/* ---------- editor de obras ---------- */
async function fileToData(file) {
  if (!file || !/^image\/(?:jpeg|png|gif|webp|avif|bmp)$/i.test(file.type) || file.size > 15 * 1024 * 1024)
    throw new Error('Usa una imagen JPG, PNG, GIF, WebP, AVIF o BMP de hasta 15 MB.');
  const url = URL.createObjectURL(file);
  try {
    const im = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
    const s = Math.min(1, 1600 / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = Math.round(im.width * s); c.height = Math.round(im.height * s);
    const x = c.getContext('2d'); if (!x) throw new Error('No se pudo procesar la imagen.');
    x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(im, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', .88);
  } finally { URL.revokeObjectURL(url); }
}
function editor(orig) {
  if (!T.admin) return;
  const isNew = !orig;
  const m = Object.assign({ id: T.uid(), title: '', desc: '', img: '', year: '', paper: '', cats: [], techs: [], palette: [], file: '', num: '', dim: '', kb: 0, insignia: 'normal', premium: false, fit: 'cover', created: Date.now() }, orig || {});
  m.cats = [...(m.cats || [])]; m.techs = [...(m.techs || [])]; m.palette = [...(m.palette || [])];
  let palT = 0, palTok = 0; const palBox = h('div', { class: 'palprev' }), palMsg = h('p', { class: 'note', style: 'margin:6px 0 0' });
  let pvT = 0; const pv = h('div', { class: 'pvbox' });
  const refresh = () => { clearTimeout(pvT); pvT = setTimeout(() => { pv.replaceChildren(T.cardEl(m, true).persp); }, 250); };
  const msg = h('p', { class: 'msg' });
  /* datos del archivo (nombre, n.º de dibujo, dimensiones, tamaño, copyright): automáticos, sin campos en el editor */
  const infoUpd = () => {};
  const urlField = (label, key, ph) => {
    const inp = h('input', { type: 'text', placeholder: ph, autocomplete: 'off', spellcheck: 'false' });
    const sync = () => { inp.value = m[key].startsWith('data:') ? '[archivo local incrustado]' : m[key]; }; sync();
    inp.addEventListener('input', () => { m[key] = inp.value.trim(); refresh(); if (key === 'img') { m.file = ''; calcPalSoon(); } });
    inp.addEventListener('focus', () => { if (m[key].startsWith('data:')) inp.select(); });
    const fi = h('input', { type: 'file', accept: 'image/*', style: 'display:none' });
    fi.addEventListener('change', async () => { const f = fi.files[0]; if (!f) return; try { m[key] = await fileToData(f); if (key === 'img') m.file = f.name.slice(0, 160); sync(); refresh(); msg.textContent = ''; if (key === 'img') calcPal(); } catch (e) { msg.textContent = 'No se pudo leer ese archivo.'; } fi.value = ''; });
    return h('div', { class: 'fld' }, h('label', null, label), h('div', { class: 'inl' }, inp, h('button', { class: 'btn', type: 'button', onclick: () => fi.click() }, 'ARCHIVO'), fi));
  };
  const chipField = (label, key, options, single) => {
    const wrap = h('div', { class: 'chips' });
    const get = () => single ? (m[key] ? [m[key]] : []) : m[key];
    const draw = () => wrap.replaceChildren(...[...new Set([...options, ...get()])].map(o => {
      const on = get().includes(o);
      return T.tag(o, { tag: 'button', cls: 'chip plate' + (on ? ' on' : ''), deco: 'plate', check: true, attrs: { type: 'button', 'aria-pressed': String(on) }, onclick: () => {
        if (single) m[key] = on ? '' : o; else m[key] = on ? m[key].filter(x => x !== o) : [...m[key], o]; draw();
      } });
    }));
    draw(); return h('div', { class: 'fld' }, h('label', null, label), wrap);
  };
  const drawPal = () => palBox.replaceChildren(m.palette.length ? T.paletaBar(m.palette) : h('div', { class: 'palempty' }, 'SIN PALETA'));
  const calcPal = async () => {
    const tok = ++palTok; palMsg.textContent = '';
    if (!safeUrl(m.img)) { m.palette = []; drawPal(); return; }
    palMsg.textContent = 'Calculando paleta…';
    const r = await T.extraerPaleta(m.img); if (tok !== palTok) return;
    if (r && r.length) { m.palette = r; palMsg.textContent = ''; } else { m.palette = []; palMsg.textContent = 'No se pudo leer la paleta: la imagen es de otro sitio y no lo permite. Cópiala a la carpeta img/ o usa el botón ARCHIVO.'; }
    drawPal();
  };
  const calcPalSoon = () => { clearTimeout(palT); palT = setTimeout(calcPal, 500); };
  drawPal();
  const year = h('input', { type: 'text', inputmode: 'numeric', maxlength: '12', placeholder: 'Ej. 2025', value: m.year, autocomplete: 'off' }); year.addEventListener('input', () => { m.year = year.value.trim(); });
  const title = h('input', { type: 'text', placeholder: 'Nombre de la obra', value: m.title, autocomplete: 'off' }); title.addEventListener('input', () => { m.title = title.value; });
  const desc = h('textarea', { placeholder: 'Técnica, año, notas… (opcional)' }); desc.value = m.desc; desc.addEventListener('input', () => { m.desc = desc.value; });
  /* insignia: estándar (normal) o dorada */
  const insig = h('div', { class: 'insgs', role: 'radiogroup', 'aria-label': 'Insignia' });
  const drawInsig = () => insig.replaceChildren(...[['normal', 'Insignia estándar'], ['dorada', 'Insignia dorada']].map(([k, nm]) => {
    const on = (m.insignia || 'normal') === k;
    return h('button', { type: 'button', class: 'insg' + (on ? ' on' : ''), role: 'radio', 'aria-checked': String(on), title: nm, 'aria-label': nm, onclick: () => { m.insignia = k; drawInsig(); refresh(); } }, T.insignia(k));
  }));
  drawInsig();
  const prem = h('input', { type: 'checkbox' }); prem.checked = !!m.premium; prem.addEventListener('change', () => { m.premium = prem.checked; refresh(); });
  const sw = h('label', { class: 'sw' }, prem, h('span', { class: 'tr' }), h('span', { class: 't' }, 'HABILITAR TCG PREMIUM'));
  const save = h('button', { class: 'btn main', onclick: async () => {
    clearTimeout(palT); if (!m.palette.length && safeUrl(m.img)) await calcPal();
    if (safeUrl(m.img)) { const r = await T.infoImg(m); m.dim = r.dim || m.dim; m.kb = r.bytes ? Math.max(1, Math.round(r.bytes / 1024)) : m.kb; if (!m.file && !m.img.startsWith('data:')) m.file = T.fileOf(m); }
    if (!m.num) m.num = T.nextNum(); m.copy = '';
    m.title = title.value.trim(); m.desc = desc.value.trim();
    if (!safeUrl(m.img)) { msg.textContent = 'Indica una URL de imagen válida (https://… o img/archivo.jpg) o sube un archivo.'; return; }
    if (isNew) T.DB.works.push(m); else { const i = T.DB.works.findIndex(x => x.id === orig.id); if (i >= 0) T.DB.works[i] = m; }
    T.persist(); md.close(); T.render(); toast(isNew ? 'Obra añadida a tu galería.' : 'Cambios guardados.');
  } }, isNew ? 'SUBIR OBRA' : 'GUARDAR');
  const exp = h('button', { class: 'btn', type: 'button', title: 'Descargar la carta: FRENTE y ATRÁS en PNG' }, 'EXPORTAR');
  exp.onclick = async () => {
    m.title = title.value.trim(); m.desc = desc.value.trim();
    if (!safeUrl(m.img)) { msg.className = 'msg'; msg.textContent = 'Primero indica la imagen de la obra.'; return; }
    exp.disabled = true; exp.textContent = 'EXPORTANDO…'; msg.textContent = '';
    try { await T.exportarCarta(m, isNew); toast('Se descargaron FRENTE y ATRÁS (PNG).'); }
    catch (e) { msg.className = 'msg'; msg.textContent = 'No se pudo exportar: la imagen es de otro sitio y no lo permite. Cópiala a la carpeta img/ o súbela con el botón ARCHIVO.'; }
    exp.disabled = false; exp.textContent = 'EXPORTAR';
  };
  const acts = [h('button', { class: 'btn', onclick: () => md.close() }, 'CANCELAR'), exp, save];
  if (!isNew) {
    let armed = false;
    const del = h('button', { class: 'btn danger sp', onclick: () => {
      if (!armed) { armed = true; del.classList.add('arm'); del.textContent = 'CONFIRMAR ELIMINAR'; setTimeout(() => { armed = false; del.classList.remove('arm'); del.textContent = 'ELIMINAR'; }, 3500); return; }
      T.DB.works = T.DB.works.filter(x => x.id !== orig.id); T.persist(); md.close(); T.render(); toast('Obra eliminada.');
    } }, 'ELIMINAR');
    acts.unshift(del);
  }
  const pDatos = h('div', { class: 'tabp' }, h('div', { class: 'row2 r-ty' }, h('div', { class: 'fld' }, h('label', null, 'TÍTULO'), title), h('div', { class: 'fld' }, h('label', null, 'AÑO'), year)), h('div', { class: 'fld' }, h('label', null, 'DESCRIPCIÓN'), desc),
      urlField('URL DE IMAGEN', 'img', 'https://…/mi-boceto.jpg  ·  o  img/mi-boceto.jpg'),
      h('div', { class: 'fld' }, h('label', null, 'PALETA DE COLORES'), palBox, palMsg, h('button', { class: 'btn mini', type: 'button', onclick: calcPal }, 'RECALCULAR')),
      h('div', { class: 'row2' }, h('div', { class: 'fld' }, h('label', null, 'INSIGNIA'), insig), h('div', { class: 'fld' }, h('label', null, '\u00a0'), sw)));
  const pMat = h('div', { class: 'tabp' }, chipField('PAPEL', 'paper', T.OPC.papel, true), chipField('CATEGORÍA', 'cats', T.OPC.categoria, false), chipField('TÉCNICAS', 'techs', T.OPC.tecnicas, false));
  const tabs = [['DATOS', pDatos], ['MATERIALES', pMat]].map(([n, pn], i) => { const b = h('button', { type: 'button', class: 'tab', role: 'tab' }, n); b.onclick = () => sel(i); b._p = pn; return b; });
  const sel = i => tabs.forEach((b, j) => { b.classList.toggle('on', i === j); b.setAttribute('aria-selected', String(i === j)); b._p.classList.toggle('off', i !== j); }); sel(0);
  const md = modal({ title: isNew ? 'Subir obra' : 'Editar obra', wide: true,
    body: [h('div', { class: 'edgrid' },
      h('div', null, h('div', { class: 'tabs', role: 'tablist' }, ...tabs), h('div', { class: 'tabstack' }, pDatos, pMat), msg),
      h('div', { class: 'pvcol' }, pv, h('small', null, 'VISTA PREVIA')))],
    actions: acts });
  pv.replaceChildren(T.cardEl(m, true).persp);
  if (!m.palette.length && safeUrl(m.img)) calcPal();
}
function settings() {
  const t = h('input', { type: 'text', value: T.DB.site.title, autocomplete: 'off' }), s = h('input', { type: 'text', value: T.DB.site.sub || '', autocomplete: 'off' });
  const p1 = h('input', { type: 'password', placeholder: 'Nueva contraseña (opcional)', autocomplete: 'new-password' }), p2 = h('input', { type: 'password', placeholder: 'Repite la nueva contraseña', autocomplete: 'new-password' });
  const cp = h('input', { type: 'text', value: T.DB.site.copy || '', maxlength: '200', autocomplete: 'off', placeholder: '© {AÑO} CARL ART SKETCH. Todos los derechos reservados.' });
  const msg = h('p', { class: 'msg' });
  const ok = h('button', { class: 'btn main', onclick: async () => {
    if (p1.value || p2.value) {
      if (p1.value.length < 12) { msg.textContent = 'La contraseña debe tener 12 caracteres o más.'; return; }
      if (p1.value !== p2.value) { msg.textContent = 'Las contraseñas no coinciden.'; return; }
      ok.disabled = true; msg.className = 'msg ok'; msg.textContent = 'Protegiendo…'; await nextTick();
      try {
        const salt = T.randomSalt();
        T.DB.auth = { algorithm: 'PBKDF2-SHA256', salt: hex(salt), hash: await hashPw(p1.value, salt), it: T.IT };
      } catch (e) { ok.disabled = false; msg.className = 'msg'; msg.textContent = e.message || 'No se pudo proteger la contraseña.'; return; }
    }
    T.DB.site.title = t.value.trim() || 'CARL ART SKETCHES'; T.DB.site.sub = s.value.trim(); T.DB.site.copy = cp.value.trim(); T.persist(); md.close(); T.render(); toast('Ajustes guardados.');
  } }, 'GUARDAR');
  const md = modal({ title: 'Ajustes del sitio', body: [h('div', { class: 'fld' }, h('label', null, 'TÍTULO DEL SITIO'), t), h('div', { class: 'fld' }, h('label', null, 'SUBTÍTULO'), s), h('div', { class: 'fld' }, h('label', null, 'COPYRIGHT (PREDETERMINADO)'), cp),
    h('div', { class: 'fld' }, h('label', null, 'CAMBIAR CONTRASEÑA'), p1, h('div', { style: 'height:8px' }), p2), msg], actions: [h('button', { class: 'btn', onclick: () => md.close() }, 'CANCELAR'), ok] });
}

T.editor = editor; T.promptLogin = promptLogin; T.buildBar = buildBar; T.exitAdmin = exitAdmin;
})(window.TCG);
