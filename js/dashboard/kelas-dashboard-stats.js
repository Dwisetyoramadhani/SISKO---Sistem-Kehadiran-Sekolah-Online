(function(){
  document.addEventListener('DOMContentLoaded', init);

  function init(){
    const sess = Auth.session?.();
    if (!sess || sess.role!=='kelas') return;

    const classLabel = `${sess.kelas||''} ${sess.jurusan||''}`.trim();
    const today = new Date().toISOString().slice(0,10);

    // Hitung jumlah siswa kelas
    const siswaAll = (window.SiswaStore?.getAll?.()||[])
      .filter(s => `${s.kelas||''} ${s.jurusan||''}`.trim() === classLabel);

    // Ambil kehadiran hari ini untuk kelas aktif
    const hadirAll = (window.KehadiranStore?.getAll?.()||[])
      .filter(h => (h.kelas||'') === classLabel && (h.tanggal||'') === today);

    set('statSiswa', siswaAll.length);
    set('statHadir', count(hadirAll, 'Hadir'));
    set('statIzin',  count(hadirAll, 'Izin'));
    set('statSakit', count(hadirAll, 'Sakit'));
    set('statAlfa',  count(hadirAll, 'Alfa'));

    // Klik kartu → buka halaman kehadiran kelas (dengan filter status)
    on('cardTotal', () => goKehadiran());
    on('cardHadir', () => goKehadiran('Hadir'));
    on('cardIzin',  () => goKehadiran('Izin'));
    on('cardSakit', () => goKehadiran('Sakit'));
    on('cardAlfa',  () => goKehadiran('Alfa'));
  }

  function count(list, status){ return list.filter(x => x.status===status).length; }
  function goKehadiran(status){
    const url = new URL(location.origin + '/pages/kelas-kehadiran.html');
    if (status) url.searchParams.set('status', status);
    location.href = url.pathname + url.search;
  }
  function set(id,v){ const el = document.getElementById(id); if (el) el.textContent = v; }
  function on(id,fn){ const el=document.getElementById(id); if (el) el.addEventListener('click', fn); }
})();