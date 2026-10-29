/* Visor: TODAS las obras se abren como carta 3D (inclinación, giro con rebote, materiales al reverso).
   El modo «TCG PREMIUM» sólo añade los reflejos holográficos. Clic fuera de la carta = volver a la galería. */
(function (T) {
'use strict';
const { h, clamp, lerp, smooth, PI, mkImg } = T;

const gyro = { x: 0, y: 0, last: -1e9, g0: null, on: false, asked: false,
  ask() {
    if (this.asked || this.on) return; const D = window.DeviceOrientationEvent; if (!D) return;
    if (typeof D.requestPermission === 'function') { this.asked = true; D.requestPermission().then(r => { if (r === 'granted') this.attach(); else this.asked = false; }).catch(() => { this.asked = false; }); }
    else this.attach();
  },
  attach() {
    if (this.on) return; this.on = true;
    addEventListener('deviceorientation', e => {
      if (e.gamma == null || e.beta == null) return; if (!this.g0) this.g0 = { b: e.beta, g: e.gamma };
      this.g0.b += (e.beta - this.g0.b) * .0016; this.g0.g += (e.gamma - this.g0.g) * .0016;
      const gx = clamp((e.gamma - this.g0.g) / 22, -1, 1), gy = clamp((e.beta - this.g0.b) / 22, -1, 1);
      if (Math.hypot(gx - this.x, gy - this.y) > .012) this.last = performance.now(); this.x = gx; this.y = gy;
    });
  } };

let viewer = null, viewerFlip = () => {};
function destroyViewer() { if (!viewer) return; viewer.stop(); viewer.ov.remove(); viewer = null; removeEventListener('keydown', viewerKeys, true); }
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
/* transformación que lleva la carta grande (stage) a la posición y tamaño de la carta de la galería */
function toSource(v) {
  const s = v.stage.getBoundingClientRect(), wr = v.wrap.getBoundingClientRect(), sr = v.src && v.src.isConnected ? v.src.getBoundingClientRect() : null;
  v.wrap.style.transformOrigin = (s.left + s.width / 2 - wr.left) + 'px ' + (s.top + s.height / 2 - wr.top) + 'px';
  if (!sr || !sr.width || sr.bottom < 0 || sr.top > innerHeight) return 'scale(.82)';
  return `translate(${sr.left + sr.width / 2 - (s.left + s.width / 2)}px,${sr.top + sr.height / 2 - (s.top + s.height / 2)}px) scale(${sr.width / s.width})`;
}
/* cerrar: la carta vuelve a su sitio en la galería y desaparece (instant=true: sin animación) */
function closeViewer(instant) {
  if (!viewer || viewer.closing) return;
  if (instant === true || reduce.matches || !viewer.wrap.animate) return destroyViewer();
  const v = viewer; v.closing = true; v.ov.style.pointerEvents = 'none'; v.ov.style.cursor = 'default';
  v.st.ft = 0; v.st.ix = 0; v.st.iy = 0; v.st.last = performance.now();     /* se endereza y gira al frente mientras vuelve */
  const D = 520, ease = 'cubic-bezier(.55,.05,.25,1)';
  v.wrap.animate([{ transform: 'none', opacity: 1 }, { transform: toSource(v), opacity: 1, offset: .75 }, { transform: toSource(v), opacity: 0 }], { duration: D, easing: ease, fill: 'forwards' });
  const a = v.ov.animate([{ opacity: 1 }, { opacity: 0 }], { duration: D, easing: 'ease-in', fill: 'forwards' });
  a.onfinish = () => { if (viewer === v) destroyViewer(); };
}
function viewerKeys(e) { if (e.key === 'Escape') { e.preventDefault(); closeViewer(); } else if (e.code === 'Space' && viewer && !viewer.closing) { e.preventDefault(); viewerFlip(); } }

function openViewer(w, src) {
  closeViewer(true); gyro.ask();
  const ov = h('div', { class: 'viewer' }); const prem = !!w.premium;
  ov.append(h('button', { class: 'vclose', 'aria-label': 'Cerrar', onclick: () => closeViewer() }, '✕'));
  addEventListener('keydown', viewerKeys, true);

  const stage = h('div', { class: 'vstage' }), tilt = h('div', { class: 'vt' }), flip = h('div', { class: 'vf' });
  const NS = 11, slices = [];
  for (let i = 0; i < NS; i++) { const k = Math.sin(PI * i / (NS - 1)); const s = h('i', { class: 'vslice', style: `background:linear-gradient(180deg,hsl(0,0%,${30 + k * 40}%),hsl(0,0%,${20 + k * 28}%))` }); flip.append(s); slices.push(s); }
  const front = h('section', { class: 'vface' }), back = h('section', { class: 'vface' });

  /* frente: ilustración + marco TCG + (foil) + canto, todo en un mismo plano */
  const F1 = h('div', { class: 'layer' }, h('div', { class: 'fwin' }, mkImg(w.img, w.fit)), T.marco(), T.insignia(w.insignia));
  const F2 = prem ? h('div', { class: 'layer shine' }, ...T.shineKids(), h('canvas')) : null;
  if (F2) F1.append(F2);
  /* sin TCG premium: reflejo satinado (brillo blanco suave) que se desliza al mover la carta */
  const G1 = prem ? null : h('i', { class: 'gloss' }); if (G1) F1.append(G1);
  F1.append(h('i', { class: 'vedge' }));
  front.append(F1);

  /* reverso: ficha técnica */
  const B1 = h('div', { class: 'layer bback' });
  const fila = (lbl, vals) => vals.length ? h('div', { class: 'frow' }, h('b', null, lbl), h('div', { class: 'fchips' }, ...vals.map(v => T.tag(v, { cls: 'fchip fplate', deco: 'plate' })))) : null;
  const filas = [fila('AÑO', w.year ? [w.year] : []), fila('PAPEL', w.paper ? [w.paper] : []), fila('CATEGORÍA', w.cats || []), fila('TÉCNICAS', w.techs || [])].filter(Boolean);
  /* paleta de colores: la guardada con la obra o, si falta, la calculada al abrir */
  const palRow = pal => [h('b', null, 'PALETA DE COLORES'), T.paletaBar(pal)];
  const palHost = h('div', { class: 'frow' }, ...(w.palette && w.palette.length ? palRow(w.palette) : []));
  if (!(w.palette && w.palette.length)) { palHost.hidden = true; T.extraerPaleta(w.img).then(r => { if (r && r.length) { palHost.replaceChildren(...palRow(r)); palHost.hidden = false; const nm = palHost.parentNode && palHost.parentNode.querySelector('.nomat'); if (nm) nm.remove(); } }); }
  /* información del archivo (parte inferior del reverso) */
  const cel = (lbl, v, cls) => { const s = h('span', null, v); return [h('div', { class: cls || '' }, h('b', null, lbl), s), s]; };
  const [rFile] = cel('NOMBRE DE ARCHIVO', T.fileOf(w), 'w3'), [rNum] = cel('N.º DE DIBUJO', T.numOf(w)), [rDim, sDim] = cel('DIMENSIONES', w.dim || '…'), [rSz, sSz] = cel('TAMAÑO', w.kb ? T.fmtKb(w.kb * 1024) : '…'), [rCp] = cel('COPYRIGHT', T.copyOf(w), 'w3');
  const finfo = h('div', { class: 'finfo' }, rFile, rNum, rDim, rSz, rCp);
  if (!w.dim || !w.kb) T.infoImg(w).then(r => { if (!w.dim) sDim.textContent = T.fmtDim(r.dim); if (!w.kb) sSz.textContent = T.fmtKb(r.bytes); });
  const B2 = h('div', { class: 'layer bwin' }, h('small', null, '✦ FICHA TÉCNICA ✦'), h('h4', null, w.title || 'Sin título'),
    h('div', { class: 'ficha' }, ...filas, ...(filas.length || (w.palette && w.palette.length) ? [] : [h('div', { class: 'nomat' }, 'SIN DATOS', 'REGISTRADOS')]), palHost),
    finfo);
  const B3 = prem ? h('div', { class: 'layer shine' }, ...T.shineKids(), h('canvas')) : null;
  const G2 = prem ? null : h('i', { class: 'gloss' });
  B1.append(B2); if (B3) B1.append(B3); if (G2) B1.append(G2); B1.append(h('i', { class: 'vedge' }));
  back.append(B1);

  flip.append(front, back); tilt.append(flip); stage.append(tilt);
  const shadow = h('div', { class: 'vshadow' });
  const wrap = h('div', { class: 'vwrap' }, shadow, stage, h('div', { class: 'vcap' }, h('h2', null, w.title || 'Sin título'), w.desc ? h('p', null, w.desc) : null));
  ov.append(wrap); document.body.append(ov);

  const fcv = F2 && F2.querySelector('canvas'), bcv = B3 && B3.querySelector('canvas'), fctx = fcv && fcv.getContext('2d'), bctx = bcv && bcv.getContext('2d'), GF = T.makeGlitter(5), GB = T.makeGlitter(9);
  let H = stage.offsetHeight;
  const size = () => {
    H = stage.offsetHeight; const Tk = H * .012;
    slices.forEach((s, i) => s.style.transform = `translateZ(${((i / (NS - 1)) - .5) * Tk}px)`);
    front.style.transform = `translateZ(${Tk / 2}px)`; back.style.transform = `rotateY(180deg) translateZ(${Tk / 2}px)`;
    if (F2) T.sizeCanvas(fcv, F2); if (B3) T.sizeCanvas(bcv, B3);
    wrap.style.setProperty('--VH', H + 'px');
  };
  size(); addEventListener('resize', size);

  const st = { ix: 0, iy: 0, sx: 0, sy: 0, vx: 0, vy: 0, f: 0, fv: 0, ft: 0, last: -1e9 };
  const setPt = (x, y) => { const r = stage.getBoundingClientRect(); st.ix = clamp((x - (r.left + r.width / 2)) / (r.width * .62), -1, 1); st.iy = clamp((y - (r.top + r.height / 2)) / (r.height * .62), -1, 1); st.last = performance.now(); };
  const onMove = e => setPt(e.clientX, e.clientY); ov.addEventListener('pointermove', onMove); ov.addEventListener('pointerdown', onMove);

  let lastFlip = -1e9, lastTap = 0, tx = 0, ty = 0;
  const doFlip = () => { const n = performance.now(); if (n - lastFlip < 520) return; lastFlip = n; st.ft = st.ft ? 0 : 180; st.last = n; }; viewerFlip = doFlip;
  /* doble clic / doble toque SOBRE LA CARTA = voltear */
  ov.addEventListener('dblclick', e => { if (e.target.closest('.vstage')) doFlip(); });
  ov.addEventListener('pointerup', e => {
    if (e.pointerType !== 'touch' || !e.target.closest('.vstage')) return; const n = performance.now();
    if (n - lastTap < 340 && Math.hypot(e.clientX - tx, e.clientY - ty) < 60) { doFlip(); lastTap = 0; } else { lastTap = n; tx = e.clientX; ty = e.clientY; }
  });
  /* clic fuera de la carta = volver a la galería */
  ov.addEventListener('click', e => { if (e.target.closest('.vstage,.vclose')) return; closeViewer(); });

  let raf = 0, prev = performance.now(), fVis = true, alive = true;
  const loop = now => {
    if (!alive) return; const dt = Math.min(.05, Math.max(.001, (now - prev) / 1000)); prev = now; const t = now / 1000;
    const useG = gyro.on && gyro.last > st.last, lastIn = Math.max(st.last, gyro.last);
    const ix = useG ? gyro.x : st.ix, iy = useG ? gyro.y : st.iy;
    const idle = smooth(clamp((now - lastIn - 2400) / 1800, 0, 1)), actv = 1 - idle;
    const ax = Math.sin(t * .55) * .58 + Math.sin(t * 1.37 + 1) * .12, ay = Math.cos(t * .43) * .40 + Math.sin(t * .9) * .08;
    const tX = lerp(ix, ax, idle), tY = lerp(iy, ay, idle);
    st.vx += (78 * (tX - st.sx) - 11 * st.vx) * dt; st.sx += st.vx * dt; st.vy += (78 * (tY - st.sy) - 11 * st.vy) * dt; st.sy += st.vy * dt;
    st.fv += (48 * (st.ft - st.f) - 6.2 * st.fv) * dt; st.f += st.fv * dt;
    const nx = clamp(st.sx, -1.3, 1.3), ny = clamp(st.sy, -1.3, 1.3), fr = st.f * PI / 180, cf = Math.cos(fr), sf = Math.max(0, Math.sin(fr));
    const lift = H * (.012 + .02 * actv) + sf * H * .11;
    tilt.style.transform = `translate3d(0,0,${lift.toFixed(1)}px) rotateX(${(-ny * 17).toFixed(3)}deg) rotateY(${(nx * 17).toFixed(3)}deg) scale(${(1 + .018 * actv + .05 * sf).toFixed(4)})`;
    flip.style.transform = `rotateY(${st.f.toFixed(3)}deg)`;
    const fv = cf >= 0; if (fv !== fVis) { fVis = fv; front.style.visibility = fv ? 'visible' : 'hidden'; back.style.visibility = fv ? 'hidden' : 'visible'; }
    const lf = lift / H; shadow.style.transform = `translate(${(-nx * H * .05).toFixed(1)}px,${(H * .075 + ny * H * .03 + lf * H * .5).toFixed(1)}px) scale(${(.97 + lf * .75).toFixed(3)})`;
    shadow.style.opacity = clamp(.65 - lf * 1.5, .12, .7).toFixed(3);
    const int = clamp(Math.hypot(nx, ny), 0, 1) * .65 + .35;
    if (!prem) { const g = fVis ? G1 : G2, gx = fVis ? nx : -nx, s = g.style; s.setProperty('--gx', (50 + gx * 46).toFixed(1) + '%'); s.setProperty('--gy', (50 + ny * 46).toFixed(1) + '%'); s.setProperty('--gb', (50 + gx * 60).toFixed(1) + '%'); s.setProperty('--gi', (.4 + clamp(Math.hypot(nx, ny), 0, 1) * .6).toFixed(3)); }
    if (prem) {
      if (fVis) { T.setVars(F2, 50 + nx * 48, 50 + ny * 48, nx * 140 + ny * 90 + t * 9, int, 50 + nx * 40 - ny * 10, 50 + ny * 40); T.drawGlitter(fctx, fcv, GF, nx, ny, int, t); }
      else { const bx = -nx; T.setVars(B3, 50 + bx * 48, 50 + ny * 48, bx * 140 + ny * 90 + t * 9, int, 50 + bx * 40 - ny * 10, 50 + ny * 40); T.drawGlitter(bctx, bcv, GB, bx, ny, int, t); }
    }
    raf = requestAnimationFrame(loop);
  };
  front.style.visibility = 'visible'; back.style.visibility = 'hidden';
  raf = requestAnimationFrame(t => { prev = t; loop(t); });
  viewer = { ov, prem, wrap, stage, src, st, closing: false, stop() { alive = false; cancelAnimationFrame(raf); removeEventListener('resize', size); viewerFlip = () => {}; } };
  /* apertura: la carta sale de su sitio en la galería hasta el centro */
  if (src && src.isConnected && wrap.animate && !reduce.matches) { const from = toSource(viewer);
    wrap.animate([{ transform: from, opacity: 0 }, { transform: from, opacity: 1, offset: .18 }, { transform: 'none', opacity: 1 }], { duration: 560, easing: 'cubic-bezier(.2,.8,.2,1)' }); }
}
T.openViewer = openViewer; T.closeViewer = closeViewer;
})(window.TCG);
