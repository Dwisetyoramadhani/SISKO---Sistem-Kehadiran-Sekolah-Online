(function(){
  document.addEventListener('DOMContentLoaded', init);

  function init(){
    ensureStore();
    bindUI();
    render();
  }

  function ensureStore(){
    if (!window.SiswaStore){
      window.SiswaStore = (function(){
        const KEY='sisko_siswa';
        const getAll=()=>{ try { return JSON.parse(localStorage.getItem(KEY)||'[]'); } catch { return []; } };
        const saveAll=list=>localStorage.setItem(KEY, JSON.stringify(list||[]));
        return { getAll, saveAll };
      })();
    }
  }

  function bindUI(){
    document.getElementById('searchInput')?.addEventListener('input', render);
    document.getElementById('btnRefresh')?.addEventListener('click', render);
    document.getElementById('btnTambahSiswa')?.addEventListener('click', (e)=>{
      e.preventDefault();
      window.location.href = '/forms/formSiswa.html';
    });
    document.getElementById('btnClearAll')?.addEventListener('click', () => {
      if (!confirm('Hapus semua data siswa?')) return;
      window.SiswaStore.saveAll([]);
      render();
    });

    const tbody = document.getElementById('siswaTbody');
    if (tbody){
      tbody.addEventListener('click', e => {
        const del = e.target.closest('button[data-del]');
        if (!del) return;
        const id = del.getAttribute('data-del');
        if (!id) return;
        if (!confirm('Hapus siswa ini?')) return;
        const all = window.SiswaStore.getAll();
        const idx = all.findIndex(x => String(x.id) === String(id));
        if (idx > -1){
          all.splice(idx,1);
          window.SiswaStore.saveAll(all);
          render();
        } else {
          alert('Data tidak ditemukan.');
        }
      });
    }
  }

  function onUpload(){
    const nama = prompt('Nama siswa:');
    if (!nama) return;
    const kelas = prompt('Tingkat (misal X, XI, XII):') || '';
    const jurusan = prompt('Jurusan (misal RPL 1):') || '';
    const all = window.SiswaStore.getAll();
    all.push({ id: Date.now(), nama, kelas, jurusan });
    window.SiswaStore.saveAll(all);
    render();
  }

  function render(){
    const q = (document.getElementById('searchInput')?.value || '').toLowerCase().trim();
    const tbody = document.getElementById('siswaTbody');
    const info = document.getElementById('infoCount');
    const statTotal = document.getElementById('statTotal');
    const statKelas = document.getElementById('statKelas');

    const all = window.SiswaStore.getAll().sort((a,b)=>String(a.nama||'').localeCompare(String(b.nama||'')));
    const filtered = all.filter(s => {
      if (!q) return true;
      return [s.nama,s.kelas,s.jurusan].some(v => String(v||'').toLowerCase().includes(q));
    });

    statTotal && (statTotal.textContent = all.length);
    statKelas && (statKelas.textContent = new Set(all.map(s=>`${s.kelas||''} ${s.jurusan||''}`.trim()).filter(Boolean)).size);

    if (!filtered.length){
      tbody.innerHTML = '<tr><td colspan="5" class="text-center text-secondary py-4">Tidak ada data.</td></tr>';
      info && (info.textContent='0 baris');
      return;
    }

    tbody.innerHTML = filtered.map((s,i)=>`
      <tr>
        <td class="text-muted">${i+1}</td>
        <td>${esc(s.nama)}</td>
        <td><span class="badge badge-kelas">${esc(s.kelas||'-')}</span></td>
        <td>${esc(s.jurusan||'-')}</td>
        <td>
          <button class="btn btn-sm btn-outline-danger" data-del="${s.id}">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      </tr>
    `).join('');
    info && (info.textContent = `${filtered.length} baris`);
  }

  function esc(s){
    return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
  }
})();