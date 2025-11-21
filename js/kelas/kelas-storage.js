(function () {
  const KEY = 'sisko_kelas';

  const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; } };
  const saveAll = list => localStorage.setItem(KEY, JSON.stringify(list || []));
  const getAll = () => load();

  function add(kelas) {
    const data = getAll();
    data.push({
      id: Date.now(),
      kelas: kelas.kelas,       
      jurusan: kelas.jurusan,    
      walikelas: kelas.walikelas
    });
    saveAll(data);
  }
  function remove(id) {
    saveAll(getAll().filter(k => k.id !== id));
  }
  function clear() { localStorage.removeItem(KEY); }
  function getUniqueTingkat() {
    return Array.from(new Set(getAll().map(k => String(k.kelas || '').trim()))).filter(Boolean);
  }

  window.KelasStore = { getAll, saveAll, add, remove, clear, getUniqueTingkat };
})();