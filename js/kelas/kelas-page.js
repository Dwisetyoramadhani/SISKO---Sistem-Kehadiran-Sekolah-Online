(() => {
  const tbody = document.getElementById('kelasTbody');
  if (!tbody) return;

  const btnTambah = document.getElementById('btnTambahKelas');
  const btnRefresh = document.getElementById('btnRefreshKelas');
  const btnClear = document.getElementById('btnClearKelas');
  const searchInput = document.getElementById('kelasSearch');
  const statTotal = document.getElementById('statTotalKelas');
  const statTingkat = document.getElementById('statTingkatUnik');
  const infoCount = document.getElementById('kelasInfoCount');

  let data = [];

  function load() {
    data = window.KelasStore.getAll();
    statTotal.textContent = data.length;
    statTingkat.textContent = new Set(data.map(d => d.kelas)).size;
  }

  function filtered() {
    const q = (searchInput.value || '').toLowerCase().trim();
    if (!q) return data;
    return data.filter(d =>
      d.kelas.toLowerCase().includes(q) ||
      d.jurusan.toLowerCase().includes(q) ||
      (d.walikelas || '').toLowerCase().includes(q)
    );
  }

  function render() {
    const rows = filtered();
    tbody.innerHTML = rows.map((r, i) => `
      <tr data-id="${r.id}">
        <td class="text-muted">${i + 1}</td>
        <td><span class="badge badge-tingkat">${r.kelas}</span></td>
        <td>${r.jurusan}</td>
        <td>${r.walikelas || '-'}</td>
        <td>
          <button class="btn btn-outline-danger btn-sm" data-del="${r.id}" title="Hapus">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      </tr>
    `).join('');
    infoCount.textContent = `${rows.length} baris ditampilkan`;
  }

  document.addEventListener('click', e => {
    const del = e.target.closest('[data-del]');
    if (del) {
      const id = Number(del.getAttribute('data-del'));
      if (confirm('Hapus kelas ini?')) {
        window.KelasStore.remove(id);
        load();
        render();
      }
    }
  });

  searchInput?.addEventListener('input', render);
  btnTambah?.addEventListener('click', () => window.location.href = '/forms/formKelas.html');
  btnRefresh?.addEventListener('click', () => { load(); render(); });
  btnClear?.addEventListener('click', () => {
    if (!confirm('Hapus semua data kelas?')) return;
    window.KelasStore.clear();
    load();
    render();
  });

  load();
  render();
})();