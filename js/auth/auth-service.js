(function(){
  window.Auth = {
    users: AuthStorage.getUsers,
    addUser: AuthStorage.createUser,
    login: AuthStorage.login,
    logout: AuthStorage.logout,
    session: AuthStorage.current,
    isAdmin: AuthStorage.isAdmin,
    isKelas: AuthStorage.isKelas
  };
  
  function parseKelasUsername(u){
    const raw = String(u||'').trim().toLowerCase();
    const parts = raw.split('_').filter(Boolean);
    if (!parts.length) return null;
    const cap = s => s.replace(/\b\w/g, c => c.toUpperCase());
    if (parts.length === 1) return { kelas: cap(parts[0]), jurusan: '' };
    const kelas = cap(parts[0]);        
    const jurusan = cap(parts.slice(1).join(' ')); 
    return { kelas, jurusan };
  }

  function parseKelasFromUsername(username){
    if (!username) return { kelas:'', jurusan:'' };
    const parts = String(username).toLowerCase().split('_').filter(Boolean);
    if (!parts.length) return { kelas:'', jurusan:'' };
    const kelas = parts[0].toUpperCase();           // x → X
    const jurusan = parts.slice(1).map(p => (/^\d+$/.test(p)? p : p.toUpperCase())).join(' ').trim(); // rpl_1 → RPL 1
    return { kelas, jurusan };
  }

  function migrateUserKelasFields(users){
    let changed = false;
    users.forEach(u=>{
      if (u.role === 'kelas' && (!u.kelas || !u.jurusan)){
        const parsed = parseKelasUsername(u.username);
        if (parsed){
          u.kelas = parsed.kelas;
          u.jurusan = parsed.jurusan;
          changed = true;
        }
      }
    });
    if (changed) saveUsers(users);
  }

  function migrateUserKelasFields(users){
    let changed = false;
    users.forEach(u=>{
      if (u.role && u.role !== 'admin') {
        if (!u.kelas || !u.jurusan){
          const p = parseKelasFromUsername(u.username);
          if (p.kelas || p.jurusan){
            u.kelas = u.kelas || p.kelas;
            u.jurusan = u.jurusan || p.jurusan;
            changed = true;
          }
        }
      }
    });
    if (changed) saveUsers(users);
  }

  function loadUsers(){
    const list = JSON.parse(localStorage.getItem('sisko_users') || '[]');
    migrateUserKelasFields(list);
    return list;
  }
  function saveUsers(list){
    localStorage.setItem('sisko_users', JSON.stringify(list || []));
  }

  function login(username, password){
    username = String(username||'').trim();
    password = String(password||'');
    const users = loadUsers();
    const found = users.find(u => u.username === username && u.password === password);
    if (!found) throw new Error('Username / password salah');

    if (found.role !== 'admin') {
      if (!found.kelas || !found.jurusan){
        const p = parseKelasFromUsername(found.username);
        found.kelas = found.kelas || p.kelas;
        found.jurusan = found.jurusan || p.jurusan;
        saveUsers(users);
      }
    }

    const session = {
      userId: found.id,
      username: found.username,
      role: found.role,
      nama: found.nama || found.username,
      kelas: found.role === 'admin' ? '' : (found.kelas || parseKelasFromUsername(found.username).kelas || ''),
      jurusan: found.role === 'admin' ? '' : (found.jurusan || parseKelasFromUsername(found.username).jurusan || ''),
      loginTime: Date.now()
    };

    if (window.Auth?.setSession) window.Auth.setSession(session);
    else localStorage.setItem('sisko_session', JSON.stringify(session));
    return session;
  }
})();