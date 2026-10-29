/* Parallax fluido e interactivo: capas de la cabecera, brasas del fondo y tarjetas reaccionan al cursor y al scroll
   con inercia (suavizado exponencial). Se desactiva con «reducir movimiento». */
(function (T) {
'use strict';
T.par = T.par || { x: 0, y: 0, sy: 0 };
if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
const { $, clamp } = T, hero = $('.hero'), mark = $('#heroMark'), title = $('#siteTitle'), sub = $('#siteSub'), orn = $('.orn'), grid = $('#grid');
const S = { tx: 0, ty: 0, x: 0, y: 0, ts: scrollY, sc: scrollY, run: false, prev: 0 };
function kick() { if (!S.run) { S.run = true; S.prev = performance.now(); requestAnimationFrame(frame); } }
addEventListener('pointermove', e => { if (e.pointerType === 'touch') return; S.tx = (e.clientX / innerWidth - .5) * 2; S.ty = (e.clientY / innerHeight - .5) * 2; kick(); }, { passive: true });
document.documentElement.addEventListener('mouseleave', () => { S.tx = 0; S.ty = 0; kick(); });
addEventListener('scroll', () => { S.ts = scrollY; kick(); }, { passive: true }); addEventListener('resize', kick);
if (grid && 'MutationObserver' in window) new MutationObserver(kick).observe(grid, { childList: true });

function frame(now) {
  const dt = Math.min(.05, (now - S.prev) / 1000 || .016); S.prev = now;
  const k = 1 - Math.exp(-dt * 7), ks = 1 - Math.exp(-dt * 9);
  S.x += (S.tx - S.x) * k; S.y += (S.ty - S.y) * k; S.sc += (S.ts - S.sc) * ks;
  T.par.x = S.x; T.par.y = S.y; T.par.sy = S.sc;

  /* cabecera: cada capa a distinta profundidad; al bajar suben más despacio y se desvanece */
  const sc = S.sc, f = clamp(sc / Math.max(200, hero.offsetHeight), 0, 1);
  hero.style.opacity = (1 - f * .9).toFixed(3);
  if (mark) { mark.style.translate = `${(-S.x * 18).toFixed(2)}px ${(-S.y * 12 + sc * .36).toFixed(2)}px`; mark.style.transform = `perspective(520px) rotateX(${(-S.y * 16).toFixed(2)}deg) rotateY(${(S.x * 20).toFixed(2)}deg)`; }
  if (title) title.style.translate = `${(-S.x * 9).toFixed(2)}px ${(-S.y * 6 + sc * .26).toFixed(2)}px`;
  if (sub) sub.style.translate = `${(-S.x * 6).toFixed(2)}px ${(-S.y * 4 + sc * .2).toFixed(2)}px`;
  if (orn) orn.style.translate = `${(-S.x * 4).toFixed(2)}px ${(-S.y * 3 + sc * .14).toFixed(2)}px`;

  /* tarjetas: profundidad propia; reaccionan al cursor y se retrasan un poco respecto al scroll */
  if (grid) { const items = [...grid.children], vh = innerHeight, rs = items.map(el => el.getBoundingClientRect()), lag = scrollY - S.sc;
    items.forEach((el, i) => { const d = el._d || (el._d = .02 + ((i * 37) % 7) / 7 * .05), pdy = el._dy || 0;
      const cy = rs[i].top - pdy + rs[i].height / 2 - vh / 2, dy = clamp(lag * d * 8, -26, 26) + clamp(-cy * d * .3, -12, 12);
      el._dy = dy; el.style.translate = `${(-S.x * d * 140).toFixed(2)}px ${(dy - S.y * d * 90).toFixed(2)}px`; }); }

  if (Math.abs(S.tx - S.x) < .001 && Math.abs(S.ty - S.y) < .001 && Math.abs(S.ts - S.sc) < .1) { S.run = false; return; }
  requestAnimationFrame(frame);
}
kick();
})(window.TCG);
