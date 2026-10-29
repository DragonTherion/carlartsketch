/* Datos del archivo de la imagen: nombre, número de dibujo, dimensiones, tamaño y copyright */
(function (T) {
'use strict';
const cache = new Map();
const pad = n => String(n).padStart(3, '0');

T.fileOf = w => {
  if (w.file) return w.file;
  const u = String(w.img || ''); if (!u) return '—'; if (u.startsWith('data:')) return 'imagen-local';
  try { const p = new URL(u, location.href).pathname.split('/').pop(); return decodeURIComponent(p) || '—'; } catch (e) { return u.split(/[?#]/)[0].split('/').pop() || '—'; }
};
T.numOf = w => {
  if (w.num) return w.num;
  const all = [...T.DB.works].sort((a, b) => a.created - b.created), i = all.findIndex(x => x.id === w.id);
  return 'N.º ' + pad(i >= 0 ? i + 1 : all.length + 1);
};
T.copyOf = w => {
  const y = w.year || new Date(w.created || Date.now()).getFullYear();
  return String(T.DB.site.copy || '© {AÑO} CARL ART SKETCH. Todos los derechos reservados.').replace(/\{AÑO\}/g, y);
};
T.nextNum = () => { const mx = Math.max(0, ...T.DB.works.map(x => parseInt(String(x.num || '').replace(/\D/g, ''), 10) || 0), T.DB.works.length); return 'N.º ' + pad(mx + 1); };
T.fmtKb = b => b > 0 ? (b < 102400 ? (b / 1024).toFixed(1) : Math.round(b / 1024)) + ' kb' : '—';
T.fmtDim = d => d || '—';

/* Calcula dimensiones (px) y peso (bytes) de la imagen. Devuelve { dim, bytes } (null si no se puede leer). */
T.infoImg = function (w) {
  const src = T.safeUrl(w.img); if (!src) return Promise.resolve({ dim: '', bytes: 0 });
  const key = src.length > 400 ? src.length + src.slice(-60) : src;
  if (cache.has(key)) return cache.get(key);
  const dim = new Promise(res => { const i = new Image(); i.onload = () => res(i.naturalWidth + ' × ' + i.naturalHeight + ' px'); i.onerror = () => res(''); i.src = src; });
  const bytes = (async () => {
    if (src.startsWith('data:')) { const b = src.slice(src.indexOf(',') + 1); return Math.floor(b.length * 3 / 4) - (b.endsWith('==') ? 2 : b.endsWith('=') ? 1 : 0); }
    try { let r = await fetch(src, { method: 'HEAD', referrerPolicy: 'no-referrer' }); const l = r.ok && Number(r.headers.get('content-length')); if (l) return l;
      r = await fetch(src, { referrerPolicy: 'no-referrer' }); return r.ok ? (await r.blob()).size : 0; } catch (e) { return 0; }
  })();
  const p = Promise.all([dim, bytes]).then(([d, b]) => ({ dim: d, bytes: b })); cache.set(key, p); return p;
};
})(window.TCG);
