/* Arranque: carga data/obras.json, restablece la sesión de administrador y pinta la galería */
(function (T) {
'use strict';
(async () => {
  await T.cargar();
  try { T.admin = sessionStorage.getItem(T.SS) === '1' && !!T.DB.auth; } catch (e) { T.admin = false; }
  if (T.admin) T.buildBar();
  T.render();
})();
})(window.TCG);
