try {
  document.documentElement.dataset.theme = localStorage.getItem('tcg_theme') === 'dark' ? 'dark' : 'light';
} catch (e) {
  document.documentElement.dataset.theme = 'light';
}
