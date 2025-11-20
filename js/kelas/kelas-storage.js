(function () {
  const KEY = 'sisko_kelas';

  function getAll() {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]'); }
    catch { return []; }
  }
  function setAll(arr) { localStorage.setItem(KEY, JSON.stringify(arr)); }
  function add(kelas) {
    const data = getAll();
    data.push({
      id: Date.now(),
      kelas: kelas.kelas,        // X / XI / XII
      jurusan: kelas.jurusan,    // RPL 1 / TP 1 / dst
      walikelas: kelas.walikelas
    });
    setAll(data);
  }
  function remove(id) {
    setAll(getAll().filter(k => k.id !== id));
  }
  function clear() { localStorage.removeItem(KEY); }
  function getUniqueTingkat() {
    return Array.from(new Set(getAll().map(k => String(k.kelas || '').trim()))).filter(Boolean);
  }

  window.KelasStore = { getAll, setAll, add, remove, clear, getUniqueTingkat };
})();