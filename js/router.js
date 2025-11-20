const routes = {
  "/siswa": "pages/siswa.html",
  "/izin": "pages/izin.html",
  "/absen": "pages/absen.html",
};

function loadPage(path) {
  const page = routes[path];

  // Jika halaman tidak ditemukan → jangan load apa pun (tetap dashboard)
  if (!page) {
    document.getElementById("app").innerHTML = "";
    return;
  }

  fetch(page)
    .then((res) => res.text())
    .then((html) => {
      document.getElementById("app").innerHTML = html;
    });
}

function router() {
  const hash = location.hash.replace("#", "");

  // Kosong atau "/" → dashboard
  if (hash === "" || hash === "/") {
    document.getElementById("app").innerHTML = "";
    return;
  }

  loadPage(hash);
}

window.addEventListener("hashchange", router);
window.addEventListener("load", router);
