(() => {
  document.addEventListener("DOMContentLoaded", init);

  function init() {
    const TODAY = new Date().toISOString().slice(0,10);
    const tbody = document.getElementById("kehadiranTbody");
    if (!tbody) return;

    const searchInput = document.getElementById("searchKehadiran");
    const filterKelas = document.getElementById("filterKelas");
    const filterStatus = document.getElementById("filterStatus");
    const filterFrom = document.getElementById("filterFrom");
    const filterTo = document.getElementById("filterTo");
    const btnApplyRange = document.getElementById("btnApplyRange");
    const btnRefresh = document.getElementById("btnRefreshKehadiran");
    const btnExport = document.getElementById("btnExportKehadiran");
    const btnTambah = document.getElementById("btnTambahKehadiran");
    const btnClearAll = document.getElementById("btnClearAllKehadiran");
    const infoCount = document.getElementById("kehadiranInfoCount");

    [filterFrom, filterTo].forEach(el=>{
      if (el){ el.value=TODAY; el.disabled=true; el.classList.add('bg-light'); }
    });
    if (btnApplyRange){ btnApplyRange.disabled=true; btnApplyRange.classList.add('disabled'); }

    let data = [];

    function load(){
      data = window.KehadiranStore.getAll()
        .map(r=>{
          if (!r.tanggal && r.date) r.tanggal = r.date;
          return r;
        })
        .filter(r=>r.tanggal === TODAY);
      fillFilterKelas();
    }

    function fillFilterKelas(){
      const kelasList = Array.from(new Set(data.map(r=>r.kelas).filter(Boolean))).sort();
      filterKelas.innerHTML = '<option value="">Semua Kelas</option>' +
        kelasList.map(k=>`<option value="${k}">${k}</option>`).join('');
    }

    function filtered(){
      const q = (searchInput.value||'').toLowerCase().trim();
      return data.filter(r=>{
        if (filterKelas.value && r.kelas !== filterKelas.value) return false;
        if (filterStatus.value && r.status !== filterStatus.value) return false;
        if (q){
          const hay = [r.nama,r.kelas,r.status,r.keterangan].join(' ').toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      });
    }

    function badge(s){
      if (!s) return '<span class="text-secondary">-</span>';
      return `<span class="badge-status ${s} badge rounded-pill px-3">${s}</span>`;
    }

    function render(){
      const rows = filtered();
      setText('statTotal', rows.length);
      setText('statHadir', rows.filter(x=>x.status==='Hadir').length);
      setText('statIzin', rows.filter(x=>x.status==='Izin').length);
      setText('statSakit', rows.filter(x=>x.status==='Sakit').length);
      setText('statAlfa', rows.filter(x=>x.status==='Alfa').length);

      if (!rows.length){
        tbody.innerHTML = '<tr><td colspan="8" class="text-center text-secondary py-4">Tidak ada data hari ini.</td></tr>';
        infoCount.textContent = '0 baris';
        return;
      }

      tbody.innerHTML = rows.map((r,i)=>`
        <tr data-id="${r.id}">
          <td class="text-muted">${i+1}</td>
          <td>${r.nama||'-'}</td>
          <td>${r.kelas||'-'}</td>
          <td>${r.tanggal||'-'}</td>
          <td>${badge(r.status)}</td>
          <td>${r.keterangan||'-'}</td>
          <td>${r.buktiUrl?`<button class="btn btn-outline-info btn-sm" data-view="${r.id}"><i class="bi bi-image"></i></button>`:'-'}</td>
          <td class="text-nowrap">
            <button class="btn btn-sm btn-outline-danger" data-del="${r.id}"><i class="bi bi-trash"></i></button>
          </td>
        </tr>
      `).join('');
      infoCount.textContent = `${rows.length} baris`;
    }

    searchInput?.addEventListener('input', render);
    filterKelas?.addEventListener('change', render);
    filterStatus?.addEventListener('change', render);
    btnRefresh?.addEventListener('click', ()=>{ load(); render(); });
    btnExport?.addEventListener('click', ()=>{
      const rows = filtered();
      if (!rows.length) return alert('Tidak ada data hari ini.');
      window.KehadiranStore.exportCSV(rows);
    });
    btnTambah?.addEventListener('click', (e)=>{
      e.preventDefault();
      window.location.href='/forms/formKehadiran.html';
    });
    btnClearAll?.addEventListener('click', ()=>{
      if (!confirm('Hapus semua kehadiran HARI INI?')) return;
      const all = window.KehadiranStore.getAll()
        .filter(r=>{
          const t = r.tanggal || r.date;
          return t !== TODAY;
        });
      window.KehadiranStore.saveAll(all);
      load(); render();
    });

    tbody.addEventListener('click', e=>{
      const del = e.target.closest('button[data-del]');
      if (del){
        const id = del.getAttribute('data-del');
        if (!confirm('Hapus entri ini?')) return;
        const all = window.KehadiranStore.getAll();
        const idx = all.findIndex(x=>String(x.id)===String(id));
        if (idx>-1){
          all.splice(idx,1);
          window.KehadiranStore.saveAll(all);
          load(); render();
        }
        return;
      }
      const view = e.target.closest('button[data-view]');
      if (view){
        const id = view.getAttribute('data-view');
        const item = data.find(x=>String(x.id)===String(id));
        if (item?.buktiUrl){
          const w = window.open('','_blank');
          w.document.write(`<title>Bukti</title><img style="max-width:100%" src="${item.buktiUrl}">`);
        }
      }
    });

    load();
    render();
  }

  function setText(id,val){
    const el=document.getElementById(id);
    if (el) el.textContent = val;
  }
})();

(function enforceTodayOnly(){
  const TODAY = new Date().toISOString().slice(0,10);

  function lockDateInputs(){
    const from = document.getElementById('filterFrom');
    const to   = document.getElementById('filterTo');
    const apply= document.getElementById('btnApplyRange');
    if (from){ from.value = TODAY; from.disabled = true; from.classList.add('bg-light'); }
    if (to){ to.value = TODAY; to.disabled = true; to.classList.add('bg-light'); }
    if (apply){ apply.disabled = true; apply.classList.add('disabled'); }
  }

  if (typeof getFiltered === 'function'){
    const originalGetFiltered = getFiltered;
    window.getFiltered = function(){
      const list = originalGetFiltered();
      // Filter ulang paksa hari ini
      return list.filter(r => r.tanggal === TODAY);
    };
  } else {
    window.getFiltered = function(){
      const all = (window.KehadiranStore?.getAll?.() ?? JSON.parse(localStorage.getItem('sisko_kehadiran')||'[]'))
        .map(r => {
          if (!r.tanggal && r.date) r.tanggal = r.date;
          return r;
        });
      return all.filter(r => r.tanggal === TODAY);
    };
  }

  if (typeof render === 'function'){
    const originalRender = render;
    window.render = function(){
      lockDateInputs();
      originalRender();
    };
  }

  document.addEventListener('DOMContentLoaded', () => {
    lockDateInputs();
    if (typeof render === 'function') render();
    document.getElementById('btnRefreshKehadiran')?.addEventListener('click', () => {
      lockDateInputs();
      if (typeof render === 'function') render();
    });
  });
})();

(function enableDeleteKehadiran(){
  document.addEventListener('DOMContentLoaded', () => {
    const tbody = document.getElementById('kehadiranTbody');
    if (!tbody) return;

    tbody.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-del]');
      if (!btn) return;
      const id = btn.getAttribute('data-del');
      if (!id) return;
      if (!confirm('Hapus entri ini?')) return;

      let all;
      try {
        all = (window.KehadiranStore?.getAll?.() ||
              JSON.parse(localStorage.getItem('sisko_kehadiran')||'[]')) || [];
      } catch {
        all = [];
      }

      const idx = all.findIndex(r => String(r.id) === String(id));
      if (idx === -1){
        alert('Data tidak ditemukan.');
        return;
      }

      all.splice(idx,1);

      if (window.KehadiranStore?.saveAll) {
        window.KehadiranStore.saveAll(all);
      } else {
        localStorage.setItem('sisko_kehadiran', JSON.stringify(all));
      }

      if (typeof render === 'function') {
        render();
      } else {
        btn.closest('tr')?.remove();
      }
    });
  });
})();

(function enableClearAllKehadiran(){
  document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('btnClearAllKehadiran');
    if (!btn) return;

    btn.addEventListener('click', () => {
      // Konfirmasi ganda
      if (!confirm('Hapus SEMUA data kehadiran?')) return;
      if (!confirm('Yakin, tindakan ini tidak bisa dibatalkan. Lanjutkan?')) return;

      let all;
      try {
        all = (window.KehadiranStore?.getAll?.() ||
               JSON.parse(localStorage.getItem('sisko_kehadiran')||'[]')) || [];
      } catch {
        all = [];
      }

      
      if (window.KehadiranStore?.saveAll) {
        window.KehadiranStore.saveAll(all.length ? all : []);
      } else {
        localStorage.setItem('sisko_kehadiran', JSON.stringify(all.length ? all : []));
      }

      if (typeof render === 'function') render();
    });
  });
})();