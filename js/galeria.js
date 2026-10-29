/* Galería: tarjetas con marco TCG, inclinación y foil al pasar el puntero */
(function (T) {
'use strict';
const { $, h, clamp, mkImg } = T;
const act = new Map(); let gridRAF = 0, gprev = 0;
const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => e.target.classList.toggle('vis', e.isIntersecting)), { rootMargin: '80px' }) : null;

function cardEl(w, preview) {
  const prem = !!w.premium;
  const art = h('div', { class: 'art' }, mkImg(w.img, w.fit));
  const card = h('div', { class: 'card' + (prem ? ' prem' : ''), tabindex: preview ? -1 : 0, role: 'button', 'aria-label': 'Abrir ' + (w.title || 'obra') }, art, T.marco(), T.insignia(w.insignia));
  let shine = null;
  if (prem) { shine = h('div', { class: 'shine' }, ...T.shineKids()); card.append(shine, h('i', { class: 'rim' })); card.style.setProperty('--dl', (-Math.random() * 10).toFixed(2) + 's'); }
  const persp = h('div', { class: 'persp' }, card);
  if (prem) {
    const s = { card, shine, persp, tx: 0, ty: 0, sx: 0, sy: 0, vx: 0, vy: 0, hover: false, cv: null, ctx: null, gl: T.makeGlitter(Math.random() * 1e6 | 0) };
    const move = e => {
      if (e.pointerType === 'touch' && !s.hover && e.buttons === 0) return;
      const r = persp.getBoundingClientRect();
      s.tx = clamp(((e.clientX - r.left) / r.width - .5) * 2, -1, 1); s.ty = clamp(((e.clientY - r.top) / r.height - .5) * 2, -1, 1);
      if (!s.hover) { s.hover = true; card.classList.add('act'); if (!s.cv) { s.cv = h('canvas'); shine.append(s.cv); s.ctx = s.cv.getContext('2d'); } T.sizeCanvas(s.cv, shine); }
      act.set(card, s); if (!gridRAF) { gprev = performance.now(); gridRAF = requestAnimationFrame(gridLoop); }
    };
    const leave = () => { s.tx = 0; s.ty = 0; s.hover = false; };
    persp.addEventListener('pointermove', move); persp.addEventListener('pointerdown', move);
    persp.addEventListener('pointerleave', leave); persp.addEventListener('pointercancel', leave);
    persp.addEventListener('pointerup', e => { if (e.pointerType === 'touch') leave(); });
    if (io && !preview) io.observe(card); else card.classList.add('vis');
  }
  if (!preview) { const open = () => T.openViewer(w, card); card.addEventListener('click', open); card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } }); }
  return { persp, card };
}

function gridLoop(now) {
  const dt = Math.min(.05, Math.max(.001, (now - gprev) / 1000)); gprev = now; const t = now / 1000;
  for (const [card, s] of act) {
    const k = 90, c = 12; s.vx += (k * (s.tx - s.sx) - c * s.vx) * dt; s.sx += s.vx * dt; s.vy += (k * (s.ty - s.sy) - c * s.vy) * dt; s.sy += s.vy * dt;
    const nx = s.sx, ny = s.sy;
    if (!s.hover && Math.abs(s.sx) < .004 && Math.abs(s.sy) < .004 && Math.abs(s.vx) < .01 && Math.abs(s.vy) < .01) {
      card.style.transform = ''; card.style.boxShadow = ''; card.classList.remove('act'); if (s.cv) s.ctx.clearRect(0, 0, s.cv.width, s.cv.height);
      act.delete(card); continue;
    }
    card.style.transform = `rotateX(${(-ny * 14).toFixed(2)}deg) rotateY(${(nx * 14).toFixed(2)}deg) scale(${(1 + .04 * (s.hover ? 1 : Math.abs(nx) + Math.abs(ny) > .05 ? 1 : 0)).toFixed(3)})`;
    card.style.boxShadow = `${(-nx * 18).toFixed(1)}px ${(22 - ny * 14).toFixed(1)}px 44px var(--sh2),0 0 0 1px rgba(var(--acc-rgb),.5)`;
    const int = clamp(Math.hypot(nx, ny), 0, 1) * .65 + .35;
    T.setVars(s.shine, 50 + nx * 48, 50 + ny * 48, nx * 140 + ny * 90 + t * 9, int, 50 + nx * 40 - ny * 10, 50 + ny * 40);
    if (s.cv) T.drawGlitter(s.ctx, s.cv, s.gl, nx, ny, int, t);
  }
  gridRAF = act.size ? requestAnimationFrame(gridLoop) : 0;
}

function render() {
  const DB = T.DB, grid = $('#grid');
  T.setTitle(DB.site.title || ''); $('#siteSub').textContent = DB.site.sub || ''; $('#yr').textContent = new Date().getFullYear();
  document.title = (DB.site.title || 'Galería') + ' · Galería';
  act.clear(); grid.replaceChildren();
  const lista = T.filtrar ? T.filtrar(DB.works) : DB.works;
  if (!DB.works.length) { grid.append(h('div', { class: 'empty' }, h('b', null, T.admin ? 'GALERÍA VACÍA' : 'PRÓXIMAMENTE'), T.admin ? 'Pulsa «SUBIR OBRA» para añadir tu primer boceto.' : 'La colección está en preparación.')); return; }
  if (!lista.length) { grid.append(h('div', { class: 'empty' }, h('b', null, 'SIN RESULTADOS'), 'Ninguna obra cumple con el filtro.', h('div', null, h('button', { class: 'btn mini', onclick: () => T.limpiarFiltro() }, 'QUITAR FILTRO')))); return; }
  [...lista].sort((a, b) => (b.created || 0) - (a.created || 0)).forEach((w, i) => {
    const { persp } = cardEl(w, false);
    const cap = h('div', { class: 'cap' }, h('h3', null, w.title || 'Sin título'), [w.year, ...(w.cats || [])].filter(Boolean).length ? h('div', { class: 'meta' }, [w.year, ...(w.cats || [])].filter(Boolean).join(' · ')) : null, w.desc ? h('p', null, w.desc) : null, w.premium ? h('span', { class: 'tag' }, '◆ FOIL PREMIUM') : null);
    if (T.admin) cap.append(h('button', { class: 'btn mini', onclick: () => T.editor(w) }, 'EDITAR'));
    grid.append(h('article', { class: 'work', style: '--i:' + i }, persp, cap));
  });
}
T.cardEl = cardEl; T.render = render;
})(window.TCG);
