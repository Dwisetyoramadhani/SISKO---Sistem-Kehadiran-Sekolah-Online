// Normalizer teks
function norm(s) {
  if (!s) return "";
  return String(s).toLowerCase().trim().replace(/\s+/g, " ");
}

function deriveClassFromSession(sess){
  if (!sess || sess.role !== 'kelas') return '';
  if (sess.kelas) return `${sess.kelas} ${sess.jurusan||''}`.trim();
  // fallback dari username
  const raw = String(sess.username||'').toLowerCase();
  const parts = raw.split('_').filter(Boolean);
  if (!parts.length) return '';
  const cap = s => s.replace(/\b\w/g,c=>c.toUpperCase());
  const kelas = cap(parts[0]);
  const jurusan = cap(parts.slice(1).join(' '));
  return `${kelas} ${jurusan}`.trim();
}

function findClassViaSiswa(sess){
  if (!sess || sess.role!=='kelas') return '';
  const all = JSON.parse(localStorage.getItem('sisko_siswa')||'[]');
  const label = deriveClassFromSession(sess);
  if (!label) return '';
  const hit = all.find(s => `${s.kelas||''} ${s.jurusan||''}`.trim().toLowerCase() === label.toLowerCase());
  if (hit) return `${hit.kelas} ${hit.jurusan||''}`.trim();
  return label; 
}

function getSession(){
  try { return JSON.parse(localStorage.getItem('sisko_session')||'null'); }
  catch { return null; }
}

function getAllSiswa() {
  return JSON.parse(localStorage.getItem("sisko_siswa") || "[]");
}

function getAllAttendance() {
  return JSON.parse(localStorage.getItem("sisko_kehadiran") || "[]");
}

function saveAttendance(list) {
  localStorage.setItem("sisko_kehadiran", JSON.stringify(list));
}

function getTodayLabel() {
  const today = new Date();
  const day = String(today.getDate()).padStart(2, "0");
  const month = today.toLocaleString("id-ID", { month: "long" });
  const year = today.getFullYear();
  return `${day} ${month} ${year}`;
}

function load() {
  const sess = getSession();
  if (!sess || sess.role !== 'kelas'){
    alert('Halaman ini hanya untuk akun kelas.');
    return;
  }
  let classLabel = `${sess.kelas||''} ${sess.jurusan||''}`.trim();
  if (!classLabel){
    classLabel = findClassViaSiswa(sess);
    if (!classLabel){
      alert('Akun kelas belum memiliki kelas/jurusan & tidak dapat diturunkan.');
      return;
    }
  }

  const allSiswa = getAllSiswa();
  const siswaKelas = allSiswa
    .filter(s => norm(`${s.kelas} ${s.jurusan}`) === norm(classLabel))
    .sort((a, b) => a.nama.localeCompare(b.nama));

  const tbody = document.getElementById("absenTable");
  if (!tbody) return;

  const todayLabel = getTodayLabel();

  const allAbsensi = getAllAttendance();
  const allowedIds = new Set(siswaKelas.map(s => String(s.id)));

  const todayAtt = allAbsensi.filter(a =>
    a.date === todayLabel &&
    (
      
      (a.id_siswa != null && allowedIds.has(String(a.id_siswa))) ||
      
      norm(a.kelas) === norm(classLabel)
    )
  );

  const attendMap = new Map();
  todayAtt.forEach(a => {
    if (a.id_siswa != null && allowedIds.has(String(a.id_siswa))) {
      attendMap.set(a.id_siswa, a);
    } else if (norm(a.kelas) === norm(classLabel) && a.id_siswa != null) {
      attendMap.set(a.id_siswa, a);
    }
  });

  tbody.innerHTML = "";
  if (!siswaKelas.length) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-center text-secondary">Tidak ada siswa untuk kelas ${classLabel}</td></tr>`;
    return;
  }

  siswaKelas.forEach((s, i) => {
    const rec = attendMap.get(s.id) || { status: "" };
    const kelasFull = `${s.kelas} ${s.jurusan}`.trim();
    tbody.insertAdjacentHTML("beforeend", `
      <tr>
        <td>${i + 1}</td>
        <td>${s.nama}</td>
        <td>${kelasFull}</td>
        <td>
          <select class="form-select form-select-sm status-input" data-id="${s.id}">
            <option value="">-</option>
            <option value="Hadir" ${rec.status === "Hadir" ? "selected" : ""}>Hadir</option>
            <option value="Izin" ${rec.status === "Izin" ? "selected" : ""}>Izin</option>
            <option value="Sakit" ${rec.status === "Sakit" ? "selected" : ""}>Sakit</option>
            <option value="Alfa" ${rec.status === "Alfa" ? "selected" : ""}>Alfa</option>
          </select>
        </td>
      </tr>
    `);
  });

  tbody.querySelectorAll(".status-input").forEach(sel => {
    sel.addEventListener("change", e => saveStatus(e, classLabel, todayLabel));
  });
}

function saveStatus(e, classLabel, todayLabel) {
  const id = Number(e.target.dataset.id);
  const status = e.target.value;

  const all = getAllAttendance();

  const kept = all.filter(r => !(r.id_siswa === id && r.date === todayLabel));

  if (status) {
    kept.push({
      id_siswa: id,
      kelas: classLabel,
      status,
      date: todayLabel,
      time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
    });
  }

  saveAttendance(kept);
}

document.addEventListener("DOMContentLoaded", load);
