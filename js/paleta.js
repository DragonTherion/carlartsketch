/* Paleta de colores: se extrae de la imagen (corte por mediana) y se dibuja como una barra horizontal.
   Si la imagen es de otro sitio sin permiso CORS el navegador no deja leer sus píxeles: en ese caso no hay paleta. */
(function (T) {
'use strict';
const { h } = T;
const hex2 = n => n.toString(16).padStart(2, '0');

function cortePorMediana(px, n) {
  const boxes = [px];
  const rango = b => { const mn = [255, 255, 255], mx = [0, 0, 0]; for (const p of b) for (let k = 0; k < 3; k++) { if (p[k] < mn[k]) mn[k] = p[k]; if (p[k] > mx[k]) mx[k] = p[k]; } return mx.map((v, k) => v - mn[k]); };
  while (boxes.length < n) {
    let bi = -1, best = 0;
    boxes.forEach((b, i) => { if (b.length < 2) return; const s = Math.max(...rango(b)) * Math.sqrt(b.length); if (s > best) { best = s; bi = i; } });
    if (bi < 0) break;
    const b = boxes[bi], r = rango(b), ch = r.indexOf(Math.max(...r));
    b.sort((p, q) => p[ch] - q[ch]);
    const mid = b.length >> 1; boxes.splice(bi, 1, b.slice(0, mid), b.slice(mid));
  }
  return boxes.filter(b => b.length).map(b => { const m = [0, 0, 0]; for (const p of b) { m[0] += p[0]; m[1] += p[1]; m[2] += p[2]; } return { rgb: m.map(v => v / b.length), n: b.length }; });
}

/* → Promise<[{c:'#rrggbb', p:porcentaje}] | null> */
T.extraerPaleta = function (src, count = 6) {
  return new Promise(resolve => {
    const u = T.safeUrl(src); if (!u) return resolve(null);
    const im = new Image(); if (!u.startsWith('data:')) im.crossOrigin = 'anonymous';
    im.onerror = () => resolve(null);
    im.onload = () => {
      try {
        const w0 = im.naturalWidth || 300, h0 = im.naturalHeight || 300, s = 80 / Math.max(w0, h0);
        const cv = document.createElement('canvas'); cv.width = Math.max(1, Math.round(w0 * s)); cv.height = Math.max(1, Math.round(h0 * s));
        const cx = cv.getContext('2d', { willReadFrequently: true }); cx.fillStyle = '#fff'; cx.fillRect(0, 0, cv.width, cv.height); cx.drawImage(im, 0, 0, cv.width, cv.height);
        const d = cx.getImageData(0, 0, cv.width, cv.height).data, px = [];
        for (let i = 0; i < d.length; i += 4) px.push([d[i], d[i + 1], d[i + 2]]);
        if (!px.length) return resolve(null);
        let cols = cortePorMediana(px, count + 2).sort((a, b) => b.n - a.n);
        /* une colores casi idénticos */
        const out = [];
        for (const c of cols) { const near = out.find(o => Math.hypot(o.rgb[0] - c.rgb[0], o.rgb[1] - c.rgb[1], o.rgb[2] - c.rgb[2]) < 26); if (near) { const t = near.n + c.n; near.rgb = near.rgb.map((v, k) => (v * near.n + c.rgb[k] * c.n) / t); near.n = t; } else out.push({ rgb: c.rgb.slice(), n: c.n }); }
        const top = out.sort((a, b) => b.n - a.n).slice(0, count), tot = top.reduce((a, c) => a + c.n, 0);
        resolve(top.map(c => ({ c: '#' + c.rgb.map(v => hex2(Math.round(v))).join(''), p: Math.max(1, Math.round(c.n / tot * 100)) })));
      } catch (e) { resolve(null); }   /* lienzo "contaminado" (imagen externa sin CORS) */
    };
    im.src = u;
  });
};

/* Barra horizontal: cada color ocupa un tramo proporcional a su presencia (con un mínimo para que se vea) */
T.paletaBar = function (pal) {
  const bar = h('div', { class: 'pal', role: 'img', 'aria-label': 'Paleta de colores: ' + pal.map(x => x.c).join(', ') });
  for (const x of pal) bar.append(h('i', { style: `flex:${Math.max(x.p, 7)};background:${x.c}`, title: x.c.toUpperCase() }));
  return bar;
};
})(window.TCG);
