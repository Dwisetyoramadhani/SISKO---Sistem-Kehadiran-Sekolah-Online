(function(){
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-component]').forEach(el => {
      const name = el.getAttribute('data-component');
      const map = {
        'navbar': '/components/navbar.html',
        'sidebar': '/components/sidebar.html',
        'sidebar-kelas': '/components/sidebar-kelas.html'
      };
      const url = map[name];
      if (!url) return;
      fetch(url)
        .then(r=>r.text())
        .then(html=>{ el.outerHTML = html; })
        .catch(err=>console.error('Load component gagal', name, err));
    });
  });
})();
