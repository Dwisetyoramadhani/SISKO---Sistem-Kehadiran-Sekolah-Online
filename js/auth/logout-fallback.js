(function(){
  document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('btnLogout') ||
                document.querySelector('[data-action="logout"]') ||
                document.querySelector('[data-logout]');
    if (!btn) return;

    if (btn.__logoutBound) return;
    btn.__logoutBound = true;

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      try { localStorage.removeItem('sisko_session'); } catch {}
      try { localStorage.removeItem('sisko_token'); } catch {}
      window.location.href = '/login.html';
    });
  });
})();