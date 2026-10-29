/* Utilidades compartidas (espacio de nombres global TCG) */
window.TCG = window.TCG || {};
(function (T) {
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const h = (tag, props, ...kids) => {
  const e = document.createElement(tag);
  if (props) for (const k in props) {
    const v = props[k];
    if (k === 'class') e.className = v;
    else if (k === 'style') e.style.cssText = v;
    else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), v);
    else if (v === true) e.setAttribute(k, '');
    else if (v !== false && v != null) e.setAttribute(k, v);
  }
  for (const c of kids.flat()) { if (c == null || c === false) continue; e.append(c.nodeType ? c : document.createTextNode(String(c))); }
  return e;
};
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = t => t * t * (3 - 2 * t);
const PI = Math.PI, DPR = Math.min(window.devicePixelRatio || 1, 1.5);
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

/* Sólo http(s), rutas relativas e imágenes raster incrustadas. */
function safeUrl(u) {
  u = typeof u === 'string' ? u.trim() : ''; if (!u || u.length > 20000000) return '';
  try {
    const x = new URL(u, location.href);
    if (x.protocol === 'http:' || x.protocol === 'https:')
      return /^[a-z][a-z\d+.-]*:/i.test(u) || u.startsWith('//') ? x.href : u;
    if (!/^[a-z][a-z\d+.-]*:/i.test(u) && !u.startsWith('//')) return u;
    if (x.protocol === 'data:' && /^data:image\/(?:jpeg|png|gif|webp|avif|bmp);base64,/i.test(u)) return u;
  } catch (e) {}
  return '';
}
function mkImg(src, fit) {
  const u = safeUrl(src);
  const i = h('img', { alt: '', draggable: false, decoding: 'async', referrerpolicy: 'no-referrer' });
  if (fit === 'contain') i.className = 'contain';
  if (u) i.src = u;
  i.addEventListener('error', () => { i.style.visibility = 'hidden'; i.parentElement && i.parentElement.classList.add('noimg'); });
  if (!u) queueMicrotask(() => i.parentElement && i.parentElement.classList.add('noimg'));
  return i;
}

let toastEl = null, toastT = 0;
function toast(t) {
  if (toastEl) toastEl.remove();
  toastEl = h('div', { style: 'position:fixed;left:50%;bottom:26px;transform:translateX(-50%);z-index:90;background:var(--panel1);border:1px solid rgba(var(--acc-rgb),.4);color:var(--acc2);padding:.8em 1.4em;border-radius:99px;font-size:14px;letter-spacing:.03em;box-shadow:0 14px 40px var(--sh2);max-width:92vw;text-align:center' }, t);
  document.body.append(toastEl); clearTimeout(toastT); toastT = setTimeout(() => toastEl && toastEl.remove(), 4200);
}
function modal({ title, body, actions, wide }) {
  const bg = h('div', { class: 'modalbg', onpointerdown: e => { if (e.target === bg && !wide) close(); } });
  const box = h('div', { class: 'modal', style: wide ? '--mw:760px' : '' }, h('h2', null, title), ...[].concat(body || []), h('div', { class: 'row' }, ...[].concat(actions || [])));
  bg.append(box); document.body.append(bg);
  const close = () => { bg.remove(); };
  return { close, el: box };
}
function closeModals() { document.querySelectorAll('.modalbg').forEach(m => m.remove()); }
function download(name, text, type) {
  const blob = new Blob([text], { type: type || 'application/json;charset=utf-8' });
  const a = h('a', { href: URL.createObjectURL(blob), download: name });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  return blob.size;
}
Object.assign(T, { $, h, clamp, lerp, smooth, PI, DPR, uid, safeUrl, mkImg, toast, modal, closeModals, download });
})(window.TCG);
