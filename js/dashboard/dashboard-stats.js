(function(){
  document.addEventListener('DOMContentLoaded', () => {
    waitForData(refreshAll);
  });

  function waitForData(cb, tries=0){
    const siswaReady = !!(window.SiswaStore && window.SiswaStore.getAll().length);
    const hadirReady = !!(window.KehadiranStore);
    if (siswaReady || tries > 40){
      cb();
    } else {
      setTimeout(()=>waitForData(cb, tries+1), 100);
    }
  }

  function getToday(){ return new Date().toISOString().slice(0,10); }

  function refreshStats(){
    const siswa = (window.SiswaStore?.getAll() || []);
    const hadir = (window.KehadiranStore?.getAll() || []);
    const todayEntries = hadir.filter(h => h.tanggal === getToday());
    setText('statSiswa', siswa.length);
    setText('statHadir', todayEntries.filter(e=>e.status==='Hadir').length);
    setText('statIzin', todayEntries.filter(e=>e.status==='Izin').length);
    setText('statSakit', todayEntries.filter(e=>e.status==='Sakit').length);
    setText('statAlfa', todayEntries.filter(e=>e.status==='Alfa').length);
  }

  function renderTodaySummary(){
    const ul = document.getElementById('today-summary');
    if (!ul) return;
    const all = (window.KehadiranStore?.getAll() || []).filter(e => e.tanggal === getToday());
    if (!all.length){
      ul.innerHTML = '<li class="text-secondary">Belum ada entri kehadiran hari ini.</li>';
      return;
    }
    const by = all.reduce((acc,cur)=>{ (acc[cur.status] ||= []).push(cur); return acc; }, {});
    ul.innerHTML = Object.entries(by).map(([st,arr]) => `<li><strong>${st}</strong>: ${arr.length} siswa</li>`).join('');
  }

  function refreshAll(){
    refreshStats();
    renderTodaySummary();
    window.DashboardChart?.refresh();
    console.debug('[Dashboard] Stats loaded',
      { siswa: (window.SiswaStore?.getAll()||[]).length,
        kehadiran: (window.KehadiranStore?.getAll()||[]).length });
  }

  function setText(id,v){ const el=document.getElementById(id); if(el) el.textContent=v; }

  window.DashboardStats = { refresh: refreshAll };
})();