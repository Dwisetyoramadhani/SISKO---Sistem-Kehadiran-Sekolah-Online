# SISKO (Sistem Informasi Kehadiran Sekolah)

Aplikasi front-end berbasis HTML/CSS/JS yang menyimpan data kehadiran siswa (Hadir, Sakit, Izin, Alpa).

## Fitur

- Login (admin & kelas/walikelas)
- Dashboard admin dan dashboard kelas/walikelas terpisah
- Manajemen siswa & kehadiran (seed awal otomatis)
- Filter, pencarian, ekspor CSV data kehadiran
- Sidebar dinamis menampilkan info akun
- Grafik kehadiran 7 hari (ApexCharts)

## Instalasi

1. Clone atau salin folder.
2. Buka di VS Code.
3. Jalankan ekstensi Live Server (opsional) agar path /pages/... berfungsi. Atau buka run file index.html di root project

## Penggunaan

1. Buka /pages/login.html
2. Login:
   - admin / admin123
   - x_rpl_1 / kelas123
3. Navigasi via sidebar.

## Auth Lokal

Objek global:

```js
Auth.login(username, password)
Auth.logout()
Auth.session()
Auth.addUser({...})
```

## Ekspor CSV

Tombol Export:

- OK = ekspor data terfilter
- Cancel = ekspor semua
