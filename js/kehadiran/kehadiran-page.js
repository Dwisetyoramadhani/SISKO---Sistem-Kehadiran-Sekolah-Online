(() => {
  document.addEventListener('DOMContentLoaded', init);

  function init() {
    const tbody = document.getElementById('kehadiranTbody');
    if (!tbody) return;

    const btnTambah = document.getElementById('btnTambahKehadiran');
    const btnRefresh = document.getElementById('btnRefreshKehadiran');
    const btnClearAll = document.getElementById('btnClearAllKehadiran');
    const btnExport = document.getElementById('btnExportKehadiran');
    const searchInput = document.getElementById('searchKehadiran');
    const filterKelas = document.getElementById('filterKelas');
    const filterStatus = document.getElementById('filterStatus');
    const filterFrom = document.getElementById('filterFrom');
    const filterTo = document.getElementById('filterTo');
    const btnApplyRange = document.getElementById('btnApplyRange');
    const statTotal = document.getElementById('statTotal');
    const statHadir = document.getElementById('statHadir');
    const statIzin = document.getElementById('statIzin');
    const statSakit = document.getElementById('statSakit');
    const statAlfa = document.getElementById('statAlfa');
    const infoCount = document.getElementById('kehadiranInfoCount');

    let data = [];

    function load() {
      data = window.KehadiranStore.getAll().map(r => {
        if (r.siswaId && (!r.kelas || !/\s/.test(r.kelas))) {
          const s = (window.SiswaStore?.getAll() || []).find(x => x.id === r.siswaId);
          if (s) r.kelas = `${s.kelas} ${s.jurusan || ''}`.trim();
        }
        return r;
      }).sort((a, b) => (b.tanggal || '').localeCompare(a.tanggal || ''));
      updateStats();
      fillFilterKelas();
    }

    function updateStats() {
      statTotal.textContent = data.length;
      statHadir.textContent = data.filter(d => d.status === 'Hadir').length;
      statIzin.textContent = data.filter(d => d.status === 'Izin').length;
      statSakit.textContent = data.filter(d => d.status === 'Sakit').length;
      statAlfa.textContent = data.filter(d => d.status === 'Alfa').length;
    }

    function fillFilterKelas() {
      const kelasAll = Array.from(new Set(data.map(d => d.kelas).filter(Boolean))).sort();
      filterKelas.innerHTML = '<option value="">Semua Kelas</option>' +
        kelasAll.map(k => `<option value="${k}">${k}</option>`).join('');
    }

    function inRange(tgl) {
      if (!tgl) return false;
      if (filterFrom.value && tgl < filterFrom.value) return false;
      if (filterTo.value && tgl > filterTo.value) return false;
      return true;
    }

    function filtered() {
      const q = (searchInput.value || '').toLowerCase().trim();
      return data.filter(r => {
        if (filterKelas.value && r.kelas !== filterKelas.value) return false;
        if (filterStatus.value && r.status !== filterStatus.value) return false;
        if ((filterFrom.value || filterTo.value) && !inRange(r.tanggal)) return false;
        if (!q) return true;
        return (
          (r.nama || '').toLowerCase().includes(q) ||
          (r.kelas || '').toLowerCase().includes(q) ||
          (r.status || '').toLowerCase().includes(q) ||
          (r.keterangan || '').toLowerCase().includes(q)
        );
      });
    }

    function badge(s) {
      if (!s) s = '-';
      return `<span class="badge-status ${s} badge rounded-pill px-3">${s}</span>`;
    }

    function render() {
      const rows = filtered();
      if (!rows.length) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center text-secondary py-4">Tidak ada data.</td></tr>`;
        infoCount.textContent = '0 baris ditampilkan';
        return;
      }
      tbody.innerHTML = rows.map((r, i) => `
        <tr data-id="${r.id}">
          <td class="text-muted">${i + 1}</td>
          <td>${r.nama || '-'}</td>
            <td><span class="badge bg-light border text-dark">${r.kelas || '-'}</span></td>
          <td>${r.tanggal || '-'}</td>
          <td>${badge(r.status)}</td>
          <td>${r.keterangan || '-'}</td>
          <td>${r.buktiUrl ? `<button class="btn btn-outline-info btn-sm" data-view="${r.id}"><i class="bi bi-image"></i></button>` : '-'}</td>
          <td>
            <button class="btn btn-outline-danger btn-sm" data-del="${r.id}"><i class="bi bi-trash"></i></button>
          </td>
        </tr>
      `).join('');
      infoCount.textContent = `${rows.length} baris ditampilkan`;
    }

    document.addEventListener('click', e => {
      const del = e.target.closest('[data-del]');
      if (del) {
        const id = Number(del.getAttribute('data-del'));
        if (confirm('Hapus entri ini?')) {
          window.KehadiranStore.remove(id);
          load(); render();
        }
      }
      const view = e.target.closest('[data-view]');
      if (view) {
        const id = Number(view.getAttribute('data-view'));
        const item = data.find(x => x.id === id);
        if (item?.buktiUrl) {
          const w = window.open('', '_blank');
          w.document.write(`<title>Bukti</title><img style="max-width:100%;height:auto" src="${item.buktiUrl}" />`);
        }
      }
    });

    btnTambah?.addEventListener('click', () => window.location.href = '/forms/formKehadiran.html');
    btnRefresh?.addEventListener('click', () => { load(); render(); });
    btnClearAll?.addEventListener('click', () => {
      if (!confirm('Hapus semua kehadiran?')) return;
      window.KehadiranStore.clear();
      load(); render();
    });
    btnExport?.addEventListener('click', () => {
      const rows = filtered();
      const total = (window.KehadiranStore.getAll() || []).length;

      if (!rows.length && !total) {
        alert('Tidak ada data untuk diekspor');
        return;
      }

      const ok = confirm(
        'Ekspor data yang ditampilkan (sesuai filter/urut saat ini)?\n' +
        'Pilih Cancel untuk ekspor semua data.'
      );

      if (ok) {
        if (!rows.length) { alert('Tidak ada baris sesuai filter.'); return; }
        window.KehadiranStore.exportCSV(rows);   // ekspor yang ditampilkan
      } else {
        window.KehadiranStore.exportCSV();       // ekspor semua data
      }
    });
    [searchInput, filterKelas, filterStatus].forEach(el => el?.addEventListener('input', render));
    btnApplyRange?.addEventListener('click', render);

    load();
    render();
  }
})();