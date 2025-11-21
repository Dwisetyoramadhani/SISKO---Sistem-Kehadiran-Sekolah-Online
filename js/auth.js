
export async function apiFetch(path, opts = {}) {
const token = localStorage.getItem('token');
const headers = opts.headers || {};
headers['Content-Type'] = 'application/json';
if (token) headers['Authorization'] = `Bearer ${token}`;
const res = await fetch(API_BASE + path, {...opts, headers});
if (res.status === 401) {
localStorage.removeItem('token');
location.hash = '#/login';
throw new Error('Unauthorized');
}
return res;
}


export async function login(username, password) {
const res = await fetch(API_BASE + '/login', {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ username, password })
});
if (!res.ok) throw new Error('Login failed');
const data = await res.json();
localStorage.setItem('token', data.token);
return data;
}


export function logout() {
localStorage.removeItem('token');
location.hash = '#/login';
}


export function isAuthed() {
return !!localStorage.getItem('token');
}

(function(){
  const USER_KEY = 'sisko_users';
  const SESSION_KEY = 'sisko_session';

  function read(key, fb){ try { return JSON.parse(localStorage.getItem(key) ?? fb); } catch { return JSON.parse(fb); } }
  function write(key, v){ localStorage.setItem(key, JSON.stringify(v)); }

  function getUsers(){ return read(USER_KEY,'[]'); }
  function setUsers(arr){ write(USER_KEY, arr); }
  function seedIfEmpty(){
    if (getUsers().length) return;
    setUsers([
      { id:1, username:'admin', password:'admin123', role:'admin', classLabel:null },
      { id:2, username:'x_rpl_1', password:'kelas123', role:'kelas', classLabel:'X RPL 1' }
    ]);
    console.info('[Auth] Seed users dibuat');
  }

  function login(username,password){
    const u = getUsers().find(x => x.username===username && x.password===password);
    if (!u) throw new Error('Login gagal');
    const sess = { userId:u.id, username:u.username, role:u.role, classLabel:u.classLabel, loginTime:Date.now() };
    write(SESSION_KEY, sess);
    return sess;
  }
  function logout(){ localStorage.removeItem(SESSION_KEY); }
  function currentUser(){ try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch { return null; } }
  function isAdmin(){ return currentUser()?.role==='admin'; }
  function isKelas(){ return currentUser()?.role==='kelas'; }

  seedIfEmpty();
  window.Auth = { getUsers, setUsers, login, logout, currentUser, isAdmin, isKelas };
})();