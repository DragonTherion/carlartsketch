/* Filtro por nodos: cada etiqueta es un nodo que se puede arrastrar y conectar con líneas.
   Regla: una línea = «Y» (la obra debe cumplir los nodos unidos); grupos sin unir = «O» (basta con cumplir un grupo).
   El nodo AÑO abre un selector con los años que existen en la galería. */
(function (T) {
'use strict';
const { $, h, clamp } = T;
const KEY = 'tcg_filtro_v2', NS = 'http://www.w3.org/2000/svg';
let st = null, nodes = [];

/* ---------- nodos (salen de data/opciones.json) ---------- */
function construir() {
  const o = T.OPC, tam = s => { const m = String(s).match(/(\d+[.,]?\d*\s*[x×]\s*\d+[.,]?\d*.*)$/i); return m ? m[1].trim() : String(s); };
  nodes = [{ id: 'year', tipo: 'year', label: 'AÑO' },
    ...o.papel.map(p => ({ id: 'p:' + p, tipo: 'paper', val: p, label: 'PAPEL ' + tam(p) })),
    ...o.categoria.map(c => ({ id: 'c:' + c, tipo: 'cat', val: c, label: c })),
    ...o.tecnicas.map(t => ({ id: 't:' + t, tipo: 'tech', val: t, label: t }))];
}
function ensure() {
  if (st) return; construir();
  let r = null; try { r = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) {}
  const ids = new Set(nodes.map(n => n.id)); r = r && typeof r === 'object' ? r : {};
  st = { on: (r.on || []).filter(i => ids.has(i) && i !== 'year'), years: Array.isArray(r.years) ? r.years.map(String).slice(0, 40) : [],
    edges: (r.edges || []).filter(e => Array.isArray(e) && e.length === 4 && ids.has(e[0]) && ids.has(e[2]) && e[0] !== e[2] && /^[lr]$/.test(e[1]) && /^[lr]$/.test(e[3])), pos: {} };
  for (const k in (r.pos || {})) if (ids.has(k) && Number.isFinite(r.pos[k].x) && Number.isFinite(r.pos[k].y)) st.pos[k] = { x: r.pos[k].x, y: r.pos[k].y };
}
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} };
const isOn = id => id === 'year' ? st.years.length > 0 : st.on.includes(id);
const match = (n, w) => n.tipo === 'year' ? st.years.includes(w.year) : n.tipo === 'paper' ? w.paper === n.val : n.tipo === 'cat' ? (w.cats || []).includes(n.val) : (w.techs || []).includes(n.val);

/* grupos = componentes conectados de nodos activos */
function grupos() {
  const act = nodes.filter(n => isOn(n.id)), by = new Map(act.map(n => [n.id, n])), adj = new Map(act.map(n => [n.id, []]));
  for (const [a, , b] of st.edges) if (by.has(a) && by.has(b)) { adj.get(a).push(b); adj.get(b).push(a); }
  const seen = new Set(), out = [];
  for (const n of act) { if (seen.has(n.id)) continue; const comp = [], q = [n.id]; seen.add(n.id);
    while (q.length) { const c = q.pop(); comp.push(by.get(c)); for (const d of adj.get(c)) if (!seen.has(d)) { seen.add(d); q.push(d); } }
    out.push(comp); }
  return out;
}
const badge = () => { const b = $('#filterBtn .fbadge'); if (!b) return; const n = nodes.filter(x => isOn(x.id)).length; b.hidden = !n; b.textContent = n; };
T.filtrar = works => { ensure(); badge(); const g = grupos(); return g.length ? works.filter(w => g.some(c => c.every(n => match(n, w)))) : works; };
T.limpiarFiltro = () => { ensure(); st.on = []; st.edges = []; st.years = []; save(); badge(); T.render(); };

