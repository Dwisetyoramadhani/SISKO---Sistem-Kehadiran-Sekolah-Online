(function () {
  const KEY = 'sisko_siswa';

  function read() {
    try {
      return JSON.parse(localStorage.getItem(KEY) || '[]');
    } catch {
      return [];
    }
  }

  function write(a) {
    localStorage.setItem(KEY, JSON.stringify(a));
  }

  function seed() {
    const d = read();
    if (d.length) return;
    write([
      { id: 1, nama: 'Andi', kelas: 'X', jurusan: 'RPL 1' },
      { id: 2, nama: 'Budi', kelas: 'X', jurusan: 'RPL 1' },
      { id: 3, nama: 'Citra', kelas: 'X', jurusan: 'RPL 1' }
    ]);
    console.info('[Siswa] Seed dibuat');
  }

  function getAll() { return read(); }

  window.SiswaStore = { getAll };
  seed();
})();