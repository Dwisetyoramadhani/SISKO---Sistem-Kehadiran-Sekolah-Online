(() => {
  const form = document.getElementById('formSiswa');
  if (!form) return;

  const fileInput = document.getElementById('fileSiswa');
  const previewWrap = document.getElementById('previewWrap');
  const previewTable = document.getElementById('previewTable');
  const previewInfo = document.getElementById('previewInfo');
  const btnTemplate = document.getElementById('btnTemplate');
  const btnHapus = document.getElementById('btnHapus');
  const btnSimpan = document.getElementById('btnSimpan');
  const uploadStatus = document.getElementById('uploadStatus');

  let parsedRows = [];

  function setStatus(msg, type='info') {
    uploadStatus.className = `small mb-2 text-${type==='error'?'danger':type==='success'?'success':'muted'}`;
    uploadStatus.textContent = msg;
  }

  function resetPreview() {
    parsedRows = [];
    previewTable.innerHTML = '';
    previewWrap.classList.add('d-none');
    previewInfo.textContent = '';
    btnSimpan.disabled = true;
  }

  function normalize(r) {
    return {
      nama: String(r.nama || r.Nama || '').trim(),
      kelas: String(r.kelas || r.Kelas || '').trim(),
      jurusan: String(r.jurusan || r.Jurusan || '').trim()
    };
  }

  function validateRows(rows) {
    const cleaned = rows.map(normalize).filter(r => r.nama && r.kelas);
    return { cleaned, dropped: rows.length - cleaned.length };
  }

  function renderPreview(rows) {
    if (!rows.length) return resetPreview();
    const head = `<thead><tr><th>#</th><th>Nama</th><th>Kelas</th><th>Jurusan</th></tr></thead>`;
    const body = rows.map((r,i)=>`
      <tr>
        <td>${i+1}</td>
        <td>${r.nama}</td>
        <td>${r.kelas}</td>
        <td>${r.jurusan || '-'}</td>
      </tr>`).join('');
    previewTable.innerHTML = head + `<tbody>${body}</tbody>`;
    previewInfo.textContent = `${rows.length} baris valid siap disimpan`;
    previewWrap.classList.remove('d-none');
    btnSimpan.disabled = false;
  }

  async function parseCSV(text) {
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    if (!lines.length) return [];
    const header = lines[0].split(',').map(h => h.trim().toLowerCase());
    const idx = {
      nama: header.indexOf('nama'),
      kelas: header.indexOf('kelas'),
      jurusan: header.indexOf('jurusan')
    };
    return lines.slice(1).map(l => {
      const cols = l.split(',').map(c => c.trim());
      return {
        nama: idx.nama>=0 ? cols[idx.nama] : '',
        kelas: idx.kelas>=0 ? cols[idx.kelas] : '',
        jurusan: idx.jurusan>=0 ? cols[idx.jurusan] : ''
      };
    });
  }

  async function handleFile(file) {
    resetPreview();
    if (!file) return;
    setStatus('Memproses file...', 'info');
    const ext = file.name.toLowerCase().split('.').pop();
    let raw = [];
    try {
      if (ext === 'csv') {
        raw = await parseCSV(await file.text());
      } else if (ext === 'xlsx' || ext === 'xls') {
        const buf = await file.arrayBuffer();
        const wb = XLSX.read(buf, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        raw = XLSX.utils.sheet_to_json(ws, { defval: '' });
      } else {
        setStatus('Format tidak didukung', 'error');
        return;
      }
    } catch (e) {
      console.error(e);
      setStatus('Gagal membaca file', 'error');
      return;
    }
    if (!raw.length) { setStatus('Tidak ada data', 'error'); return; }
    const { cleaned, dropped } = validateRows(raw);
    if (!cleaned.length) { setStatus('Semua baris tidak valid (cek Nama/Kelas)', 'error'); return; }
    parsedRows = cleaned;
    renderPreview(parsedRows);
    setStatus(`Valid: ${cleaned.length}${dropped?`, terlewat: ${dropped}`:''}`, 'success');
  }

  fileInput.addEventListener('change', e => handleFile(e.target.files?.[0]));

  form.addEventListener('submit', e => {
    e.preventDefault();
    if (!parsedRows.length) return alert('Tidak ada data valid');
    window.SiswaStore.addMany(parsedRows);
    alert(`Disimpan: ${parsedRows.length} baris`);
    // redirect ke table siswa
    window.location.href = '/pages/siswa.html';
  });

  btnTemplate.addEventListener('click', () => {
    const csv = ['Nama,Kelas,Jurusan','Budi,X,RPL 1','Siti,XI,TP 2','Andi,XII,RPL 2'].join('\n');
    const blob = new Blob([csv],{type:'text/csv;charset=utf-8;'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'template_siswa.csv';
    a.click();
  });

  btnHapus.addEventListener('click', () => {
    if (!confirm('Hapus semua data siswa?')) return;
    window.SiswaStore.clear();
    alert('Data terhapus');
    resetPreview();
    setStatus('LocalStorage kosong', 'info');
  });
})();