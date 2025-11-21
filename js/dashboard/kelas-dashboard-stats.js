(function () {
  function waitReady(cb, tries = 0) {
    if (window.Auth?.session && window.SiswaStore?.getAll && window.KehadiranStore?.getAll) return cb();
    if (tries > 200) return console.warn('kelas-dashboard-stats: timeout menunggu store/auth');
    setTimeout(() => waitReady(cb, tries + 1), 50);
  }

  function sessionClassLabel() {
    const s = window.Auth?.session?.();
    if (!s || s.role !== 'kelas') return null;
    return `${s.kelas || ''} ${s.jurusan || ''}`.trim();
  }
  function normLabel(v) {
    return String(v || '').trim().replace(/\s+/g, ' ').toLowerCase();
  }

  function getAllowedSiswa() {
    const label = sessionClassLabel();
    const siswa = window.SiswaStore.getAll() || [];
    if (!label) return siswa;
    const target = normLabel(label);
    return siswa.filter(
      (x) => normLabel(`${x.kelas || ''} ${x.jurusan || ''}`) === target
    );
  }

  function getKehadiranForAllowed(allowedIds) {
    const all = window.KehadiranStore.getAll?.() || [];
    // Filter utama berdasar siswaId ∈ allowedIds
    const filtered = all.filter((r) => allowedIds.has(String(r.siswaId)));
    if (filtered.length === 0) {
      const label = sessionClassLabel();
      const target = normLabel(label);
      return all.filter((r) => normLabel(r.kelas) === target);
    }
    return filtered;
  }

  function render() {
    const siswaAllowed = getAllowedSiswa();
    const allowedIds = new Set(siswaAllowed.map((s) => String(s.id)));
    const today = new Date().toISOString().slice(0, 10);
    const hadirAllowed = getKehadiranForAllowed(allowedIds);
    const todayList = hadirAllowed.filter((x) => x.tanggal === today);

    const $ = (id) => document.getElementById(id);
    $('statSiswa') && ( $('statSiswa').textContent = siswaAllowed.length );
    $('statHadir') && ( $('statHadir').textContent = todayList.filter(x => x.status === 'Hadir').length );
    $('statIzin')  && ( $('statIzin').textContent  = todayList.filter(x => x.status === 'Izin').length );
    $('statSakit') && ( $('statSakit').textContent = todayList.filter(x => x.status === 'Sakit').length );
    $('statAlfa')  && ( $('statAlfa').textContent  = todayList.filter(x => x.status === 'Alfa').length );

    const ul = $('today-summary');
    if (ul) {
      ul.innerHTML = '';
      ['Hadir', 'Izin', 'Sakit', 'Alfa'].forEach((st) => {
        const n = todayList.filter((x) => x.status === st).length;
        const li = document.createElement('li');
        li.textContent = `${st}: ${n}`;
        ul.appendChild(li);
      });
    }
  }

  document.addEventListener('DOMContentLoaded', () => waitReady(render));
})();