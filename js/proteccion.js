/* Disuasión de capturas de pantalla (ninguna web puede bloquearlas del todo):
   intercepta PrtSc / Shift+Win+S / Cmd+Shift+3-5, vacía el portapapeles y tapa el contenido al perder el foco. */
(function (T) {
'use strict';
let shT = 0;
const cover = ms => { document.body.classList.add('shielded'); clearTimeout(shT); if (ms) shT = setTimeout(() => { if (document.hasFocus()) document.body.classList.remove('shielded'); }, ms); };
const uncover = () => { clearTimeout(shT); shT = setTimeout(() => document.body.classList.remove('shielded'), 180); };
const wipeClip = () => { try { navigator.clipboard && navigator.clipboard.writeText(' ').catch(() => {}); } catch (e) {} };
const shotKey = e => e.key === 'PrintScreen' || e.code === 'PrintScreen' || e.keyCode === 44 ||
  (e.shiftKey && e.metaKey && (e.code === 'KeyS' || String(e.key).toLowerCase() === 's')) || (e.metaKey && e.shiftKey && /^(Digit[345]|[345])$/.test(e.code || e.key));
['keydown', 'keyup'].forEach(k => addEventListener(k, e => { if (shotKey(e)) { e.preventDefault(); e.stopPropagation(); cover(3500); wipeClip(); setTimeout(wipeClip, 150); setTimeout(wipeClip, 600); } }, true));
addEventListener('blur', () => cover(0)); addEventListener('focus', uncover);
document.addEventListener('visibilitychange', () => { if (document.hidden) cover(0); else uncover(); });
document.addEventListener('contextmenu', e => { if (!(e.target.closest && e.target.closest('input,textarea'))) e.preventDefault(); });
document.addEventListener('dragstart', e => e.preventDefault());
document.addEventListener('copy', e => { if (!(e.target.closest && e.target.closest('input,textarea'))) e.preventDefault(); });
addEventListener('beforeprint', () => cover(0)); addEventListener('afterprint', uncover);
})(window.TCG);
