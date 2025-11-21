// Memuat komponen HTML dari /components dan mengeksekusi <script> di dalamnya
(function () {
  const MAP = {
    navbar: '/components/navbar.html',
    sidebar: '/components/sidebar.html',
    'sidebar-kelas': '/components/sidebar-kelas.html',
  };

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-component]').forEach(async (placeholder) => {
      const name = placeholder.getAttribute('data-component');
      const url = MAP[name];
      if (!url) return;

      try {
        const res = await fetch(url, { cache: 'no-cache' });
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        const html = await res.text();

        const wrap = document.createElement('div');
        wrap.innerHTML = html.trim();
        const node = wrap.firstElementChild || document.createTextNode('');

        placeholder.replaceWith(node);

        node.querySelectorAll('script').forEach((old) => {
          const s = document.createElement('script');
          [...old.attributes].forEach((a) => s.setAttribute(a.name, a.value));
          if (old.src) {
            s.src = old.src;
          } else {
            s.textContent = old.textContent || '';
          }
          old.replaceWith(s);
        });
      } catch (err) {
        console.error(`Gagal load komponen: ${name} → ${url}`, err);
      }
    });
  });
})();
