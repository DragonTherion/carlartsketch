/* Exportar la carta: dos imágenes PNG (FRENTE y ATRÁS) dibujadas en un lienzo, 1500 × 2100 px */
(function (T) {
'use strict';
const K = 3, W = 500, H = 700, FONT = "'Century Gothic','CenturyGothic','Apple Gothic','URW Gothic','Questrial','Futura','Trebuchet MS','Segoe UI',sans-serif";
const OUT = 'M24 0H476A24 24 0 0 1 500 24V676A24 24 0 0 1 476 700H24A24 24 0 0 1 0 676V24A24 24 0 0 1 24 0Z';

const loadImg = (src, cors) => new Promise((res, rej) => { const i = new Image(); if (cors) i.crossOrigin = 'anonymous'; i.onload = () => res(i); i.onerror = () => rej(new Error('img')); i.src = src; });
async function loadArt(src) {
  if (!T.safeUrl(src)) return null;
  try { return await loadImg(src, !src.startsWith('data:') && !src.startsWith('img/') && !src.startsWith('./')); } catch (e) { try { return await loadImg(src, false); } catch (e2) { return null; } }
}
const svgImg = (svg, w, h) => loadImg('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg));
const newCanvas = () => { const c = document.createElement('canvas'); c.width = W * K; c.height = H * K; const x = c.getContext('2d'); x.scale(K, K); x.imageSmoothingQuality = 'high'; return [c, x]; };
const rr = (x, a, b, w, h, r) => { x.beginPath(); x.roundRect(a, b, w, h, r); };
function txt(x, s, px, py, size, wt, col, ls, al) {
  x.font = `${wt} ${size}px ${FONT}`; x.fillStyle = col; x.textAlign = al || 'center'; x.textBaseline = 'alphabetic';
  if ('letterSpacing' in x) x.letterSpacing = (ls || 0) + 'px'; x.fillText(s, px + (al === 'left' || al === 'right' ? 0 : (ls || 0) / 2), py); if ('letterSpacing' in x) x.letterSpacing = '0px';
}
const tw = (x, s, size, wt, ls) => { x.font = `${wt} ${size}px ${FONT}`; if ('letterSpacing' in x) x.letterSpacing = (ls || 0) + 'px'; const w = x.measureText(s).width; if ('letterSpacing' in x) x.letterSpacing = '0px'; return w; };
function wrap(x, s, maxW, size, wt, ls) { const out = []; let cur = ''; for (const w of String(s).split(/\s+/)) { const t = cur ? cur + ' ' + w : w; if (cur && tw(x, t, size, wt, ls) > maxW) { out.push(cur); cur = w; } else cur = t; } if (cur) out.push(cur); return out; }

/* ---------- FRENTE ---------- */
async function frente(w) {
  const [c, x] = newCanvas(); const art = await loadArt(w.img);
  x.save(); x.clip(new Path2D(OUT)); x.fillStyle = '#121214'; x.fillRect(0, 0, W, H);
  x.save(); rr(x, 30, 30, 440, 640, 6); x.clip(); x.fillStyle = '#0a0a0c'; x.fillRect(30, 30, 440, 640);
  if (art) { const cw = 440, ch = 640, ar = art.naturalWidth / art.naturalHeight, cr = cw / ch, cover = w.fit !== 'contain'; let dw, dh;
    if ((ar > cr) === cover) { dh = ch; dw = ch * ar; } else { dw = cw; dh = cw / ar; } x.drawImage(art, 30 + (cw - dw) / 2, 30 + (ch - dh) / 2, dw, dh); }
  else txt(x, 'SIN IMAGEN', 250, 350, 12, 400, '#a2a2a8', 3.6);
  x.restore();
  if (w.premium) { /* reflejo holográfico fijo */
    x.save(); x.globalCompositeOperation = 'overlay'; x.globalAlpha = .6;
    const g = x.createConicGradient ? x.createConicGradient(-.6, 150, 190) : null;
    if (g) { ['#ff2e63', '#ffb02e', '#f6ff4d', '#2effa5', '#2ec8ff', '#7a5cff', '#ff3df0', '#ff2e63'].forEach((cl, i, a) => g.addColorStop(i / (a.length - 1), cl)); x.fillStyle = g; x.fillRect(0, 0, W, H); }
    x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1; const r = x.createRadialGradient(150, 190, 0, 150, 190, 230); r.addColorStop(0, 'rgba(255,255,255,.45)'); r.addColorStop(.3, 'rgba(255,244,225,.14)'); r.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = r; x.fillRect(0, 0, W, H); x.restore(); }
  if (!w.premium) { x.save(); const r = x.createRadialGradient(170, 200, 0, 170, 200, 260); r.addColorStop(0, 'rgba(255,255,255,.32)'); r.addColorStop(.35, 'rgba(255,255,255,.1)'); r.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = r; x.fillRect(0, 0, W, H); x.restore(); }
  const defs = ['tf_bg', 'tf_x'].map(i => document.getElementById(i).outerHTML).join('');
  const marco = T.marcoSvg.replace('<svg ', `<svg xmlns="http://www.w3.org/2000/svg" width="${W * K}" height="${H * K}" `).replace('>', `><defs>${defs}</defs>`);
  x.drawImage(await svgImg(marco), 0, 0, W, H);
  x.save(); const bw = W * .135; x.shadowColor = 'rgba(0,0,0,.5)'; x.shadowBlur = 5; x.shadowOffsetY = 2; x.drawImage(await svgImg(T.insigniaSvg(w.insignia)), W - W * .018 - bw, H * .011, bw, bw); x.restore();
  x.restore(); x.save(); x.clip(new Path2D(OUT)); x.strokeStyle = 'rgba(255,255,255,.35)'; x.lineWidth = 1.5; x.stroke(new Path2D(OUT)); x.restore();
  return c;
}

/* ---------- ATRÁS ---------- */
async function atras(w, info) {
  const [c, x] = newCanvas(); const out = new Path2D(OUT);
  x.save(); x.clip(out);
  const g = x.createRadialGradient(250, 315, 0, 250, 315, 430); g.addColorStop(0, '#4a4a50'); g.addColorStop(.6, '#2a2a2e'); g.addColorStop(1, '#0f0f11'); x.fillStyle = g; x.fillRect(0, 0, W, H);
  x.strokeStyle = 'rgba(255,255,255,.08)'; x.lineWidth = 1; x.beginPath(); for (let d = -H; d < W + H; d += 22) { x.moveTo(d, 0); x.lineTo(d + H, H); x.moveTo(d, H); x.lineTo(d + H, 0); } x.stroke();
  const m = 15.4, R = 16.8; rr(x, m + 1, m + 1, W - 2 * m - 2, H - 2 * m - 2, R); x.strokeStyle = 'rgba(255,255,255,.55)'; x.lineWidth = 2; x.stroke();
  rr(x, m + 3.5, m + 3.5, W - 2 * m - 7, H - 2 * m - 7, R - 2); x.strokeStyle = 'rgba(0,0,0,.4)'; x.lineWidth = 3; x.stroke();
  rr(x, m + 5.5, m + 5.5, W - 2 * m - 11, H - 2 * m - 11, R - 4); x.strokeStyle = 'rgba(255,255,255,.25)'; x.lineWidth = 1; x.stroke();

  const PAD = 35, IW = W - 2 * PAD;
  txt(x, '✦ FICHA TÉCNICA ✦', 250, 42 + 11, 11.9, 400, '#cfcfd5', 4);
  const tl = wrap(x, String(w.title || 'Sin título').toUpperCase(), IW, 19.6, 700, 2.7).slice(0, 3); let y = 42 + 11 + 8;
  tl.forEach((l, i) => txt(x, l, 250, y + 19.6 + i * 24.5, 19.6, 700, '#fff', 2.7)); const top = y + 19.6 + (tl.length - 1) * 24.5 + 14;

  /* cuadro de información (abajo) */
  const bh = 108, bx = PAD, bb = H - 35, by = bb - bh, rowH = 31;
  x.save(); rr(x, bx, by, IW, bh, 8.4); const bgf = x.createLinearGradient(0, by, 0, bb); bgf.addColorStop(0, 'rgba(0,0,0,.34)'); bgf.addColorStop(1, 'rgba(0,0,0,.2)'); x.shadowColor = 'rgba(0,0,0,.4)'; x.shadowBlur = 7; x.shadowOffsetY = 3; x.fillStyle = bgf; x.fill(); x.restore();
  rr(x, bx, by, IW, bh, 8.4); x.strokeStyle = 'rgba(255,255,255,.55)'; x.lineWidth = 1; x.stroke();
  rr(x, bx + 2.45, by + 2.45, IW - 4.9, bh - 4.9, 6.5); x.strokeStyle = 'rgba(0,0,0,.35)'; x.stroke(); rr(x, bx + 3, by + 3, IW - 6, bh - 6, 6); x.strokeStyle = 'rgba(255,255,255,.2)'; x.stroke();
  const cell = (lbl, val, cx, cy, mw, lines) => { txt(x, lbl, cx, cy + 6.9, 6.86, 400, '#a3a3ab', 1.5, 'left'); x.font = `400 8.96px ${FONT}`;
    const vs = lines ? wrap(x, val, mw, 8.96, 400, .36).slice(0, 2) : [val]; vs.forEach((s, i) => { let t = s; while (t.length > 3 && tw(x, t, 8.96, 400, .36) > mw) t = t.slice(0, -2); if (t !== s) t += '…'; txt(x, t, cx, cy + 19 + i * 11.2, 8.96, 400, '#f0f0f3', .36, 'left'); }); };
  const y0 = by + 16, cw = IW / 3; const dash = (x1, y1, x2, y2) => { x.save(); x.setLineDash([3, 3]); x.strokeStyle = 'rgba(255,255,255,.28)'; x.lineWidth = 1; x.beginPath(); x.moveTo(x1, y1); x.lineTo(x2, y2); x.stroke(); x.restore(); };
  cell('NOMBRE DE ARCHIVO', info.file, bx + 10, y0 - 4, IW - 20); dash(bx + 3, y0 + 21, bx + IW - 3, y0 + 21);
  cell('N.º DE DIBUJO', info.num, bx + 10, y0 + 24, cw - 16); cell('DIMENSIONES', info.dim, bx + cw + 10, y0 + 24, cw - 16); cell('TAMAÑO', info.kb, bx + 2 * cw + 10, y0 + 24, cw - 16);
  dash(bx + cw, y0 + 21, bx + cw, y0 + 21 + rowH - 2); dash(bx + 2 * cw, y0 + 21, bx + 2 * cw, y0 + 21 + rowH - 2); dash(bx + 3, y0 + 21 + rowH - 1, bx + IW - 3, y0 + 21 + rowH - 1);
  cell('COPYRIGHT', info.copy, bx + 10, y0 + 21 + rowH + 1, IW - 20, true);
  const tabT = 'DATOS DEL ARCHIVO', tabW = tw(x, tabT, 6.44, 400, 1.67) + 20; rr(x, 250 - tabW / 2, by - 6, tabW, 12, 6); x.fillStyle = '#26262a'; x.fill(); x.strokeStyle = 'rgba(255,255,255,.55)'; x.lineWidth = 1; x.stroke(); txt(x, tabT, 250, by + 2.6, 6.44, 400, '#e4e4e8', 1.67);

  /* materiales: etiquetas tipo boleto + paleta */
  const rows = [['AÑO', w.year ? [w.year] : []], ['PAPEL', w.paper ? [w.paper] : []], ['CATEGORÍA', w.cats || []], ['TÉCNICAS', w.techs || []]].filter(r => r[1].length);
  const pal = w.palette && w.palette.length ? w.palette : null, avail = by - 10 - top;
  const build = f => { const fs = 11.06 * f, em = fs, ph = fs * 2.74, gap = 5.6 * f, lab = 9.45 * f, rg = 9.8 * f; let tot = 0; const L = [];
    rows.forEach(([lbl, vals]) => { const ws = vals.map(v => tw(x, v, fs, 700, fs * .1) + 5 * em), lines = []; let cur = [], cw0 = 0;
      vals.forEach((v, i) => { if (cur.length && cw0 + gap + ws[i] > IW) { lines.push(cur); cur = []; cw0 = 0; } cur.push({ v, w: Math.min(ws[i], IW) }); cw0 += (cur.length > 1 ? gap : 0) + ws[i]; }); if (cur.length) lines.push(cur);
      const hh = lab + 7.7 * f + lines.length * ph + (lines.length - 1) * gap; L.push({ lbl, lines, hh }); tot += hh + rg; });
    if (pal) { const hh = lab + 7.7 * f + 24 * f; L.push({ pal: true, lbl: 'PALETA DE COLORES', hh }); tot += hh + rg; }
    return { L, tot: tot - rg, fs, em, ph, gap, lab, rg, f }; };
  let B = build(1); if (B.tot > avail) B = build(Math.max(.6, avail / B.tot * .98));
  let yy = top + Math.max(0, (avail - B.tot) / 2);
  for (const r of B.L) { txt(x, r.lbl, 250, yy + B.lab * .8, B.lab * .95, 400, '#cfcfd5', B.lab * .3 * .95); let ly = yy + B.lab + 7.7 * B.f;
    if (r.pal) { const pw = IW * .92, ph = 24 * B.f, px = 250 - pw / 2; x.save(); x.shadowColor = 'rgba(0,0,0,.45)'; x.shadowBlur = 0; rr(x, px - 3, ly - 3, pw + 6, ph + 6, (ph + 6) / 2); x.fillStyle = 'rgba(0,0,0,.45)'; x.fill(); rr(x, px - 1.5, ly - 1.5, pw + 3, ph + 3, (ph + 3) / 2); x.fillStyle = 'rgba(255,255,255,.65)'; x.fill(); x.restore();
      x.save(); rr(x, px, ly, pw, ph, ph / 2); x.clip(); const tot = pal.reduce((s, q) => s + q.p, 0); let cx0 = px; pal.forEach(q => { const sw = pw * q.p / tot; x.fillStyle = q.c; x.fillRect(cx0, ly, sw + .5, ph); cx0 += sw; });
      const gl = x.createLinearGradient(0, ly, 0, ly + ph); gl.addColorStop(0, 'rgba(255,255,255,.35)'); gl.addColorStop(.55, 'rgba(255,255,255,0)'); gl.addColorStop(1, 'rgba(0,0,0,.18)'); x.fillStyle = gl; x.fillRect(px, ly, pw, ph); x.restore(); }
    else r.lines.forEach(line => { const lw = line.reduce((s, t) => s + t.w, 0) + B.gap * (line.length - 1); let lx = 250 - lw / 2;
      line.forEach(t => { plate(x, t.v, lx, ly, t.w, B.ph, B.fs); lx += t.w + B.gap; }); ly += B.ph + B.gap; });
    yy += r.hh + B.rg; }
  x.restore(); x.save(); x.clip(out); x.strokeStyle = 'rgba(255,255,255,.4)'; x.lineWidth = 1.5; x.stroke(out); x.restore();
  return c;
}
function plate(x, t, px, py, w, h, em) {
  x.save(); x.translate(px, py); const p = new Path2D(T.platePath(w, h, em)); x.save(); x.translate(.5, .5); x.shadowColor = 'rgba(0,0,0,.6)'; x.shadowBlur = 3; x.shadowOffsetY = 2;
  const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#c4c4cc'); x.fillStyle = g; x.fill(p); x.restore();
  x.save(); x.translate(.5, .5); x.strokeStyle = 'rgba(10,10,12,.95)'; x.lineWidth = 1; x.stroke(p); x.restore();
  const y1 = em * .3 + .5, y2 = h - em * .3 - .5, x1 = em * 1.15, x2 = w - em * 1.15, my = h / 2, d = em * .2;
  x.strokeStyle = 'rgba(0,0,0,.45)'; x.lineWidth = 1; x.beginPath(); x.moveTo(x1, y1); x.lineTo(x2, y1); x.moveTo(x1, y2); x.lineTo(x2, y2); x.stroke();
  x.fillStyle = '#141417'; [em * .78, w - em * .78].forEach(cx => { x.beginPath(); x.moveTo(cx, my - d); x.lineTo(cx + d, my); x.lineTo(cx, my + d); x.lineTo(cx - d, my); x.closePath(); x.fill(); });
  txt(x, t, w / 2, h / 2 + em * .36, em, 700, '#141417', em * .1); x.restore();
}

const toBlob = c => new Promise((res, rej) => { try { c.toBlob(b => b ? res(b) : rej(new Error('blob')), 'image/png'); } catch (e) { rej(e); } });
const save = (blob, name) => { const a = T.h('a', { href: URL.createObjectURL(blob), download: name }); document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 5000); };
const slug = s => String(s || 'carta').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50) || 'carta';

/* w: obra (puede ser un borrador del editor). Descarga «<título>-FRENTE.png» y «<título>-ATRAS.png». */
T.exportarCarta = async function (w, isNew) {
  if (document.fonts && document.fonts.ready) await document.fonts.ready;
  const r = T.safeUrl(w.img) ? await T.infoImg(w) : { dim: '', bytes: 0 };
  const info = { file: T.fileOf(w), num: w.num || (isNew ? T.nextNum() : T.numOf(w)), dim: T.fmtDim(w.dim || r.dim), kb: w.kb ? T.fmtKb(w.kb * 1024) : T.fmtKb(r.bytes), copy: T.copyOf(w) };
  const full = Object.assign({}, w); if (!(full.palette && full.palette.length) && T.safeUrl(w.img)) { try { full.palette = (await T.extraerPaleta(w.img)) || []; } catch (e) {} }
  const base = slug(w.title);
  const f = await toBlob(await frente(full)); save(f, base + '-FRENTE.png');
  await new Promise(r => setTimeout(r, 450));
  const a = await toBlob(await atras(full, info)); save(a, base + '-ATRAS.png');
};
})(window.TCG);
