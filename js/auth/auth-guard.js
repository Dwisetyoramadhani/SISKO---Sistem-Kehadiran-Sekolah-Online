(function(){
  const LOGIN = '/pages/login.html';
  const ADMIN_DASH = '/pages/dashboard/index.html';
  const KELAS_DASH = '/pages/kelas-dashboard/index.html';

  document.addEventListener('DOMContentLoaded', guard);

  function path(){
    return (location.pathname||'').replace(/\\/g,'/').toLowerCase();
  }

  function guard(){
    const sess = window.Auth?.session();
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

    // Kelas tidak boleh dashboard admin
    if (sess.role === 'kelas' && p === ADMIN_DASH.toLowerCase()){
      if (p !== KELAS_DASH.toLowerCase()){
        location.replace(KELAS_DASH);
      }
      return;
    }
    // Admin bebas akses semua termasuk kelas-kehadiran & kehadiran
  }

  function redirectByRole(s){
    location.replace(s.role === 'admin' ? ADMIN_DASH : KELAS_DASH);
  }

  window.AuthGuard = { redirectByRole };
})();