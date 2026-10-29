/* Disuasión de capturas de pantalla (ninguna web puede bloquearlas del todo):
   intercepta PrtSc, Ctrl+Shift+S, Shift+Win+S y Cmd+Shift+3-5, vacía el portapapeles y tapa
   el contenido al perder el foco. Sólo se aplica en modo VISITANTE: al iniciar sesión como
   administrador (T.admin) queda desactivada por completo y se retira el velo si estaba puesto. */
(function (T) {
'use strict';
let shT = 0;
/* Visitante = no hay sesión de administrador iniciada */
const visitante = () => T.admin !== true;
const limpiar = () => { clearTimeout(shT); document.body.classList.remove('shielded'); };
const cover = ms => { if (!visitante()) { limpiar(); return; } document.body.classList.add('shielded'); clearTimeout(shT); if (ms) shT = setTimeout(() => { if (document.hasFocus()) document.body.classList.remove('shielded'); }, ms); };
const uncover = () => { if (!visitante()) { limpiar(); return; } clearTimeout(shT); shT = setTimeout(() => document.body.classList.remove('shielded'), 180); };
const wipeClip = () => { try { navigator.clipboard && navigator.clipboard.writeText(' ').catch(() => {}); } catch (e) {} };
const shotKey = e => {
  const key = String(e.key || '').toLowerCase(), code = String(e.code || '').toLowerCase();
  const teclaS = code === 'keys' || key === 's' || e.keyCode === 83;
  const printScreen = key === 'printscreen' || key === 'prtsc' || code === 'printscreen' || e.keyCode === 44;
  const ctrlShiftS = e.ctrlKey && e.shiftKey && !e.altKey && teclaS;
  const winShiftS = e.shiftKey && (e.metaKey || e.osKey) && !e.altKey && teclaS;
  const macCapture = e.metaKey && e.shiftKey && (/^(digit[3-6]|[3-6])$/.test(code || key) || e.ctrlKey && /^(digit[3-4]|[3-4])$/.test(code || key));
  return printScreen || ctrlShiftS || winShiftS || macCapture;
};
['keydown', 'keyup'].forEach(k => addEventListener(k, e => { if (!visitante() || !shotKey(e)) return; e.preventDefault(); e.stopPropagation(); cover(3500); wipeClip(); setTimeout(wipeClip, 150); setTimeout(wipeClip, 600); }, true));
addEventListener('blur', () => cover(0)); addEventListener('focus', uncover);
document.addEventListener('visibilitychange', () => { if (!visitante()) return; if (document.hidden) cover(0); else uncover(); });
document.addEventListener('contextmenu', e => { if (!visitante() || (e.target.closest && e.target.closest('input,textarea'))) return; e.preventDefault(); });
document.addEventListener('dragstart', e => { if (visitante()) e.preventDefault(); });
document.addEventListener('copy', e => { if (!visitante() || (e.target.closest && e.target.closest('input,textarea'))) return; e.preventDefault(); });
addEventListener('beforeprint', () => cover(0)); addEventListener('afterprint', uncover);
/* admin.js llama a T.proteccionLimpiar() al activar la barra de administración */
T.proteccionLimpiar = limpiar;
})(window.TCG);
