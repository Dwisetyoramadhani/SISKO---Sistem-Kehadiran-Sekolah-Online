(function () {
  const KEY = 'sisko_siswa';

  const load = () => {
    try {
      return JSON.parse(localStorage.getItem(KEY) || '[]');
    } catch {
      return [];
    }
  };

  const saveAll = (list) => localStorage.setItem(KEY, JSON.stringify(list || []));

  function seed() {
    const d = load();
    if (d.length) return;
    saveAll([
      { id: 1, nama: 'Andi', kelas: 'X', jurusan: 'RPL 1' },
      { id: 2, nama: 'Budi', kelas: 'X', jurusan: 'RPL 1' },
      { id: 3, nama: 'Citra', kelas: 'X', jurusan: 'RPL 1' }
    ]);
    console.info('[Siswa] Seed dibuat');
  }

  const getAll = () => load();

  window.SiswaStore = { getAll, saveAll };
  seed();
})();