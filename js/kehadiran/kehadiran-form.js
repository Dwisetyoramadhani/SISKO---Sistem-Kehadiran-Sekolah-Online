(() => {
  document.addEventListener('DOMContentLoaded', init);

  // Utils
  const norm = s => String(s || '').toLowerCase().trim().replace(/\s+/g, ' ');
  const todayISO = () => new Date().toISOString().slice(0, 10);
  const timeNow = () => new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  function getSession() {
    try { return JSON.parse(localStorage.getItem('sisko_session') || 'null'); } catch { return null; }
  }
  function getAllSiswa() {
    try {
      if (window.SiswaStore?.getAll) return window.SiswaStore.getAll() || [];
      return JSON.parse(localStorage.getItem('sisko_siswa') || '[]');
    } catch { return []; }
  }
  function getAllKehadiran() {
    try {
      if (window.KehadiranStore?.getAll) return window.KehadiranStore.getAll() || [];
      return JSON.parse(localStorage.getItem('sisko_kehadiran') || '[]');
    } catch { return []; }
  }
  function saveAllKehadiran(list) {
    if (window.KehadiranStore?.saveAll) return window.KehadiranStore.saveAll(list);
    localStorage.setItem('sisko_kehadiran', JSON.stringify(list || []));
  }

  async function fileToDataURL(file) {
    if (!file) return '';
    await new Promise(r => setTimeout(r, 0)); 
    return new Promise((res, rej) => {
      const fr = new FileReader();
      fr.onload = () => res(fr.result);
      fr.onerror = rej;
      fr.readAsDataURL(file);
    });
  }

  function classLabelOf(s) {
    return `${s.kelas || ''} ${s.jurusan || ''}`.trim();
  }

  function init() {
    const form = document.getElementById('formKehadiran');
    const kelasSelect = document.getElementById('kelasSelect');
    const siswaSelect = document.getElementById('siswaSelect');
    const tanggalInput = document.getElementById('tanggal');
    const statusSelect = document.getElementById('statusSelect');
    const ketInput = document.getElementById('keterangan');
    const buktiInput = document.getElementById('bukti');
    const previewImg = document.getElementById('previewBukti');
    const dupWarning = document.getElementById('dupWarning');

    if (!form) return;

    const sess = getSession();
    const siswaAll = getAllSiswa();

    const kelasSet = Array.from(new Set(
      siswaAll.map(classLabelOf).filter(Boolean)
    )).sort();

    kelasSelect.innerHTML = '<option value="" disabled selected>Pilih Kelas</option>' +
      kelasSet.map(k => `<option value="${k}">${k}</option>`).join('');

    if (sess && sess.role === 'kelas') {
      const cls = `${sess.kelas || ''} ${sess.jurusan || ''}`.trim();
      if (cls) {
        if (!kelasSet.some(x => norm(x) === norm(cls))) {
          kelasSelect.insertAdjacentHTML('beforeend', `<option value="${cls}">${cls}</option>`);
        }
        kelasSelect.value = cls;
        kelasSelect.disabled = true;
        kelasSelect.classList.add('bg-light');
        populateSiswa(cls);
      }
    }

    kelasSelect.addEventListener('change', () => {
      populateSiswa(kelasSelect.value);
      checkDuplicate();
    });

    function populateSiswa(kelasLabel) {
      const list = siswaAll
        .filter(s => norm(classLabelOf(s)) === norm(kelasLabel))
        .sort((a, b) => String(a.nama || '').localeCompare(String(b.nama || '')));
      if (!list.length) {
        siswaSelect.innerHTML = '<option value="" disabled selected>Pilih Siswa</option>';
        siswaSelect.disabled = true;
        return;
      }
      siswaSelect.innerHTML = '<option value="" disabled selected>Pilih Siswa</option>' +
        list.map(s => `<option value="${s.id}">${s.nama}</option>`).join('');
      siswaSelect.disabled = false;
    }

    tanggalInput.value = todayISO();

    buktiInput.addEventListener('change', () => {
      const f = buktiInput.files?.[0];
      if (!f) {
        previewImg.style.display = 'none';
        previewImg.src = '';
        return;
      }
      const url = URL.createObjectURL(f);
      previewImg.src = url;
      previewImg.style.display = 'block';
    });

    siswaSelect.addEventListener('change', checkDuplicate);
    tanggalInput.addEventListener('change', checkDuplicate);

    function checkDuplicate() {
      dupWarning?.classList.add('d-none');
      const siswaId = siswaSelect.value;
      const tgl = tanggalInput.value;
      if (!siswaId || !tgl) return;
      const all = getAllKehadiran();
      const hit = all.find(r =>
        String(r.siswaId ?? r.id_siswa) === String(siswaId) &&
        String(r.tanggal ?? r.date) === String(tgl)
      );
      if (hit) dupWarning?.classList.remove('d-none');
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const kelasLabel = kelasSelect.value;
      const siswaId = siswaSelect.value;
      const tgl = tanggalInput.value;
      const status = statusSelect.value;
      const ket = ketInput.value.trim();
      const file = buktiInput.files?.[0];

      if (!kelasLabel) return alert('Pilih kelas.');
      if (!siswaId) return alert('Pilih siswa.');
      if (!tgl) return alert('Isi tanggal.');
      if (!status) return alert('Pilih status.');

      const siswa = siswaAll.find(s => String(s.id) === String(siswaId));
      const kelasFull = siswa ? classLabelOf(siswa) : kelasLabel;
      const nama = siswa?.nama || '';

      let buktiUrl = '';
      if (file) {
        try { buktiUrl = await fileToDataURL(file); } catch {}
      }

      const all = getAllKehadiran();
      const idx = all.findIndex(r =>
        String(r.siswaId ?? r.id_siswa) === String(siswaId) &&
        String(r.tanggal ?? r.date) === String(tgl)
      );

      const payload = {
        id: idx > -1 ? (all[idx].id || Date.now()) : Date.now(),
        siswaId: Number(siswaId),
        id_siswa: Number(siswaId),    
        nama,
        kelas: kelasFull,
        tanggal: tgl,                 
        date: tgl,                    
        status,
        keterangan: ket,
        buktiUrl: buktiUrl || (idx > -1 ? (all[idx].buktiUrl || '') : ''),
        time: timeNow()
      };

      if (idx > -1) all[idx] = { ...all[idx], ...payload };
      else all.push(payload);

      saveAllKehadiran(all);

      alert('Kehadiran tersimpan.');
      window.location.href = '/pages/kehadiran.html';
    });
  }
})();