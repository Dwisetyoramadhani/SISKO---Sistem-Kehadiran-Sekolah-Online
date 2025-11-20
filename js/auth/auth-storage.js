(function(){
  const USERS_KEY='sisko_users';
  const SESSION_KEY='sisko_session';

  function read(key, fb){ try { return JSON.parse(localStorage.getItem(key) ?? fb); } catch { return JSON.parse(fb); } }
  function write(key,v){ localStorage.setItem(key, JSON.stringify(v)); }

  function getUsers(){ return read(USERS_KEY,'[]'); }
  function saveUsers(list){ write(USERS_KEY,list); }

  (function seed(){
    if (getUsers().length) return;
    saveUsers([
      { id:1, username:'admin', password:'admin123', role:'admin', kelas:null, jurusan:null },
      { id:2, username:'x_rpl_1', password:'kelas123', role:'kelas', kelas:'X', jurusan:'RPL 1' }
    ]);
    console.info('[AuthStorage] seed users dibuat');
  })();

  function publicUser(u){ if(!u) return null; const { password, ...r } = u; return r; }

  function createUser({ username,password,role,kelas,jurusan }){
    if (!username || !password || !role) throw new Error('Data kurang');
    const users = getUsers();
    if (users.some(u=>u.username===username)) throw new Error('Username sudah ada');
    const user = {
      id: Date.now()+Math.random(),
      username,
      password,
      role,
      kelas: role==='kelas' ? (kelas||'').trim() : null,
      jurusan: role==='kelas' ? (jurusan||'').trim() : null
    };
    users.push(user); saveUsers(users);
    return publicUser(user);
  }

  function login(username,password){
    const u = getUsers().find(x=>x.username===username && x.password===password);
    if (!u) throw new Error('Login gagal');
    const sess = {
      userId:u.id,
      username:u.username,
      role:u.role,
      kelas:u.kelas,
      jurusan:u.jurusan,
      loginTime:Date.now()
    };
    write(SESSION_KEY, sess);
    return sess;
  }

  function logout(){ localStorage.removeItem(SESSION_KEY); }
  function current(){ try { return JSON.parse(localStorage.getItem(SESSION_KEY)||'null'); } catch { return null; } }

  window.AuthStorage = {
    getUsers: ()=>getUsers().map(publicUser),
    createUser,
    login,
    logout,
    current,
    isAdmin: ()=>current()?.role==='admin',
    isKelas: ()=>current()?.role==='kelas'
  };
})();