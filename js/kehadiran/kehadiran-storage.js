(function(){
  const KEY = 'sisko_kehadiran';

  function read(){ try { return JSON.parse(localStorage.getItem(KEY)||'[]'); } catch { return []; } }
  function write(a){ localStorage.setItem(KEY, JSON.stringify(a)); }

  function seed(){
    const d = read(); if (d.length) return;
    const today = new Date().toISOString().slice(0,10);
    const yest = new Date(Date.now()-86400000).toISOString().slice(0,10);
    write([
      { id:1, nama:'Andi',  kelas:'X RPL 1', tanggal:today, status:'Hadir', keterangan:'', buktiUrl:'' },
      { id:2, nama:'Budi',  kelas:'X RPL 1', tanggal:today, status:'Izin',  keterangan:'Izin keluarga', buktiUrl:'' },
      { id:3, nama:'Citra', kelas:'X RPL 1', tanggal:today, status:'Sakit', keterangan:'Demam', buktiUrl:'' },
      { id:4, nama:'Andi',  kelas:'X RPL 1', tanggal:yest,  status:'Hadir', keterangan:'', buktiUrl:'' }
    ]);
    console.info('[Kehadiran] seed dibuat');
  }

  function getAll(){ return read(); }
  function getByClass(label){ return getAll().filter(x=>x.kelas===label); }
  function add(entry){ const arr=read(); entry.id=Date.now()+Math.random(); arr.push(entry); write(arr); return entry; }
  function remove(id){ const arr=read().filter(x=>x.id!==id); write(arr); }
  function clear(){ write([]); }

  function csvEscape(v){
    if (v == null) v = '';
    v = String(v);
    if (/[",\n]/.test(v)) v = '"' + v.replace(/"/g,'""') + '"';
    return v;
  }
  function toCSV(rows){
    const header = ['No','Nama','Kelas','Tanggal','Status','Keterangan','BuktiURL'];
    const lines = [header.join(',')];
    rows.forEach((r,i)=>{
      lines.push([
        i+1,
        csvEscape(r.nama||''),
        csvEscape(r.kelas||''),
        csvEscape(r.tanggal||''),
        csvEscape(r.status||''),
        csvEscape(r.keterangan||''),
        csvEscape(r.buktiUrl||'')
      ].join(','));
    });
    // Tambahkan BOM agar Excel Windows menampilkan UTF-8 dengan benar
    return '\uFEFF' + lines.join('\r\n');
  }
  function downloadCSV(csv, filename){
    const blob = new Blob([csv], { type:'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; document.body.appendChild(a);
    a.click(); a.remove(); URL.revokeObjectURL(url);
  }
  function stamp(){ const d=new Date(); const pad=n=>String(n).padStart(2,'0'); return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`; }

  // rowsOpsional: jika tidak diberikan, ekspor semua data
  function exportCSV(rows){
    let src = Array.isArray(rows) && rows.length ? rows : getAll();
    const csv = toCSV(src);
    const name = (Array.isArray(rows) && rows.length) ? `sisko_kehadiran_filtered_${stamp()}.csv`
                                                      : `sisko_kehadiran_semua_${stamp()}.csv`;
    downloadCSV(csv, name);
  }

  seed();
  window.KehadiranStore = { getAll, getByClass, add, remove, clear, exportCSV };
})();