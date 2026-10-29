/* Cabecera: título del sitio e insignia estándar (sustituye al antiguo logotipo) */
(function (T) {
'use strict';
const h1 = document.getElementById('siteTitle'), hero = document.querySelector('.hero'); if (!h1 || !hero) return;
const mark = T.insignia('normal'); mark.id = 'heroMark'; mark.classList.add('hero-cas'); hero.prepend(mark);
T.setTitle = s => { if (h1.textContent !== s) h1.textContent = s; document.title = (s || 'Galería') + ' · Galería'; };
})(window.TCG);
