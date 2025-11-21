// Normalizer teks
function norm(s) {
  if (!s) return "";
  return String(s).toLowerCase().trim().replace(/\s+/g, " ");
}

(function () {
  const state = {
    classLabel: "",
    todaySet: null,
    siswaAll: [],
    siswaMap: new Map(),
    siswaKelasIds: new Set(),
    rowsScoped: [],
    rowsShown: [],
  };

  // Helper
  const norm = (s) => String(s || "").toLowerCase().trim().replace(/\s+/g, " ");
  const getSession = () => {
    try {
      return JSON.parse(localStorage.getItem("sisko_session") || "null");
    } catch {
      return null;
    }
  };
  const getAllSiswa = () => {
    try {
      const list = JSON.parse(localStorage.getItem("sisko_siswa") || "[]");
      if (Array.isArray(list) && list.length) return list;
    } catch {}
    const out = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!/^siswa[:]/i.test(k)) continue;
      try {
        const arr = JSON.parse(localStorage.getItem(k) || "[]");
        if (Array.isArray(arr)) out.push(...arr);
      } catch {}
    }
    return out;
  };
  const getAllAttendance = () => {
    try {
      return JSON.parse(localStorage.getItem("sisko_kehadiran") || "[]");
    } catch {
      return [];
    }
  };
  const getTodayLabel = () => {
    const d = new Date();
    const dd = String(d.getDate()).padStart(2, "0");
    const mL = d.toLocaleString("id-ID", { month: "long" });
    const yyyy = d.getFullYear();
    return `${dd} ${mL} ${yyyy}`;
  };
  const todayVariants = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const m = String(d.getMonth() + 1);
    const d1 = String(d.getDate());
    return new Set([
      `${yyyy}-${mm}-${dd}`,
      `${dd}/${mm}/${yyyy}`,
      `${d1}/${m}/${yyyy}`,
      `${dd}-${mm}-${yyyy}`,
      getTodayLabel(),
    ]);
  };

  function deriveClassFromSession(sess) {
    if (!sess || sess.role !== "kelas") return "";
    if (sess.kelas) return `${sess.kelas} ${sess.jurusan || ""}`.trim();
    const parts = String(sess.username || "").toLowerCase().split("_").filter(Boolean);
    if (!parts.length) return "";
    const kelas = parts[0].toUpperCase();
    const jur = parts.slice(1).map((p) => (/^\d+$/.test(p) ? p : p.toUpperCase())).join(" ");
    return `${kelas} ${jur}`.trim();
  }

  const $ = (id) => document.getElementById(id);
  const tbody = () => $("absenTable") || $("kehadiranTbody");

  function buildScopedRows() {
    const todaySet = state.todaySet;
    const classLabel = state.classLabel;

    let rows = getAllAttendance().map((r) => {
      if (!r.tanggal && r.date) r.tanggal = r.date;
      if (!r.kelas && r.class) r.kelas = r.class;
      const sid = r.siswaId != null ? r.siswaId : r.id_siswa;
      if ((!r.nama || !r.kelas) && sid != null) {
        const s = state.siswaMap.get(String(sid));
        if (s) {
          if (!r.nama) r.nama = s.nama;
          if (!r.kelas) r.kelas = `${s.kelas || ""} ${s.jurusan || ""}`.trim();
        }
      }
      return r;
    });

    rows = rows.filter((r) => todaySet.has(String(r.tanggal)));

    if (classLabel) {
      rows = rows.filter((r) => {
        const sid = r.siswaId != null ? r.siswaId : r.id_siswa;
        if (sid != null) return state.siswaKelasIds.has(String(sid));
        return norm(r.kelas) === norm(classLabel);
      });
    }

    return rows;
  }

  function updateStats(list) {
    $("statTotal") && ($("statTotal").textContent = list.length);
    $("statHadir") && ($("statHadir").textContent = list.filter((x) => x.status === "Hadir").length);
    $("statIzin") && ($("statIzin").textContent = list.filter((x) => x.status === "Izin").length);
    $("statSakit") && ($("statSakit").textContent = list.filter((x) => x.status === "Sakit").length);
    $("statAlfa") && ($("statAlfa").textContent = list.filter((x) => x.status === "Alfa").length);
  }

  function renderTable(list) {
    const tb = tbody();
    if (!tb) return;
    if (!list.length) {
      tb.innerHTML = '<tr><td colspan="8" class="text-center text-secondary py-4">Tidak ada data hari ini.</td></tr>';
      $("kehadiranInfoCount") && ($("kehadiranInfoCount").textContent = "0 baris");
      return;
    }
    tb.innerHTML = list
      .map(
        (r, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${r.nama || "-"}</td>
        <td>${r.kelas || state.classLabel || "-"}</td>
        <td>${r.tanggal || "-"}</td>
        <td><span class="badge badge-status ${r.status || ""}">${r.status || "-"}</span></td>
        <td>${r.keterangan || "-"}</td>
        <td>${r.buktiUrl ? `<a href="${r.buktiUrl}" target="_blank">Lihat</a>` : "-"}</td>
        <td>-</td>
      </tr>
    `
      )
      .join("");
    $("kehadiranInfoCount") && ($("kehadiranInfoCount").textContent = `${list.length} baris`);
  }

  function applyClientFilters(rows) {
    const q = ($("searchKehadiran")?.value || "").toLowerCase().trim();
    const st = $("filterStatus")?.value || "";
    return rows.filter((r) => {
      if (st && r.status !== st) return false;
      if (q) {
        const hay = [r.nama, r.kelas, r.status, r.keterangan, r.tanggal].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }

  function exportCSV() {
    const rows = state.rowsShown;
    if (!rows.length) {
      alert("Tidak ada data untuk diekspor");
      return;
    }
    const header = ["No", "Nama", "Kelas", "Tanggal", "Status", "Keterangan", "Waktu", "Bukti"];
    const csv = [header, ...rows.map((r, i) => [
      i + 1,
      r.nama || "",
      r.kelas || state.classLabel || "",
      r.tanggal || "",
      r.status || "",
      String(r.keterangan || "").replace(/\r?\n/g, " "),
      r.time || "",
      r.buktiUrl || "",
    ])]
      .map((line) => line.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    const safeClass = String(state.classLabel || "kelas").replace(/\s+/g, "_");
    const safeDate = String(Array.from(state.todaySet)[0]).replace(/[^\w-]/g, "_");
    a.href = URL.createObjectURL(blob);
    a.download = `kehadiran_${safeClass}_${safeDate}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function wireCards() {
    const map = [
      { el: $("statTotal"), val: "" },
      { el: $("statHadir"), val: "Hadir" },
      { el: $("statIzin"), val: "Izin" },
      { el: $("statSakit"), val: "Sakit" },
      { el: $("statAlfa"), val: "Alfa" },
    ];
    map.forEach((x) => {
      if (!x.el) return;
      x.el.style.cursor = "pointer";
      x.el.addEventListener("click", () => {
        if ($("filterStatus")) $("filterStatus").value = x.val;
        runRender();
      });
    });
  }

  function runRender() {
    state.rowsScoped = buildScopedRows();
    updateStats(state.rowsScoped);
    state.rowsShown = applyClientFilters(state.rowsScoped);
    renderTable(state.rowsShown);
  }

  document.addEventListener("DOMContentLoaded", () => {
    const sess = getSession();
    if (!sess || sess.role !== "kelas") {
      console.warn("[kelas-kehadiran] bukan akun kelas; halaman ini khusus kelas.");
      return;
    }

    state.classLabel = deriveClassFromSession(sess);
    state.todaySet = todayVariants();

    if ($("filterKelas") && state.classLabel) {
      $("filterKelas").innerHTML = `<option value="${state.classLabel}">${state.classLabel}</option>`;
      $("filterKelas").value = state.classLabel;
      $("filterKelas").disabled = true;
    }

    const from = $("filterFrom"), to = $("filterTo"), btn = $("btnApplyRange");
    if (from) { from.value = Array.from(state.todaySet)[0]; from.disabled = true; from.classList.add("d-none"); }
    if (to) { to.value   = Array.from(state.todaySet)[0]; to.disabled   = true; to.classList.add("d-none"); }
    btn && btn.classList.add("d-none");

    state.siswaAll = getAllSiswa();
    state.siswaMap = new Map(state.siswaAll.map((s) => [String(s.id), s]));
    state.siswaKelasIds = new Set(
      state.siswaAll
        .filter((s) => norm(`${s.kelas || ""} ${s.jurusan || ""}`) === norm(state.classLabel))
        .map((s) => String(s.id))
    );

    // Wire UI
    $("searchKehadiran")?.addEventListener("input", runRender);
    $("filterStatus")?.addEventListener("change", runRender);
    $("btnRefreshKehadiran")?.addEventListener("click", runRender);
    $("btnExportKehadiran")?.addEventListener("click", exportCSV);
    wireCards();

    runRender();

    console.info("[kelas-kehadiran] class=", state.classLabel, "siswaKelas=", state.siswaKelasIds.size);
  });
})();

(function () {
  const EDITABLE = ['Hadir', 'Alfa'];

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    const sess = getSession();
    if (!sess || sess.role !== 'kelas') {
      console.warn('[kelas-kehadiran] akses ditolak (bukan role kelas)');
      return;
    }

    lockFilters(sess);
    wireUI(sess);
    render(sess);
  }

  function getSession() {
    try { return JSON.parse(localStorage.getItem('sisko_session') || 'null'); } catch { return null; }
  }
  function getAllSiswa() {
    try { return JSON.parse(localStorage.getItem('sisko_siswa') || '[]'); } catch { return []; }
  }
  function getAllAttendance() {
    try { return JSON.parse(localStorage.getItem('sisko_kehadiran') || '[]'); } catch { return []; }
  }
  function saveAttendance(list) {
    localStorage.setItem('sisko_kehadiran', JSON.stringify(list || []));
  }

  function todayIso() {
    return new Date().toISOString().slice(0, 10);
  }
  function todayHuman() {
    const d = new Date();
    const dd = String(d.getDate()).padStart(2, '0');
    const bln = d.toLocaleString('id-ID', { month: 'long' });
    const yy = d.getFullYear();
    return `${dd} ${bln} ${yy}`;
  }
  function norm(s) {
    return String(s || '').toLowerCase().trim().replace(/\s+/g, ' ');
  }
  function kelasLabel(sess) {
    return `${sess.kelas || ''} ${sess.jurusan || ''}`.trim();
  }

  function lockFilters(sess) {
    const kls = kelasLabel(sess);
    const elKelas = document.getElementById('filterKelas');
    if (elKelas) {
      elKelas.innerHTML = `<option value="${kls}" selected>${kls}</option>`;
      elKelas.value = kls;
      elKelas.disabled = true;
      elKelas.classList.add('bg-light');
    }
    const from = document.getElementById('filterFrom');
    const to = document.getElementById('filterTo');
    const apply = document.getElementById('btnApplyRange');
    const iso = todayIso();
    if (from) { from.value = iso; from.disabled = true; from.classList.add('bg-light'); }
    if (to) { to.value = iso; to.disabled = true; to.classList.add('bg-light'); }
    if (apply) { apply.disabled = true; apply.classList.add('disabled'); }
    const tLab = document.getElementById('todayLabel');
    tLab && (tLab.textContent = todayHuman());
  }

  function wireUI(sess) {
    document.getElementById('searchKehadiran')?.addEventListener('input', () => render(sess));
    document.getElementById('filterStatus')?.addEventListener('change', () => render(sess));
    document.getElementById('btnRefreshKehadiran')?.addEventListener('click', () => render(sess));
    document.getElementById('btnExportKehadiran')?.addEventListener('click', () => exportCSV(sess));
  }

  function render(sess) {
    const kls = kelasLabel(sess);
    const isoToday = todayIso();

    const siswaKelas = getAllSiswa()
      .filter(s => norm(`${s.kelas || ''} ${s.jurusan || ''}`) === norm(kls))
      .sort((a, b) => String(a.nama || '').localeCompare(String(b.nama || '')));

    const allAtt = getAllAttendance()
      .map(r => {
        if (!r.tanggal && r.date) r.tanggal = r.date;
        return r;
      })
      .filter(r => r.tanggal === isoToday)
      .filter(r => {
        const sid = r.siswaId != null ? r.siswaId : r.id_siswa;
        return siswaKelas.some(s => String(s.id) === String(sid));
      });

    const attMap = new Map();
    allAtt.forEach(r => {
      const sid = String(r.siswaId ?? r.id_siswa ?? '');
      if (sid) attMap.set(sid, r);
    });

    const rows = siswaKelas.map(s => {
      const rec = attMap.get(String(s.id));
      return rec ? rec : {
        siswaId: s.id,
        id_siswa: s.id,
        nama: s.nama,
        kelas: `${s.kelas || ''} ${s.jurusan || ''}`.trim(),
        tanggal: isoToday,
        status: '',
        keterangan: '',
        buktiUrl: '',
        time: ''
      };
    });

    const searchQ = (document.getElementById('searchKehadiran')?.value || '').toLowerCase().trim();
    const statusFilter = document.getElementById('filterStatus')?.value || '';

    const filtered = rows.filter(r => {
      if (statusFilter && r.status !== statusFilter) return false;
      if (searchQ) {
        const hay = [r.nama, r.kelas, r.status, r.keterangan].join(' ').toLowerCase();
        if (!hay.includes(searchQ)) return false;
      }
      return true;
    });

    renderTable(filtered, sess);
    updateStats(rows);
  }

  function renderTable(list, sess) {
    const tb = document.getElementById('kehadiranTbody');
    if (!tb) return;
    if (!list.length) {
      tb.innerHTML = '<tr><td colspan="7" class="text-center text-secondary py-4">Tidak ada data.</td></tr>';
      setText('kehadiranInfoCount', '0 baris');
      return;
    }

    tb.innerHTML = list.map((r, i) => {
      const sid = r.siswaId ?? r.id_siswa ?? '';
      const editable = sess.role === 'kelas' && (r.status === '' || EDITABLE.includes(r.status));
      const statusCell = editable
        ? `
          <select class="form-select form-select-sm status-edit" data-id="${sid}">
            <option value="" ${r.status === '' ? 'selected' : ''}>-</option>
            <option value="Hadir" ${r.status === 'Hadir' ? 'selected' : ''}>Hadir</option>
            <option value="Alfa" ${r.status === 'Alfa' ? 'selected' : ''}>Alfa</option>
          </select>
        `
        : `<span class="badge badge-status ${r.status}">${r.status || '-'}</span>`;
      return `
        <tr>
          <td class="text-muted">${i + 1}</td>
          <td>${r.nama || '-'}</td>
          <td>${r.kelas || '-'}</td>
          <td>${r.tanggal || '-'}</td>
          <td>${statusCell}</td>
          <td>${r.keterangan || '-'}</td>
          <td>${r.buktiUrl ? `<a href="${r.buktiUrl}" target="_blank">Lihat</a>` : '-'}</td>
        </tr>
      `;
    }).join('');

    setText('kehadiranInfoCount', `${list.length} baris`);

    tb.querySelectorAll('.status-edit').forEach(sel => {
      sel.addEventListener('change', onStatusChange);
    });
  }

  function onStatusChange(e) {
    const sess = getSession();
    if (!sess || sess.role !== 'kelas') return;
    const siswaId = e.target.getAttribute('data-id');
    const value = e.target.value; // '', Hadir, Alfa
    if (value && !EDITABLE.includes(value)) {
      alert('Status tidak diizinkan.');
      e.target.value = '';
      return;
    }
    const isoToday = todayIso();
    const all = getAllAttendance().map(r => {
      if (!r.tanggal && r.date) r.tanggal = r.date;
      return r;
    });

    const idx = all.findIndex(r =>
      String(r.siswaId ?? r.id_siswa) === String(siswaId) &&
      String(r.tanggal) === isoToday
    );

    if (!value) {
      if (idx > -1 && EDITABLE.includes(all[idx].status)) {
        all.splice(idx, 1);
        saveAttendance(all);
      }
      render(sess);
      return;
    }

    if (idx > -1 && ['Sakit', 'Izin'].includes(all[idx].status)) {
      alert('Status Sakit/Izin (admin) tidak dapat diubah.');
      e.target.value = all[idx].status;
      return;
    }

    const siswaRef = getAllSiswa().find(s => String(s.id) === String(siswaId));
    const kelasFull = siswaRef ? `${siswaRef.kelas || ''} ${siswaRef.jurusan || ''}`.trim() : kelasLabel(sess);

    const payload = {
      id: idx > -1 ? (all[idx].id || Date.now()) : Date.now(),
      siswaId: Number(siswaId),
      id_siswa: Number(siswaId),
      nama: siswaRef?.nama || all[idx]?.nama || '',
      kelas: kelasFull,
      tanggal: isoToday,
      date: isoToday,
      status: value,
      keterangan: idx > -1 ? all[idx].keterangan || '' : '',
      buktiUrl: idx > -1 ? all[idx].buktiUrl || '' : '',
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    };

    if (idx > -1) all[idx] = { ...all[idx], ...payload };
    else all.push(payload);

    saveAttendance(all);
    render(sess);
  }

  function updateStats(list) {
    setText('statTotal', list.length);
    setText('statHadir', list.filter(x => x.status === 'Hadir').length);
    setText('statIzin', list.filter(x => x.status === 'Izin').length);
    setText('statSakit', list.filter(x => x.status === 'Sakit').length);
    setText('statAlfa', list.filter(x => x.status === 'Alfa').length);
  }

  function exportCSV(sess) {
    const kls = kelasLabel(sess);
    const isoToday = todayIso();
    const all = getAllAttendance().map(r => {
      if (!r.tanggal && r.date) r.tanggal = r.date;
      return r;
    }).filter(r => r.tanggal === isoToday && norm(r.kelas) === norm(kls));

    if (!all.length) {
      alert('Tidak ada data untuk diekspor.');
      return;
    }

    const header = ['No', 'Nama', 'Kelas', 'Tanggal', 'Status', 'Keterangan', 'Waktu', 'Bukti'];
    const csv = [header, ...all.map((r, i) => [
      i + 1,
      r.nama || '',
      r.kelas || '',
      r.tanggal || '',
      r.status || '',
      String(r.keterangan || '').replace(/\r?\n/g, ' '),
      r.time || '',
      r.buktiUrl || ''
    ])]
      .map(line => line.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `kehadiran_${kls.replace(/\s+/g, '_')}_${isoToday}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }
})();
