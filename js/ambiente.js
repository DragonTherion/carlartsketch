/* Ambiente: tema claro/oscuro (claro por defecto) y polvo/brasas del fondo */
(function (T) {
'use strict';
const { $, clamp, DPR } = T;

/* ---- tema ---- */
(() => {
  const root = document.documentElement, meta = $('#metaTheme'), btn = $('#themeBtn'), COL = { light: '#f2f2f3', dark: '#0b0b0c' };
  const apply = (th, save) => {
    root.dataset.theme = th; meta && meta.setAttribute('content', COL[th]);
    const lbl = th === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'; btn.setAttribute('aria-label', lbl); btn.title = lbl;
    if (save) { try { localStorage.setItem('tcg_theme', th); } catch (e) {} }
  };
  btn.addEventListener('click', () => apply(root.dataset.theme === 'dark' ? 'light' : 'dark', true));
  apply(root.dataset.theme === 'dark' ? 'dark' : 'light', false);
})();

/* ---- polvo / brasas ---- */
(() => {
  const cv = $('#embers'), cx = cv.getContext('2d'); let W = 0, Hh = 0; const ps = [];
  const mkSpr = c0 => { const c = document.createElement('canvas'); c.width = c.height = 48; const x = c.getContext('2d'), g = x.createRadialGradient(24, 24, 0, 24, 24, 24);
    g.addColorStop(0, `rgba(${c0},1)`); g.addColorStop(.14, `rgba(${c0},.9)`); g.addColorStop(.45, `rgba(${c0},.26)`); g.addColorStop(1, `rgba(${c0},0)`); x.fillStyle = g; x.fillRect(0, 0, 48, 48); return c; };
  const sprD = mkSpr('235,235,242'), sprL = mkSpr('70,70,80');
  const reset = (p, init) => { p.z = Math.random(); p.x = Math.random() * W; p.y = init ? Math.random() * Hh : Hh + 20 + Math.random() * 60; p.ph = Math.random() * 6.28; p.f = .5 + Math.random() * 1.3; p.fl = 2 + Math.random() * 6; p.s = (3 + p.z * p.z * 16) * DPR; p.vy = -(9 + p.z * 30) * DPR; p.a = .25 + p.z * .5; };
  const size = () => { W = cv.width = Math.round(innerWidth * DPR); Hh = cv.height = Math.round(innerHeight * DPR); ps.forEach(p => reset(p, true)); };
  for (let i = 0; i < 60; i++) ps.push({}); size(); addEventListener('resize', size); let prev = performance.now();
  const loop = now => {
    const dt = Math.min(.05, (now - prev) / 1000); prev = now; const t = now / 1000;
    const par = T.par || { x: 0, y: 0, sy: 0 }; cx.clearRect(0, 0, W, Hh); const lt = document.documentElement.dataset.theme !== 'dark', spr = lt ? sprL : sprD; cx.globalCompositeOperation = lt ? 'source-over' : 'lighter';
    for (const p of ps) {
      p.y += p.vy * dt; p.x += Math.sin(t * p.f + p.ph) * (7 + p.z * 18) * DPR * dt; if (p.y < -60) reset(p, false);
      cx.globalAlpha = p.a * (lt ? .5 : 1) * (.45 + .55 * (.5 + .5 * Math.sin(t * p.fl + p.ph))) * clamp(p.y / (Hh * .2), 0, 1); const dx = -par.x * (24 + 70 * p.z) * DPR, dy = -par.y * (14 + 40 * p.z) * DPR - par.sy * (.08 + .4 * p.z) * DPR, px = ((p.x + dx) % W + W) % W, py = ((p.y + dy) % Hh + Hh) % Hh; cx.drawImage(spr, px - p.s / 2, py - p.s / 2, p.s, p.s);
    }
    cx.globalAlpha = 1; requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
})();
})(window.TCG);
