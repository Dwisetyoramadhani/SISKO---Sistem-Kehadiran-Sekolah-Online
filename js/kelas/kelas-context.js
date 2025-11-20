(function(){
  function getParamKelas(){
    const p = new URLSearchParams(location.search);
    return (p.get('kelas') || '').trim();
  }
  function normalizeLabel(s){
    return String(s||'').replace(/\s+/g,' ').trim();
  }
  function getActiveClass(){
    const fromUrl = normalizeLabel(getParamKelas());
    if (fromUrl){
      localStorage.setItem('kelas_aktif', fromUrl);
      return fromUrl;
    }
    const saved = normalizeLabel(localStorage.getItem('kelas_aktif'));
    if (saved) return saved;
    // fallback: ambil kelas pertama dari siswa
    const first = (window.SiswaStore?.getAll()||[])
      .map(s => normalizeLabel(`${s.kelas} ${s.jurusan||''}`)).filter(Boolean)[0];
    if (first) localStorage.setItem('kelas_aktif', first);
    return first || '';
  }
  function setActiveClass(label){
    localStorage.setItem('kelas_aktif', normalizeLabel(label));
  }
  function getAllClassLabels(){
    return Array.from(new Set(
      (window.SiswaStore?.getAll()||[])
        .map(s => normalizeLabel(`${s.kelas} ${s.jurusan||''}`))
        .filter(Boolean)
    )).sort();
  }
  window.KelasContext = { getActiveClass, setActiveClass, getAllClassLabels };
})();