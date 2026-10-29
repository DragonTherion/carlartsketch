/* Etiquetas tipo "tag": cuerpo ancho, hombros en diagonal y cola estrecha (curvas reales en SVG, contorno de 1 px exacto).
   El dibujo se recalcula solo cuando cambia el tamaño de la etiqueta. */
(function (T) {
'use strict';
const { h } = T;
let uid = 0;

/* polígono con esquinas redondeadas (curvas cuadráticas con el vértice como punto de control) */
function roundedPath(pts) {
  const p = pts.filter((q, i) => { const a = pts[(i + pts.length - 1) % pts.length]; return Math.hypot(q.x - a.x, q.y - a.y) > .01; });
  const n = p.length; let d = '';
  for (let i = 0; i < n; i++) {
    const c = p[i], a = p[(i + n - 1) % n], b = p[(i + 1) % n];
    const v1 = { x: a.x - c.x, y: a.y - c.y }, v2 = { x: b.x - c.x, y: b.y - c.y };
    const l1 = Math.hypot(v1.x, v1.y), l2 = Math.hypot(v2.x, v2.y), r = Math.min(c.r, l1 / 2, l2 / 2);
    const s = { x: c.x + v1.x / l1 * r, y: c.y + v1.y / l1 * r }, e = { x: c.x + v2.x / l2 * r, y: c.y + v2.y / l2 * r };
    d += (i ? 'L' : 'M') + s.x.toFixed(2) + ' ' + s.y.toFixed(2) + 'Q' + c.x.toFixed(2) + ' ' + c.y.toFixed(2) + ' ' + e.x.toFixed(2) + ' ' + e.y.toFixed(2);
  }
  return d + 'Z';
}
function shape(w, h_, em) {
  const W = w - 1, H = h_ - 1, mid = H / 2;
  const Tl = Math.min(.6 * em, mid - 1);            // media altura de la cola
  const S0 = Math.min(3.7 * em, W * .6), S1 = Math.min(3 * em, S0 - .5 * em);
  const top = mid - Tl, D = Math.min(.95 * em, top), rl = Math.min(.95 * em, H / 2);
  const step = top - D > .5;                          // etiquetas altas: tramo vertical entre el hombro y la cola
  const P = (x, y, r) => ({ x, y, r });
  return roundedPath([
    P(0, 0, rl), P(W - S0, 0, .5 * em), P(W - S1, D, .45 * em),
    ...(step ? [P(W - S1, top, .35 * em)] : []),
    P(W, top, .55 * em), P(W, mid + Tl, .55 * em),
    ...(step ? [P(W - S1, mid + Tl, .35 * em)] : []),
    P(W - S1, H - D, .45 * em), P(W - S0, H, .5 * em), P(0, H, rl)]);
}
/* placa tipo boleto: esquinas redondeadas y muescas semicirculares en los lados */
function plate(w, h_, em) {
  const W = w - 1, H = h_ - 1, m = H / 2, n = Math.min(.5 * em, m - 1), r = Math.min(.55 * em, m - n);
  return `M${r} 0H${W - r}Q${W} 0 ${W} ${r}V${m - n}A${n} ${n} 0 0 0 ${W} ${m + n}V${H - r}Q${W} ${H} ${W - r} ${H}H${r}Q0 ${H} 0 ${H - r}V${m + n}A${n} ${n} 0 0 0 0 ${m - n}V${r}Q0 0 ${r} 0Z`;
}
function init(el, deco) {
  const id = 'tgg' + (++uid);
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'tg-bg'); svg.setAttribute('aria-hidden', 'true');
  svg.innerHTML = `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--tg-fill)"/><stop offset="1" style="stop-color:var(--tg-fill2)"/></linearGradient></defs><path transform="translate(.5 .5)" style="fill:url(#${id});stroke:var(--tg-stroke)" stroke-width="1" stroke-linejoin="round"/>${deco === 'plate' ? '<path class="tg-ln" fill="none"/><path class="tg-dm"/>' : deco ? '<path class="tg-st" fill="none"/><circle class="tg-ey"/><circle class="tg-ey2"/>' : ''}`;
  el.prepend(svg);
  const path = svg.querySelector('path'), st = svg.querySelector('.tg-st'), ey = svg.querySelector('.tg-ey'), ey2 = svg.querySelector('.tg-ey2'), ln = svg.querySelector('.tg-ln'), dm = svg.querySelector('.tg-dm');
  const draw = () => { const w = el.offsetWidth, hh = el.offsetHeight; if (!w || !hh) return; svg.setAttribute('viewBox', `0 0 ${w} ${hh}`); const em = parseFloat(getComputedStyle(el).fontSize) || 10; if (deco === 'plate') { path.setAttribute('d', plate(w, hh, em)); const y1 = em * .3 + .5, y2 = hh - em * .3 - .5, x1 = em * 1.15, x2 = w - em * 1.15, my = hh / 2, d = em * .2, cx1 = em * .78, cx2 = w - em * .78;
      ln.setAttribute('d', `M${x1} ${y1}H${x2}M${x1} ${y2}H${x2}`);
      dm.setAttribute('d', `M${cx1} ${my - d}L${cx1 + d} ${my}L${cx1} ${my + d}L${cx1 - d} ${my}ZM${cx2} ${my - d}L${cx2 + d} ${my}L${cx2} ${my + d}L${cx2 - d} ${my}Z`); return; }
    path.setAttribute('d', shape(w, hh, em));
    if (deco) { const i = Math.max(2, em * .3); st.setAttribute('d', shape(w - 2 * i, hh - 2 * i, em * .9)); st.setAttribute('transform', `translate(${i + .5} ${i + .5})`);
      const cx = w - .5 - em * .85, cy = hh / 2; ey.setAttribute('cx', cx); ey.setAttribute('cy', cy); ey.setAttribute('r', em * .27); ey2.setAttribute('cx', cx); ey2.setAttribute('cy', cy); ey2.setAttribute('r', em * .43); } };
  if ('ResizeObserver' in window) new ResizeObserver(draw).observe(el); else requestAnimationFrame(draw);
  requestAnimationFrame(draw);
}
const check = () => { const i = h('i', { class: 'tg-ck' }); i.innerHTML = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8.500l3.200 3.200L13 4.600"/></svg>'; return i; };

/* T.tag('TEXTO', { tag:'button'|'span', cls:'...', attrs:{...}, onclick:fn, check:true }) */
T.platePath = plate;
T.tag = function (text, o = {}) {
  const e = h(o.tag || 'span', Object.assign({ class: 'tg ' + (o.cls || '') }, o.attrs || {}), h('span', { class: 'tg-in' }, text), o.check ? check() : null);
  if (o.onclick) e.addEventListener('click', o.onclick);
  init(e, o.deco); return e;
};
})(window.TCG);
