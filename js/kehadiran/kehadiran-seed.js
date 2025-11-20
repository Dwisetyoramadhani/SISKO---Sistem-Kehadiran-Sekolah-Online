(function(){
  setTimeout(() => {
    if (!window.KehadiranStore) return;
    if (window.KehadiranStore.getAll().length) return;
    const siswa = (window.SiswaStore?.getAll() || []);
    if (!siswa.length) return;
    const today = new Date().toISOString().slice(0,10);
    const data = siswa.map(s => ({
      siswaId: s.id,
      nama: s.nama,
      kelas: `${s.kelas} ${s.jurusan}`.trim(),
      tanggal: today,
      status: 'Hadir',
      keterangan: ''
    }));
    window.KehadiranStore.setAll(data);
    console.info('[Seed] Kehadiran hari ini dibuat:', data.length);
    window.DashboardStats?.refresh();
  }, 200);
})();