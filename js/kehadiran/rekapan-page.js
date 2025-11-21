(function(){
  document.addEventListener('DOMContentLoaded', init);

  const norm = s => String(s||'').toLowerCase().trim().replace(/\s+/g,' ');
  const getSession = () => { try { return JSON.parse(localStorage.getItem('sisko_session')||'null'); } catch { return null; } };
  const getSiswa = () => { try { return JSON.parse(localStorage.getItem('sisko_siswa')||'[]'); } catch { return []; } };
  const getAtt = () => { try { return JSON.parse(localStorage.getItem('sisko_kehadiran')||'[]'); } catch { return []; } };

  const toISO = v => {
    if (!v) return '';
    const s = String(v);
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    const d = new Date(s); return isNaN(d)? '' : d.toISOString().slice(0,10);
  };

  function init(){
    const sess = getSession();
    const elKelas = document.getElementById('rekapKelas');
    const elFrom = document.getElementById('rekapFrom');
    const elTo   = document.getElementById('rekapTo');
    const elSearch = document.getElementById('rekapSearch');

    const allClasses = collectClasses();
    elKelas.innerHTML = '<option value="">Semua Kelas</option>'+ allClasses.map(c=>`<option value="${c}">${c}</option>`).join('');

    if (sess?.role === 'kelas'){
      const cls = `${sess.kelas||''} ${sess.jurusan||''}`.trim();
      if (cls && !allClasses.some(x=>norm(x)===norm(cls))){
        elKelas.insertAdjacentHTML('beforeend', `<option value="${cls}">${cls}</option>`);
      }
      elKelas.value = cls;
      elKelas.disabled = true;
      elKelas.classList.add('bg-light');
    }

    const dates = getAtt().map(a=>toISO(a.tanggal || a.date)).filter(Boolean).sort();
    if (dates.length){
      elFrom.value = dates[0];
      elTo.value = dates[dates.length-1];
    } else {
      const t = new Date().toISOString().slice(0,10);
      elFrom.value = t; elTo.value = t;
    }

    const run = () => render({
      kelas: elKelas.value,
      from: elFrom.value,
      to: elTo.value,
      search: elSearch.value
    });

    document.getElementById('rekapApply')?.addEventListener('click', run);
    elKelas.addEventListener('change', run);
    elFrom.addEventListener('change', run);
    elTo.addEventListener('change', run);
    elSearch.addEventListener('input', run);
    document.getElementById('rekapExport')?.addEventListener('click', exportCSV);

    run();
  }

  function collectClasses(){
    const sCls = getSiswa().map(s=>`${s.kelas||''} ${s.jurusan||''}`.trim()).filter(Boolean);
    const aCls = getAtt().map(a=>a.kelas||'').filter(Boolean);
    return Array.from(new Set([...sCls, ...aCls].filter(Boolean))).sort();
  }

  function render(opt){
    const siswa = getSiswa();
    const siswaMap = new Map(siswa.map(s=>[String(s.id), s]));
    const from = toISO(opt.from);
    const to   = toISO(opt.to);
    const kelasSel = opt.kelas;
    const searchQ = norm(opt.search);

    const att = getAtt().map(r=>{
      const t = r.tanggal || r.date;
      r.tanggal = toISO(t);
      return r;
    }).filter(r=>r.tanggal && (!from || r.tanggal >= from) && (!to || r.tanggal <= to))
      .filter(r=>{
        if (!kelasSel) return true;
        const sid = r.siswaId ?? r.id_siswa;
        const clsRec = r.kelas || (sid!=null ? `${siswaMap.get(String(sid))?.kelas||''} ${siswaMap.get(String(sid))?.jurusan||''}`.trim() : '');
        return norm(clsRec) === norm(kelasSel);
      });

    const perSiswa = new Map();
    let targetSiswa = siswa;
    if (kelasSel){
      targetSiswa = siswa.filter(s => norm(`${s.kelas||''} ${s.jurusan||''}`) === norm(kelasSel));
    }

    for (const s of targetSiswa){
      perSiswa.set(String(s.id), {
        id: s.id,
        nama: s.nama,
        kelas: `${s.kelas||''} ${s.jurusan||''}`.trim(),
        Hadir:0, Izin:0, Sakit:0, Alfa:0
      });
    }

    for (const r of att){
      const sid = String(r.siswaId ?? r.id_siswa ?? '');
      if (!sid) continue;
      if (!perSiswa.has(sid)){
        const sRef = siswaMap.get(sid);
        if (!sRef) continue;
        perSiswa.set(sid,{
          id: sRef.id,
          nama: sRef.nama,
          kelas: `${sRef.kelas||''} ${sRef.jurusan||''}`.trim(),
          Hadir:0,Izin:0,Sakit:0,Alfa:0
        });
      }
      if (['Hadir','Izin','Sakit','Alfa'].includes(r.status)){
        perSiswa.get(sid)[r.status] += 1;
      }
    }

    let rows = Array.from(perSiswa.values());
    if (searchQ){
      rows = rows.filter(r => norm(r.nama).includes(searchQ) || norm(r.kelas).includes(searchQ));
    }

    rows.sort((a,b)=> a.nama.localeCompare(b.nama));

    const tb = document.getElementById('rekapTbody');
    if (!tb) return;

    if (!rows.length){
      tb.innerHTML = '<tr><td colspan="9" class="text-center text-secondary py-4">Tidak ada data.</td></tr>';
      setText('rekapInfo','0 siswa');
      updateStats([]);
      window.__rekapPerSiswa = [];
      return;
    }

    tb.innerHTML = rows.map((r,i)=>{
      const total = r.Hadir + r.Izin + r.Sakit + r.Alfa;
      const pct = total ? ((r.Hadir / total)*100).toFixed(1)+'%' : '0%';
      return `
        <tr>
          <td class="text-muted">${i+1}</td>
          <td>${escape(r.nama)}</td>
          <td>${escape(r.kelas)}</td>
          <td>${r.Hadir}</td>
          <td>${r.Izin}</td>
          <td>${r.Sakit}</td>
          <td>${r.Alfa}</td>
          <td>${total}</td>
          <td>${pct}</td>
        </tr>
      `;
    }).join('');

    setText('rekapInfo', `${rows.length} siswa`);
    updateStats(rows);
    window.__rekapPerSiswa = rows;
    window.__rekapMeta = { from, to, kelasSel };
  }

  function updateStats(rows){
    setText('statSiswa', rows.length);
    setText('statHadir', rows.reduce((a,b)=>a+b.Hadir,0));
    setText('statIzin', rows.reduce((a,b)=>a+b.Izin,0));
    setText('statSakit', rows.reduce((a,b)=>a+b.Sakit,0));
    setText('statAlfa', rows.reduce((a,b)=>a+b.Alfa,0));
  }

  function exportCSV(){
    const rows = window.__rekapPerSiswa || [];
    if (!rows.length){ alert('Tidak ada data untuk diekspor.'); return; }
    const meta = window.__rekapMeta || {};
    const header = ['No','Nama','Kelas','Hadir','Izin','Sakit','Alfa','Total','PersenHadir','Dari','Sampai','KelasFilter'];
    const lines = rows.map((r,i)=>{
      const total = r.Hadir + r.Izin + r.Sakit + r.Alfa;
      const pct = total ? ((r.Hadir/total)*100).toFixed(2)+'%' : '0%';
      return [
        i+1, r.nama, r.kelas, r.Hadir, r.Izin, r.Sakit, r.Alfa, total, pct,
        meta.from||'', meta.to||'', meta.kelasSel||''
      ];
    });
    const csv = [header, ...lines]
      .map(row => row.map(v => `"${String(v).replace(/"/g,'""')}"`).join(','))
      .join('\n');
    const fname = `rekapan_per_siswa_${(meta.kelasSel||'semua_kelas').replace(/\s+/g,'_')}_${meta.from||'all'}_${meta.to||'all'}.csv`;
    const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = fname;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function setText(id,val){ const el=document.getElementById(id); if (el) el.textContent=val; }
  function escape(s){ return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c])); }
})();