/* ---------- ventana ---------- */
const TIPO = { year: 'AÑO', paper: 'PAPEL', cat: 'CATEGORÍA', tech: 'TÉCNICA' };
const SNAP = 46;                       /* radio del imán (px) */
const dirOf = s => s === 'l' ? -1 : 1;
function abrir() {
  ensure(); document.querySelector('.fmodal') && document.querySelector('.fmodal').remove();
  const els = new Map(), ns = t => document.createElementNS(NS, t);
  const svg = ns('svg'); svg.setAttribute('class', 'fedges');
  const board = h('div', { class: 'fboard' }, svg), scroll = h('div', { class: 'fscroll' }, board);
  const cnt = h('button', { class: 'btn main' }), foot = h('div', { class: 'ffoot' }, h('span', { class: 'legend' }, 'Arrastra un punto ● hasta otro: se imanta · Línea = Y · Sin línea = O'),
    h('button', { class: 'btn', onclick: () => { st.on = []; st.edges = []; st.years = []; refresh(); } }, 'LIMPIAR'), cnt);
  const bg = h('div', { class: 'fmodal', onpointerdown: e => { if (e.target === bg) cerrar(); } },
    h('div', { class: 'fpanel', role: 'dialog', 'aria-label': 'Filtrar por nodos' },
      h('div', { class: 'fhead' }, h('h2', null, 'Filtrar por nodos'), h('button', { class: 'fx', 'aria-label': 'Cerrar', onclick: () => cerrar() }, '✕')), scroll, foot));
  document.body.append(bg);

  const sub = n => n.tipo === 'year' ? (st.years.length ? (st.years.length <= 3 ? [...st.years].sort().join(' · ') : st.years.length + ' años') : 'elegir años') : (n.tipo === 'paper' ? n.label.replace(/^PAPEL\s*/, '') : n.label);
  const titulo = n => n.tipo === 'year' ? 'AÑO' : n.tipo === 'paper' ? 'PAPEL' : n.label;
  const cuenta = n => n.tipo === 'year' ? T.DB.works.filter(w => w.year).length : T.DB.works.filter(w => match(n, w)).length;
  const grp = { year: 0, paper: 0, cat: 1, tech: 2 }, row = [0, 0, 0], colX = [30, 340, 650];
  nodes.forEach(n => {
    const mk = s => h('i', { class: 'fport ' + s, 'data-side': s, title: 'Arrastra hasta otro punto para conectar' });
    const el = h('div', { class: 'fnode t-' + n.tipo + (isOn(n.id) ? ' on' : ''), 'data-id': n.id },
      mk('l'), h('span', { class: 'fk' }, TIPO[n.tipo]), h('span', { class: 'fl' }, n.tipo === 'year' ? 'AÑO' : n.tipo === 'paper' ? n.label.replace(/^PAPEL\s*/, '') : n.label), h('span', { class: 'fs' }), h('b', { class: 'fn' }), mk('r'));
    const c = grp[n.tipo], p = st.pos[n.id] || { x: colX[c], y: 30 + 62 * row[c] }; row[c]++;
    el.style.left = p.x + 'px'; el.style.top = p.y + 'px'; board.append(el); els.set(n.id, el);
    const lab = () => { if (n.tipo === 'year') el.querySelector('.fk').textContent = st.years.length ? (st.years.length <= 3 ? [...st.years].sort().join(' · ') : st.years.length + ' AÑOS') : 'ELEGIR AÑOS'; el.querySelector('.fn').textContent = cuenta(n); el.classList.toggle('on', isOn(n.id)); };
    el._lab = lab; lab();

    el.addEventListener('pointerenter', () => lit(n.id, true)); el.addEventListener('pointerleave', () => lit(n.id, false));
    el.addEventListener('pointerdown', e => {
      if (e.target.closest('.fport') || e.button > 0) return;
      el.setPointerCapture(e.pointerId); const sx = e.clientX, sy = e.clientY, ox = el.offsetLeft, oy = el.offsetTop; let moved = false; cerrarPick();
      const mv = ev => { const dx = ev.clientX - sx, dy = ev.clientY - sy; if (!moved && Math.hypot(dx, dy) < 5) return; moved = true; el.classList.add('drag');
        el.style.left = clamp(ox + dx, 0, board.offsetWidth - el.offsetWidth) + 'px'; el.style.top = clamp(oy + dy, 0, board.offsetHeight - el.offsetHeight) + 'px'; dibujar(); };
      const up = () => { el.removeEventListener('pointermove', mv); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up); el.classList.remove('drag');
        if (moved) { st.pos[n.id] = { x: el.offsetLeft, y: el.offsetTop }; save(); } else if (n.tipo === 'year') abrirPick(el); else { st.on = isOn(n.id) ? st.on.filter(i => i !== n.id) : [...st.on, n.id]; refresh(); } };
      el.addEventListener('pointermove', mv); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
    });

    /* cable: sale de cualquier punto, el extremo es elástico y se imanta al punto más cercano */
    el.querySelectorAll('.fport').forEach(port => port.addEventListener('pointerdown', e => {
      e.stopPropagation(); e.preventDefault(); port.setPointerCapture(e.pointerId); cerrarPick(); const side = port.dataset.side;
      el.classList.add('linking'); board.classList.add('wiring');
      const tmp = ns('path'); tmp.setAttribute('class', 'fedge tmp'); svg.append(tmp);
      const a = ptPort(n.id, side), br = () => board.getBoundingClientRect(); let tgt = { x: a.x, y: a.y }, cur = { x: a.x, y: a.y }, snap = null, raf = 0, alive = true;
      const clearSnap = () => board.querySelectorAll('.fport.snap').forEach(x => x.classList.remove('snap'));
      const aim = ev => { const r = br(), m = { x: ev.clientX - r.left, y: ev.clientY - r.top }; let best = null, bd = SNAP;
        els.forEach((ne, id) => { if (id === n.id) return; ['l', 'r'].forEach(s => { const q = ptPort(id, s), d = Math.hypot(q.x - m.x, q.y - m.y); if (d < bd) { bd = d; best = { id, s, q }; } }); });
        if (!best) { const t = document.elementFromPoint(ev.clientX, ev.clientY), nn = t && t.closest && t.closest('.fnode'); if (nn && nn !== el) { const id = nn.dataset.id, s = m.x < nn.offsetLeft + nn.offsetWidth / 2 ? 'l' : 'r'; best = { id, s, q: ptPort(id, s) }; } }
        clearSnap(); snap = best; if (best) { els.get(best.id).querySelector('.fport.' + best.s).classList.add('snap'); tgt = best.q; } else tgt = m; };
      const frame = () => { if (!alive) return; cur.x += (tgt.x - cur.x) * (snap ? .45 : .8); cur.y += (tgt.y - cur.y) * (snap ? .45 : .8);
        tmp.setAttribute('d', cable(a, dirOf(side), cur, snap ? dirOf(snap.s) : -dirOf(side))); tmp.classList.toggle('snapped', !!snap); raf = requestAnimationFrame(frame); };
      const mv = ev => aim(ev);
      const up = () => { alive = false; cancelAnimationFrame(raf); port.removeEventListener('pointermove', mv); port.removeEventListener('pointerup', up); port.removeEventListener('pointercancel', up);
        el.classList.remove('linking'); board.classList.remove('wiring'); clearSnap(); tmp.remove(); if (snap) conectar(n.id, side, snap.id, snap.s); };
      port.addEventListener('pointermove', mv); port.addEventListener('pointerup', up); port.addEventListener('pointercancel', up); aim(e); frame();
    }));
  });

  function ptPort(id, s) { const e = els.get(id); return { x: e.offsetLeft + (s === 'l' ? 0 : e.offsetWidth), y: e.offsetTop + e.offsetHeight / 2 }; }
  function cable(p, dp, q, dq) { const k = Math.max(56, Math.abs(q.x - p.x) * .5); return `M${p.x} ${p.y}C${p.x + dp * k} ${p.y} ${q.x + dq * k} ${q.y} ${q.x} ${q.y}`; }
  function lit(id, on) { svg.querySelectorAll('.fedge').forEach(p => { if (p.dataset.a === id || p.dataset.b === id) p.classList.toggle('lit', on); }); }
  function dibujar() {
    svg.replaceChildren();
    st.edges.forEach(([a, sa, b, sb], i) => {
      if (!els.has(a) || !els.has(b)) return; const d = cable(ptPort(a, sa), dirOf(sa), ptPort(b, sb), dirOf(sb));
      const vis = ns('path'); vis.setAttribute('d', d); vis.setAttribute('class', 'fedge' + (isOn(a) && isOn(b) ? ' on' : '')); vis.dataset.a = a; vis.dataset.b = b;
      const hit = ns('path'); hit.setAttribute('d', d); hit.setAttribute('class', 'fhit'); hit.innerHTML = '<title>Clic para quitar la línea</title>';
      hit.addEventListener('pointerenter', () => vis.classList.add('cut')); hit.addEventListener('pointerleave', () => vis.classList.remove('cut'));
      hit.addEventListener('click', () => { st.edges.splice(i, 1); refresh(); });
      svg.append(vis, hit);
    });
    const used = new Set(); st.edges.forEach(([a, sa, b, sb]) => { used.add(a + sa); used.add(b + sb); });
    els.forEach((e, id) => e.querySelectorAll('.fport').forEach(pt => pt.classList.toggle('used', used.has(id + pt.dataset.side))));
  }
  function conectar(a, sa, b, sb) {
    if (a === b || st.edges.some(e => (e[0] === a && e[1] === sa && e[2] === b && e[3] === sb) || (e[0] === b && e[1] === sb && e[2] === a && e[3] === sa))) return;
    st.edges.push([a, sa, b, sb]); for (const id of [a, b]) if (id !== 'year' && !st.on.includes(id)) st.on.push(id); refresh();
  }
  function refresh() {
    els.forEach(e => e._lab()); dibujar(); save(); badge();
    const k = T.filtrar(T.DB.works).length, hay = nodes.some(n => isOn(n.id));
    cnt.textContent = hay ? 'VER ' + k + (k === 1 ? ' OBRA' : ' OBRAS') : 'VER TODAS (' + T.DB.works.length + ')';
  }

  /* selector de años */
  let pick = null, pickOff = null;
  function cerrarPick() { if (pick) { pick.remove(); pick = null; } if (pickOff) { document.removeEventListener('pointerdown', pickOff, true); pickOff = null; } }
  function abrirPick(el) {
    cerrarPick(); const years = [...new Set(T.DB.works.map(w => w.year).filter(Boolean))].sort().reverse();
    pick = h('div', { class: 'fpick' }, years.length ? h('div', { class: 'chips' }, ...years.map(y => T.tag(y, { tag: 'button', cls: 'chip plate' + (st.years.includes(y) ? ' on' : ''), deco: 'plate', check: true, attrs: { type: 'button' }, onclick: ev => {
      const b = ev.currentTarget; st.years = st.years.includes(y) ? st.years.filter(v => v !== y) : [...st.years, y]; b.classList.toggle('on', st.years.includes(y)); refresh(); } })))
      : h('p', { class: 'note', style: 'margin:0' }, 'Aún no hay obras con año registrado.'));
    pick.style.left = el.offsetLeft + 'px'; pick.style.top = (el.offsetTop + el.offsetHeight + 8) + 'px'; board.append(pick);
    pickOff = e => { if (!pick.contains(e.target) && !el.contains(e.target)) cerrarPick(); }; document.addEventListener('pointerdown', pickOff, true);
  }

  function cerrar() { cerrarPick(); removeEventListener('keydown', teclas, true); bg.remove(); T.render(); badge(); }
  const teclas = e => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); if (pick) cerrarPick(); else cerrar(); } };
  addEventListener('keydown', teclas, true);
  cnt.onclick = () => cerrar();
  refresh();
}
T.abrirFiltro = abrir;
document.addEventListener('DOMContentLoaded', () => { const b = $('#filterBtn'); if (b) b.addEventListener('click', abrir); });
})(window.TCG);
