# Titik Siap

Aplikasi web lokal untuk refleksi kesiapan kompetensi mahasiswa Informatika / Sistem Informasi. Tampilan akademik terang dengan peta kompetensi 3D, dibuat sesuai pilihan pengguna dengan antislop selama proses pengerjaan.

## Jalankan

Butuh Node.js 22.12+ dan npm. Pengembangan ini diuji menggunakan Node.js 26.8.1.

```sh
cd /home/ariqathallah/.gemini/antigravity-ide/scratch/kompetensi-mahasiswa
npm install
npm run dev
```

Buka http://127.0.0.1:5174 di browser. Server terikat ke localhost. Jika port sedang dipakai oleh server Titik Siap yang sudah berjalan, buka alamat yang sama tanpa menjalankan server kedua. Untuk port lain: `npm run dev -- --port 5175`.

```sh
npm test
npm run build
npm run preview
```

`preview` digunakan setelah build dan setelah server dev di port yang sama dihentikan. Hasil build berada di `dist/` dan bisa di-host sebagai situs statis. Aplikasi belum dipublikasikan ke internet.

## Yang sudah berfungsi

- Peta Three.js dengan enam domain, pilih bidang, rotasi lewat seret, zoom, dan reset kamera. Tinggi pulau mengikuti indeks domain.
- Animasi 3D: pembentukan bidang bertahap, gerak pembuka kamera, transisi fokus saat dipilih, zoom/reset halus, serta inersia saat diseret. Tombol Ulang animasi dan Putar otomatis/Jeda memberi kontrol langsung. Memilih bidang atau menyeret menghentikan putaran otomatis.
- Animasi tambahan mengikuti pengaturan reduced-motion. Render berhenti saat diam, peta di luar layar, tab tersembunyi, atau komponen ditutup.
- Data simulasi ditandai; hasil pribadi kosong sampai asesmen diselesaikan.
- Asesmen 18 indikator dalam enam langkah. Skala 0–4, validasi jawaban, draf tersimpan di browser.
- Target pengembang perangkat lunak, analis sistem, dan analis data dengan bobot berbeda.
- Inferensi berbasis aturan: indeks domain, indeks berbobot, syarat domain utama, indikator prasyarat, dan kesimpulan kesiapan. Sepuluh langkah alasan bisa dibuka.
- Tiga prioritas latihan berikut bukti kerja yang disarankan; centang kemajuan tersimpan lokal.
- Delapan hasil terakhir, lihat hasil lama, ekspor JSON, dan cetak melalui dialog browser.
- Hapus data dengan konfirmasi, pelaporan kesalahan penyimpanan, dan fallback daftar jika WebGL tidak tersedia.
- Layout ponsel, tablet, dan desktop; navigasi keyboard, focus ring, dan dukungan reduced-motion.
- Font disediakan lokal melalui paket, tanpa ketergantungan layanan font eksternal saat aplikasi dipakai.

## Batas penggunaan

Ini prototipe akademik yang berfungsi, bukan instrumen penilaian resmi. Pertanyaan, bobot, dan ambang kesiapan adalah aturan demonstrasi yang belum divalidasi oleh pakar. Nilai adalah indeks atas jawaban mandiri, bukan probabilitas, nilai akademik, atau sertifikasi kompetensi.

Data hanya ada di localStorage browser yang digunakan. Tidak ada akun, backend, atau sinkronisasi perangkat. Pada perangkat bersama, gunakan menu Kelola data lokal setelah selesai. Hapus data browser juga akan menghapus hasil aplikasi. Simulasi tidak dicatat sebagai riwayat pribadi.

## Struktur utama

- `src/engine.ts`: indikator, profil target, aturan, penjelasan, dan urutan rekomendasi.
- `src/storage.ts`: validasi format penyimpanan dan penanganan kegagalan.
- `src/App.tsx`: asesmen, hasil, dasar penilaian, dan interaksi aplikasi.
- `src/CompetencyMap.tsx`: scene 3D, kontrol kamera, label, serta fallback.
- `src/mapMotion.ts`: animasi berbasis waktu, perpindahan kamera, preferensi gerak, dan pengelolaan render.
- `src/styles.css`: tata letak responsif dan gaya cetak.
- `DESIGN.md`: arah pengguna dan alasan keputusan visual.
- `docs/DELIVERY-GATE.md`: audit antislop dan bukti verifikasi.

## Pengujian browser

Jalankan server lokal lebih dulu. Browser pengujian menggunakan Chrome yang sudah terpasang, terpisah dari profil browser pribadi.

```sh
python3 -m venv /tmp/titik-siap-test-env
/tmp/titik-siap-test-env/bin/pip install playwright
/tmp/titik-siap-test-env/bin/python tests/browser.py
npm run test:accessibility
npm run test:animation
```

Jika Chrome berada di lokasi lain, set `CHROME_PATH`. URL server bisa diatur dengan `TEST_URL`. Pengujian headless memakai software WebGL untuk lingkungan tanpa GPU. Cetak diuji sampai pemanggilan `window.print`; dialog cetak milik sistem operasi tidak diotomasi.

Laporan tersimpan di `docs/browser-results.json`, `docs/accessibility-results.json`, dan `docs/animation-results.json`. Screenshot ada di `docs/screenshots/`. Audit otomatis aksesibilitas mencakup empat halaman pada desktop dan ponsel; hasilnya tidak menggantikan audit aksesibilitas manual lengkap.
