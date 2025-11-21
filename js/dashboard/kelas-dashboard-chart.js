(function () {
  function waitReady(cb, tries = 0) {
    if (window.Auth?.session && window.SiswaStore?.getAll && window.KehadiranStore?.getAll && window.ApexCharts) return cb();
    if (tries > 200) return console.warn('kelas-dashboard-chart: timeout menunggu store/auth/apexcharts');
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

  function getAllowedIds() {
    const label = sessionClassLabel();
    const siswa = window.SiswaStore.getAll?.() || [];
    if (!label) return new Set(siswa.map((s) => String(s.id)));
    const target = normLabel(label);
    return new Set(
      siswa
        .filter((x) => normLabel(`${x.kelas || ''} ${x.jurusan || ''}`) === target)
        .map((x) => String(x.id))
    );
  }

  function getKehadiranForAllowed(allowedIds) {
    const all = window.KehadiranStore.getAll?.() || [];
    const filtered = all.filter((r) => allowedIds.has(String(r.siswaId)));
    if (filtered.length === 0) {
      const label = sessionClassLabel();
      const target = normLabel(label);
      return all.filter((r) => normLabel(r.kelas) === target);
    }
    return filtered;
  }

  function lastNDates(n) {
    const out = [];
    const d = new Date();
    for (let i = n - 1; i >= 0; i--) {
      const t = new Date(d);
      t.setDate(d.getDate() - i);
      out.push(t.toISOString().slice(0, 10));
    }
    return out;
  }

  function render() {
    const allowedIds = getAllowedIds();
    const data = getKehadiranForAllowed(allowedIds);
    const days = lastNDates(7);
    const seriesNames = ['Hadir', 'Izin', 'Sakit', 'Alfa'];
    const series = seriesNames.map((name) => ({
      name,
      data: days.map((dt) => data.filter((x) => x.tanggal === dt && x.status === name).length),
    }));

    const el = document.getElementById('attendance-chart');
    const empty = document.getElementById('chart-empty');
    if (!el) return;
    const total = series.reduce((s, cur) => s + cur.data.reduce((a, b) => a + b, 0), 0);
    if (total === 0) {
      if (empty) empty.style.display = 'block';
      el.innerHTML = '';
      return;
    } else if (empty) empty.style.display = 'none';

    const chart = new ApexCharts(el, {
      chart: { type: 'line', height: 300, toolbar: { show: false } },
      series,
      xaxis: { categories: days },
      stroke: { width: 2 },
      markers: { size: 3 },
      legend: { position: 'top' },
    });
    chart.render();
  }

  document.addEventListener('DOMContentLoaded', () => waitReady(render));
})();