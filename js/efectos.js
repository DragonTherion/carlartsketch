/* Efectos de la carta: marco TCG, foil holográfico y purpurina */
(function (T) {
'use strict';
const { h, clamp, DPR } = T;

/* ---- marco: MISMO diseño que el reverso (fondo oscuro con trama, doble anillo claro y ventana con borde) ----
   viewBox 500×700; hueco de la ilustración = 30,30 → 470,670 */
const OUT = 'M24 0H476A24 24 0 0 1 500 24V676A24 24 0 0 1 476 700H24A24 24 0 0 1 0 676V24A24 24 0 0 1 24 0Z';
const WIN = 'M36 30H464A6 6 0 0 1 470 36V664A6 6 0 0 1 464 670H36A6 6 0 0 1 30 664V36A6 6 0 0 1 36 30Z';
const MARCO_SVG = `<svg viewBox="0 0 500 700" preserveAspectRatio="none" aria-hidden="true">
<path fill-rule="evenodd" fill="url(#tf_bg)" d="${OUT} ${WIN}"/>
<path fill-rule="evenodd" fill="url(#tf_x)" d="${OUT} ${WIN}"/>
<rect x="16.4" y="16.4" width="467.2" height="667.2" rx="16.8" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="2"/>
<rect x="18.9" y="18.9" width="462.2" height="662.2" rx="15" fill="none" stroke="#000" stroke-opacity=".4" stroke-width="3"/>
<rect x="20.9" y="20.9" width="458.2" height="658.2" rx="14" fill="none" stroke="#fff" stroke-opacity=".25" stroke-width="1"/>
<rect x="27" y="27" width="446" height="646" rx="9" fill="none" stroke="#000" stroke-opacity=".5" stroke-width="2"/>
<rect x="29" y="29" width="442" height="642" rx="7" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="2"/>
</svg>`;
T.marcoSvg = MARCO_SVG;
T.marco = () => { const d = h('div', { class: 'marco', 'aria-hidden': 'true' }); d.innerHTML = MARCO_SVG; return d; };

/* ---- foil ---- */
/* ---- foil ---- */
T.shineKids = () => [h('i', { class: 'c' }), h('i', { class: 's' }), h('i', { class: 'r' }), h('i', { class: 'h' }), h('div', { class: 'spec' })];
T.setVars = function (el, sx, sy, ang, int, bx, by) {
  const s = el.style;
  s.setProperty('--sx', sx.toFixed(1) + '%'); s.setProperty('--sy', sy.toFixed(1) + '%'); s.setProperty('--ang', ang.toFixed(1) + 'deg');
  s.setProperty('--int', int.toFixed(3)); s.setProperty('--bx', bx.toFixed(1) + '%'); s.setProperty('--by', by.toFixed(1) + '%');
};
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
T.makeGlitter = function (seed) {
  const R = rng(seed), L = [];
  for (let i = 0; i < 260; i++) L.push({ x: R() * 500, y: R() * 700, s: 1.8 + R() * R() * 7, p: R() * 6.28, a: R() * 2 - 1, b: R() * 2 - 1, w: .4 + R() * 2.2, h: R() * 360, g: .5 + R() * .5 });
  return L;
};
T.sizeCanvas = (cv, el) => { cv.width = Math.max(2, Math.round(el.clientWidth * DPR)); cv.height = Math.max(2, Math.round(el.clientHeight * DPR)); };
T.drawGlitter = function (ctx, cv, L, nx, ny, int, t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height); ctx.setTransform(cv.width / 500, 0, 0, cv.height / 700, 0, 0); ctx.globalCompositeOperation = 'lighter';
  for (const s of L) {
    const v0 = Math.sin(s.p + (nx * s.a + ny * s.b) * 4.2 + t * s.w); if (v0 < .72) continue;
    const v = (v0 - .72) / .28, al = v * v * (.3 + .7 * int) * s.g; if (al < .04) continue;
    const hue = ((s.h + nx * 90 + ny * 60 + t * 25) % 360 + 360) % 360, Ls = s.s * (.5 + v);
    ctx.fillStyle = `hsla(${hue | 0},100%,${(72 + v * 24) | 0}%,${al.toFixed(2)})`;
    ctx.beginPath(); ctx.moveTo(s.x - Ls, s.y); ctx.quadraticCurveTo(s.x, s.y, s.x, s.y - Ls); ctx.quadraticCurveTo(s.x, s.y, s.x + Ls, s.y); ctx.quadraticCurveTo(s.x, s.y, s.x, s.y + Ls); ctx.quadraticCurveTo(s.x, s.y, s.x - Ls, s.y); ctx.fill();
    ctx.fillStyle = `hsla(${hue | 0},100%,85%,${(al * .28).toFixed(2)})`; ctx.beginPath(); ctx.arc(s.x, s.y, Ls * .55, 0, 6.283); ctx.fill();
  }
};
})(window.TCG);
