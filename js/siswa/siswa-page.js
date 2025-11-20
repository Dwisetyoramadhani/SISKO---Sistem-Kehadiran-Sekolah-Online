(() => {
  const tbody = document.getElementById('siswaTbody');
  if (!tbody) return;

  const addBtn = document.getElementById('btnTambahSiswa');
  const searchInput = document.getElementById('searchInput');
  const statTotal = document.getElementById('statTotal');
  const statKelas = document.getElementById('statKelas');
  const infoCount = document.getElementById('infoCount');
  const btnRefresh = document.getElementById('btnRefresh');
  const btnClearAll = document.getElementById('btnClearAll');

  let data = [];

  function load() {
    data = window.SiswaStore.getAll();
    statTotal.textContent = data.length;
    statKelas.textContent = new Set(data.map(d => d.kelas)).size;
  }

  function getFiltered() {
    const q = (searchInput.value || '').toLowerCase().trim();
    if (!q) return data;
    return data.filter(d =>
      d.nama.toLowerCase().includes(q) ||
      d.kelas.toLowerCase().includes(q) ||
      (d.jurusan || '').toLowerCase().includes(q)
    );
  }

  function render() {
    const rows = getFiltered();
    tbody.innerHTML = rows.map((r, i) => `
      <tr data-id="${r.id}">
        <td class="text-muted">${i + 1}</td>
        <td>${r.nama}</td>
        <td><span class="badge badge-kelas">${r.kelas}</span></td>
        <td>${r.jurusan || '-'}</td>
        <td>
          <button class="btn btn-outline-danger btn-sm" data-del="${r.id}" title="Delete">
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
      if (confirm('Hapus siswa ini?')) {
        window.SiswaStore.remove(id);
        load();
        render();
      }
    }
  });

  searchInput?.addEventListener('input', render);
  addBtn?.addEventListener('click', () => window.location.href = '/forms/formSiswa.html');
  btnRefresh?.addEventListener('click', () => { load(); render(); });
  btnClearAll?.addEventListener('click', () => {
    if (!confirm('Hapus semua data siswa?')) return;
    window.SiswaStore.clear();
    load();
    render();
  });

  load();
  render();
})();