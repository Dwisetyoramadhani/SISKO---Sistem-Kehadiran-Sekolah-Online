(function () {
  document.addEventListener('DOMContentLoaded', () => {
    const sess = getSession();
    if (!sess) return;

    const displayName = sess.nama || sess.username || '-';
    const classLabel = sess.role === 'admin' ? '' : `${sess.kelas || ''} ${sess.jurusan || ''}`.trim();

    setText([
      '#navbarUserName',
      '.navbar-user-name',
      '[data-navbar="user-name"]',
      '.nav-username'
    ], displayName);

    if (classLabel) {
      setText([
        '#navbarUserClass',
        '.navbar-user-class',
        '[data-navbar="user-class"]',
        '.nav-user-class'
      ], classLabel);
    }

    setTitle([
      '#navbarUserName',
      '.navbar-user-name',
      '[data-navbar="user-name"]',
      '.nav-username'
    ], classLabel ? `${displayName} — ${classLabel}` : displayName);

    toggleRole('.nav-admin-only', sess.role === 'admin');
    toggleRole('.nav-kelas-only', sess.role === 'kelas');

    const logoutBtn = document.querySelector('#btnLogout, [data-action="logout"]');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        try { window.Auth?.clearSession ? window.Auth.clearSession() : localStorage.removeItem('sisko_session'); } catch {}
        location.href = '/pages/login.html';
      });
    }
  });

  function getSession() {
    try {
      if (typeof window.Auth?.session === 'function') return window.Auth.session();
      return JSON.parse(localStorage.getItem('sisko_session') || 'null');
    } catch { return null; }
  }

  function setText(selectors, value) {
    selectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(el => { el.textContent = value; });
    });
  }
  function setTitle(selectors, value) {
    selectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(el => { el.title = value; });
    });
  }
  function toggleRole(selector, show) {
    document.querySelectorAll(selector).forEach(el => {
      el.classList.toggle('d-none', !show);
      el.hidden = !show;
    });
  }
})();