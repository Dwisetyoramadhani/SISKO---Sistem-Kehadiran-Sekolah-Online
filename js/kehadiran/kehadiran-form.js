(() => {
  const kelasSelect = document.getElementById('kelasSelect');
  const siswaSelect = document.getElementById('siswaSelect');
  const tanggal = document.getElementById('tanggal');
  const statusSelect = document.getElementById('statusSelect');
  const keterangan = document.getElementById('keterangan');
  const bukti = document.getElementById('bukti');
  const preview = document.getElementById('previewBukti');
  const dupWarning = document.getElementById('dupWarning');
  const form = document.getElementById('formKehadiran');
  if (!form) return;

  // Set default date today
  tanggal.value = new Date().toISOString().slice(0,10);

  function fillKelas() {
    const siswaAll = (window.SiswaStore?.getAll() || []);
    const combos = Array.from(new Set(
      siswaAll.map(s => `${s.kelas} ${s.jurusan || ''}`.trim()).filter(Boolean)
    )).sort();
    kelasSelect.innerHTML = '<option value="" disabled selected>Pilih Kelas</option>' +
      combos.map(c => `<option value="${c}">${c}</option>`).join('');
  }

  function fillSiswa(kelasLabel) {
    const siswa = (window.SiswaStore?.getAll() || []).filter(s =>
      `${s.kelas} ${s.jurusan || ''}`.trim() === kelasLabel
    );
    siswaSelect.innerHTML = '<option value="" disabled selected>Pilih Siswa</option>' +
      siswa.map(s => `<option value="${s.id}">${s.nama}</option>`).join('');
    siswaSelect.disabled = siswa.length === 0;
  }

  function checkDuplicate() {
    dupWarning.style.display = 'none';
    const siswaId = siswaSelect.value;
    if (!siswaId || !tanggal.value) return;
    const exist = window.KehadiranStore.getAll()
      .find(e => String(e.siswaId) === String(siswaId) && e.tanggal === tanggal.value);
    if (exist) dupWarning.style.display = 'block';
  }

  kelasSelect.addEventListener('change', () => {
    fillSiswa(kelasSelect.value);
  });
  siswaSelect.addEventListener('change', checkDuplicate);
  tanggal.addEventListener('change', checkDuplicate);

  bukti.addEventListener('change', e => {
    const file = e.target.files?.[0];
    if (!file) { preview.style.display='none'; preview.src=''; return; }
    const fr = new FileReader();
    fr.onload = () => {
      preview.src = fr.result;
      preview.style.display='block';
    };
    fr.readAsDataURL(file);
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const siswaId = siswaSelect.value;
    const siswa = window.SiswaStore.getAll().find(s => String(s.id) === String(siswaId));
    if (!siswa) return alert('Siswa tidak valid');
    const buktiUrl = await readBukti();
    const kelasLabel = `${siswa.kelas} ${siswa.jurusan || ''}`.trim();
    window.KehadiranStore.addOrReplace({
      id: Date.now(),
      siswaId: siswa.id,
      nama: siswa.nama,
      kelas: kelasLabel,          // kelas + jurusan disatukan
      tanggal: tanggal.value,
      status: statusSelect.value,
      keterangan: keterangan.value || '',
      buktiUrl
    });
    alert('Kehadiran disimpan');
    window.location.href = '/pages/kehadiran.html';
  });

  function readBukti() {
    return new Promise(resolve => {
      const file = bukti.files?.[0];
      if (!file) return resolve(null);
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result);
      fr.readAsDataURL(file);
    });
  }

  fillKelas();
})();