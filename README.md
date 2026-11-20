# MY FINANCE — Personal Finance Manager

Aplikasi keuangan pribadi berbasis web (PWA). Semua data disimpan lokal di browser (IndexedDB), tanpa backend, dan tidak mengirim data ke layanan eksternal.

## Menjalankan

Tidak perlu instalasi paket. Cukup jalankan server statis lokal:

```bash
python3 -m http.server 8080
# buka http://localhost:8080
```

Atau `npm start` (perintah yang sama). Service worker (mode offline) hanya aktif di `localhost` atau di situs HTTPS.

Untuk HP: deploy folder ini ke hosting statis HTTPS (mis. GitHub Pages, Netlify), lalu "Tambahkan ke layar utama".

## Menguji

```bash
npm test    # node --test tests/*.test.mjs (40 tes: saldo, transfer, validasi, CSV, impor, backup)
```

## Fitur

- **ATM tanpa batas**: tambah, ganti nama, saldo awal, ikut/tidak ikut total, arsip, hapus (hanya jika belum punya riwayat).
- **Saldo dihitung dari transaksi** (saldo awal + pemasukan − pengeluaran ± transfer − biaya admin). Tidak ada saldo statis yang disimpan.
- **Pemasukan, pengeluaran, transfer antar-ATM.** Transfer disimpan sebagai satu catatan yang memuat kedua sisi, sehingga tidak bisa terhapus sebagian. Transfer tidak dihitung sebagai pemasukan atau pengeluaran.
- **Edit dan hapus** transaksi/transfer dengan konfirmasi; data lama ditampilkan saat edit. Hapus bersifat soft delete.
- **Riwayat**: Tahun → Bulan → Kalender → Tanggal → Detail, dengan penanda per tanggal, filter ATM/jenis/kategori, dan pencarian keterangan. Posisi riwayat memakai tanggal transaksi.
- **Laporan**: periode hari/minggu/bulan/tahun/rentang, grafik pemasukan vs pengeluaran, kategori pengeluaran, perkembangan saldo, perbandingan antar-ATM, grafik bulanan dan tahunan.
- **Log aktivitas**: setiap tambah/edit/hapus, ATM, kategori, impor, backup, dan restore. Edit menyimpan data sebelum dan sesudah. Log tidak ikut hilang saat data diedit.
- **CSV**: impor dengan pratinjau, pemetaan kolom, validasi per baris, deteksi duplikat, dan konfirmasi. Ekspor dengan filter ATM, kategori, tanggal, dan jenis.
- **Backup/restore**: satu file JSON. Backup bisa dienkripsi AES-GCM dengan kata sandi. PIN tidak pernah diekspor. Restore memvalidasi struktur file, menampilkan pratinjau, meminta konfirmasi, dan berjalan dalam satu transaksi IndexedDB (gagal = database lama utuh).
- **Keamanan**: PIN 4–8 digit, disimpan sebagai hash PBKDF2-SHA256 (250.000 iterasi, salt unik) dengan Web Crypto. Jeda eksponensial setelah 3 percobaan salah. Kunci otomatis sesuai pengaturan. Pemulihan lupa PIN hanya lewat reset total lalu restore file backup.

## Struktur

```
index.html, manifest.webmanifest, sw.js, icon.svg, css/styles.css
js/
  app.js               boot, routing hash, navigasi, delegasi event, kunci otomatis
  state.js             state bersama & refresh
  core/                logika murni (tanpa DOM/DB): money, ledger (saldo & laporan), validate, csv, importer, security
  database/db.js       lapisan IndexedDB (transaksi atomik)
  services/            finance.js (semua penulisan + activity log), defaults.js (kategori awal)
  ui/                  dom.js, charts.js (SVG), rows.js, lock-screen.js
  views/               dashboard, accounts, transactions, history, reports, logs, data, settings
tests/ledger.test.mjs  uji otomatis perhitungan & validasi
```

## Keputusan teknis & deviasi dari spesifikasi

Spesifikasi meminta React, TypeScript, Vite, Tailwind, Dexie, Recharts, Papa Parse, dan Lucide. Lingkungan tempat aplikasi ini dibuat tidak bisa mengunduh paket npm, sehingga versi ini dibangun **tanpa framework dan tanpa build step** (JavaScript ES modules murni). Fungsinya sama, tetapi:

- **IndexedDB** memakai API native lewat `js/database/db.js` (pengganti Dexie). Index dan skema mengikuti spesifikasi, ditambah field `source`/`purpose` untuk pemasukan/pengeluaran.
- **Grafik** dibuat dengan SVG sendiri (pengganti Recharts). **CSV** memakai parser RFC 4180 sendiri (pengganti Papa Parse). **Ikon** adalah path SVG bergaya Lucide yang digambar inline.
- **Biaya admin transfer** dicatat sebagai field pada transfer, bukan transaksi pengeluaran terpisah. Ini menghindari double counting. Saldo tetap dikurangi biaya, dan laporan menghitungnya sebagai pengeluaran.
- **Kata sandi = PIN.** Aplikasi memakai satu rahasia untuk "PIN/password" dan "ganti password".
- **Data di IndexedDB tidak terenkripsi.** PIN hanya mengunci tampilan aplikasi. Keamanan browser lokal tidak sama dengan server khusus; siapa pun dengan akses ke profil browser dapat mencoba menebak PIN offline.
- **Tidak ada data contoh.** Hanya kategori awal yang dibuat otomatis.
- **Belum ada** mode gelap dan Vitest. Lapisan database diuji lewat browser (smoke test Playwright), sedangkan logika murni diuji dengan `node:test`.

Jika nanti ingin dipindah ke React + Vite + Dexie, `js/core/` dan `js/services/` bisa dipakai apa adanya karena tidak bergantung pada DOM.
