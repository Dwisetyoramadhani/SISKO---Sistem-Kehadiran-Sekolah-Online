(() => {
  const form = document.getElementById('formKelas');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const kelas = document.getElementById('kelas').value.trim();
    const jurusan = document.getElementById('jurusan').value.trim();
    const walikelas = document.getElementById('walikelas').value.trim();
    if (!kelas || !jurusan || !walikelas) return alert('Lengkapi form');
    window.KelasStore.add({ kelas, jurusan, walikelas });
    alert('Data kelas disimpan');
    window.location.href = '/pages/kelas.html';
  });
})();