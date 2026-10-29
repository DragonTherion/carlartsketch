/* Datos: carga de data/obras.json, borrador local, publicación, respaldo y restauración */
(function (T) {
'use strict';
const { h, uid, toast, modal, download } = T;
const LS = 'tcg_gallery_v1', SS = 'tcg_admin_v1';

const base = () => ({ updated: 0, site: { title: 'CARL ART SKETCHES', sub: '', copy: '' }, auth: null, works: [] });

const paletaOk = a => Array.isArray(a) ? a.filter(x => x && /^#[0-9a-f]{6}$/i.test(x.c)).slice(0, 8).map(x => ({ c: x.c.toLowerCase(), p: Math.min(100, Math.max(1, Number(x.p) || 1)) })) : [];
const lista = a => Array.isArray(a) ? a.map(x => String(x).trim().slice(0, 60)).filter(Boolean).slice(0, 12) : [];

/* Valida y limpia cualquier objeto de datos (archivo publicado, borrador o respaldo) */
function normalizar(o) {
  const d = base(); if (!o || typeof o !== 'object') return d;
  d.updated = Number(o.updated) || 0;
  if (o.site && typeof o.site === 'object') {
    if (typeof o.site.title === 'string' && o.site.title.trim() && o.site.title.trim() !== 'ARCHIVO DE BOCETOS') d.site.title = o.site.title.slice(0, 120);
    if (typeof o.site.copy === 'string') d.site.copy = o.site.copy.slice(0, 200);
    if (typeof o.site.sub === 'string' && o.site.sub !== 'Estudios · Bocetos · Obra en proceso') d.site.sub = o.site.sub.slice(0, 200);
  }
  if (o.auth && typeof o.auth.salt === 'string' && /^[0-9a-f]{32}$/.test(o.auth.salt) && typeof o.auth.hash === 'string' && /^[0-9a-f]{64}$/.test(o.auth.hash)) {
    const it = Number(o.auth.it);
    if (o.auth.algorithm === 'PBKDF2-SHA256' && Number.isInteger(it) && it >= 100000 && it <= 1000000)
      d.auth = { algorithm: o.auth.algorithm, salt: o.auth.salt, hash: o.auth.hash, it };
    else if (!o.auth.algorithm && Number.isInteger(it) && it >= 1000 && it <= 100000)
      d.auth = { algorithm: 'legacy-sha256', salt: o.auth.salt, hash: o.auth.hash, it };
  }
  if (Array.isArray(o.works)) d.works = o.works.filter(w => w && typeof w === 'object').map(w => ({
    id: String(w.id || uid()).slice(0, 40),
    title: String(w.title || '').slice(0, 200), desc: String(w.desc || '').slice(0, 2000),
    img: String(w.img || '').slice(0, 20000000),
    year: String(w.year || '').trim().slice(0, 12), paper: String(w.paper || '').trim().slice(0, 120), cats: lista(w.cats), techs: lista(w.techs), palette: paletaOk(w.palette),
    file: String(w.file || '').trim().slice(0, 160), num: String(w.num || '').trim().slice(0, 24), copy: String(w.copy || '').trim().slice(0, 200), dim: String(w.dim || '').slice(0, 30), kb: Math.max(0, Number(w.kb) || 0),
    insignia: w.insignia === 'dorada' ? 'dorada' : 'normal',
    premium: !!w.premium, fit: w.fit === 'contain' ? 'contain' : 'cover',
    created: Number(w.created) || Date.now()
  }));
  return d;
}

/* Opciones de las etiquetas (editables en data/opciones.json; estos valores son el respaldo) */
T.OPC = {
  papel: ['Canson XL Bristol A4 21 x 29,7 cm 160 g', 'Canson XL Mix Media 17,8 x 25,4 cm 160 g'],
  categoria: ['LÁPICES', 'COLORES', 'BOLÍGRAFOS', 'ESTILÓGRAFOS', 'MARCADORES'],
  tecnicas: ['TRAMADO', 'ACHURADO', 'PUNTILLISMO', 'PERSPECTIVA', 'DIFUMADO', 'CLAROSCURO', 'SCUMBLING']
};
T.LS = LS; T.SS = SS; T.normalizar = normalizar;
T.DB = base(); T.pubUpdated = 0; T.admin = false;

/* Carga: data/obras.json (público) y, si es más reciente, el borrador del navegador del administrador */
T.cargar = async function () {
  let pub = null;
  try { const r = await fetch('data/obras.json', { cache: 'no-store' }); if (r.ok) pub = await r.json(); } catch (e) {}
  try {
    const r = await fetch('data/opciones.json', { cache: 'no-store' });
    if (r.ok) { const o = await r.json(); for (const k of ['papel', 'categoria', 'tecnicas']) { const a = lista(o[k]); if (a.length) T.OPC[k] = a; } }
  } catch (e) {}
  let draft = null; try { draft = JSON.parse(localStorage.getItem(LS) || 'null'); } catch (e) {}
  pub = normalizar(pub); draft = draft ? normalizar(draft) : null;
  T.pubUpdated = pub.updated;
  T.DB = (draft && draft.updated >= pub.updated) ? draft : pub;
};

T.persist = function () {
  T.DB.updated = Date.now();
  try { localStorage.setItem(LS, JSON.stringify(T.DB)); } catch (e) { toast('No se pudo guardar el borrador (¿archivos muy pesados?). Usa URLs o la carpeta img/.'); }
  if (T.onPersist) T.onPersist();
};
T.sinPublicar = () => T.DB.updated > T.pubUpdated;

/* PUBLICAR: descarga data/obras.json listo para reemplazar en tu hosting */
T.publicar = function () {
  const publico = { ...T.DB, auth: null };
  const size = download('obras.json', JSON.stringify(publico, null, 1));
  T.pubUpdated = T.DB.updated; if (T.onPersist) T.onPersist();
  toast('obras.json descargado (' + (size / 1048576).toFixed(2) + ' MB). Reemplaza «data/obras.json» en tu sitio.');
};

/* RESPALDO: archivo JSON con todo (obras, ajustes y contraseña cifrada) */
const stamp = () => { const d = new Date(), p = n => String(n).padStart(2, '0'); return d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + '-' + p(d.getHours()) + p(d.getMinutes()); };
T.respaldar = function () {
  const pkg = { formato: 'art-bocetos-respaldo', version: 1, fecha: new Date().toISOString(), datos: T.DB };
  const size = download('Art-BOCETOS-respaldo-' + stamp() + '.json', JSON.stringify(pkg, null, 1));
  toast('Respaldo guardado (' + (size / 1048576).toFixed(2) + ' MB, ' + T.DB.works.length + ' obras). Guárdalo en un lugar seguro.');
};

/* RESTAURACIÓN: carga un respaldo (o un obras.json) y reemplaza la galería actual */
T.restaurar = function () {
  const fi = h('input', { type: 'file', accept: '.json,application/json', style: 'display:none' });
  document.body.append(fi);
  fi.addEventListener('change', async () => {
    const f = fi.files[0]; fi.remove(); if (!f) return;
    if (f.size > 50 * 1024 * 1024) { toast('El respaldo supera el límite de 50 MB.'); return; }
    let src;
    try { src = JSON.parse(await f.text()); } catch (e) { toast('Ese archivo no es un JSON válido.'); return; }
    const raw = src && src.datos ? src.datos : src;
    if (!raw || !Array.isArray(raw.works)) { toast('No parece un respaldo de Art-BOCETOS (no contiene obras).'); return; }
    const nuevo = normalizar(raw);
    const fecha = src.fecha ? new Date(src.fecha).toLocaleString() : 'sin fecha';
    const pre = h('input', { type: 'checkbox' }); pre.checked = true;
    const m = modal({
      title: 'Restaurar respaldo',
      body: [
        h('p', { class: 'note' }, 'Archivo: ' + f.name + ' · ' + fecha),
        h('div', { class: 'stat' }, h('span', null, nuevo.works.length + ' OBRAS EN EL RESPALDO'), h('span', null, T.DB.works.length + ' OBRAS ACTUALES')),
        h('p', { class: 'note' }, 'Esto reemplazará toda la galería actual por el contenido del respaldo.' + (nuevo.auth ? ' La contraseña de administrador pasará a ser la del respaldo.' : ' La contraseña actual se conserva.')),
        h('label', { class: 'chk' }, pre, 'Descargar antes un respaldo de lo que hay ahora')
      ],
      actions: [h('button', { class: 'btn', onclick: () => m.close() }, 'CANCELAR'),
        h('button', { class: 'btn main', onclick: () => {
          if (pre.checked) T.respaldar();
          if (!nuevo.auth) nuevo.auth = T.DB.auth;
          T.DB = nuevo; T.persist(); m.close(); T.render(); toast('Respaldo restaurado: ' + nuevo.works.length + ' obras.');
        } }, 'RESTAURAR')]
    });
  });
  fi.click();
};
})(window.TCG);
