/* Insignia CAS · Carl Art Sketch (SVG vectorial: el texto circular gira, el resto queda fijo) */
(function (T) {
'use strict';
let n = 0;
T.insignia = function (tipo) {
  const id = 'casr' + (++n), d = document.createElement('div');
  d.className = 'cas' + (tipo === 'dorada' ? ' oro' : ''); d.setAttribute('aria-hidden', 'true');
  d.innerHTML = `<svg viewBox="0 0 300 300" focusable="false">
<defs><path id="${id}" d="M150,150 m-125,0 a125,125 0 1,1 250,0 a125,125 0 1,1 -250,0"/></defs>
<circle class="cas-bg" cx="150" cy="150" r="147"/>
<g class="cas-ring">
  <text class="cas-t" font-size="19" letter-spacing="7" text-anchor="middle"><textPath href="#${id}" startOffset="25%">CARL ART SKETCH</textPath></text>
  <text class="cas-t" font-size="19" letter-spacing="7" text-anchor="middle"><textPath href="#${id}" startOffset="75%">CARL ART SKETCH</textPath></text>
  <circle class="cas-dot" cx="25" cy="150" r="4"/><circle class="cas-dot" cx="275" cy="150" r="4"/>
</g>
<circle class="cas-aro" cx="150" cy="150" r="98"/>
<circle class="cas-aro2" cx="150" cy="150" r="80"/>
<circle class="cas-dot" cx="38" cy="150" r="3.4"/><circle class="cas-dot" cx="262" cy="150" r="3.4"/>
<text class="cas-l" x="154" y="157" font-size="46" letter-spacing="8" text-anchor="middle">CAS</text>
<line class="cas-ln" x1="125" x2="175" y1="171" y2="171"/>
<text class="cas-s" x="151.500" y="187" font-size="9.500" letter-spacing="3" text-anchor="middle">DIBUJO · PINTURA</text>
</svg>`;
  return d;
};
/* versión autónoma (sin variables CSS) para dibujarla en un lienzo */
T.insigniaSvg = function (tipo) {
  const oro = tipo === 'dorada', c = oro ? { bg: 'rgba(30,22,5,.74)', bs: 'rgba(232,194,92,.75)', sub: '#f0d58a', acc: '#e3b94a', ink: '#fff1c2' } : { bg: 'rgba(18,18,21,.66)', bs: 'rgba(255,255,255,.3)', sub: '#d9d9de', acc: '#c8c8ce', ink: '#f4f4f6' };
  const s = T.insignia(tipo).innerHTML.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" ');
  const css = `.cas-bg{fill:${c.bg};stroke:${c.bs};stroke-width:2.5}.cas-t{fill:${c.sub};font-family:Helvetica,Arial,sans-serif;font-weight:600}.cas-dot{fill:${c.acc}}.cas-aro{fill:none;stroke:${c.ink};stroke-width:2.6}.cas-aro2{fill:none;stroke:${c.acc};stroke-width:2.2;stroke-dasharray:5 5}.cas-l{fill:${c.ink};font-family:\'Cormorant Garamond\',Georgia,serif;font-weight:500}.cas-ln{stroke:${c.acc};stroke-width:2.2}.cas-s{fill:${c.sub};font-family:Helvetica,Arial,sans-serif;font-weight:600}`;
  return s.replace('</defs>', '</defs><style>' + css + '</style>');
};
})(window.TCG);
