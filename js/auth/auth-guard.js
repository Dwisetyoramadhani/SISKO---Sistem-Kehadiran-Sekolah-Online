(function(){
  const LOGIN = '/pages/login.html';
  const ADMIN_DASH = '/pages/dashboard/index.html';
  const KELAS_DASH = '/pages/kelas-dashboard/index.html';

  document.addEventListener('DOMContentLoaded', guard);

  function path(){
    return (location.pathname||'').replace(/\\/g,'/').toLowerCase();
  }

  function guard() {
    let sess = null;
    try {
      const s = window.Auth?.session;
      sess = typeof s === 'function'
        ? s()
        : (s || JSON.parse(localStorage.getItem('sisko_session') || 'null'));
    } catch { sess = null; }

    if (!sess || !sess.role) {
      const p = path();
      const isLogin = p === LOGIN.toLowerCase();

      if (!sess && !isLogin){
        location.replace(LOGIN);
        return;
      }
      if (sess && isLogin){
        redirectByRole(sess);
        return;
      }
      if (!sess) return;

      if (sess.role === 'kelas' && p === ADMIN_DASH.toLowerCase()){
        if (p !== KELAS_DASH.toLowerCase()){
          location.replace(KELAS_DASH);
        }
        return;
      }
    }
  }

  function redirectByRole(s){
    location.replace(s.role === 'admin' ? ADMIN_DASH : KELAS_DASH);
  }

  window.AuthGuard = { redirectByRole };
})();