# Antislop delivery gate

Lingkup: prototipe lokal Titik Siap, untuk Informatika / Sistem Informasi. Arah pengguna: akademik modern, terang, hijau tua, peta kompetensi 3D. Mode: selama pembuatan. Aturan evaluasi tetap berstatus demonstrasi, belum divalidasi pakar.

## Bukti verifikasi

- Build TypeScript dan Vite berhasil. Three.js dipisahkan sebagai chunk yang dimuat melalui komponen lazy. Build memberi pemberitahuan ukuran chunk Three.js sekitar 529 kB mentah / 132 kB gzip; tidak ada kegagalan build.
- Enam tes unit di `tests/engine.test.ts` lulus: nilai ekstrem, input tidak valid, ambang kesiapan, prasyarat, batas domain utama, dan hitungan manual data contoh 68,75.
- Enam belas skenario browser lulus; bukti tersimpan di `browser-results.json`. Browser Chrome headless memakai software WebGL.
- Empat halaman diuji pada lebar 320, 390, 540, 760, 820, 1024, dan 1440 piksel tanpa overflow horizontal.
- Delapan audit axe-core WCAG A/AA (empat halaman × desktop/ponsel) tidak menemukan pelanggaran; bukti `accessibility-results.json`. Ini cakupan pengujian otomatis, bukan sertifikasi aksesibilitas lengkap.
- Warna teks sekunder #536747 terhadap #edf0e7 diperiksa menggunakan `antislop-human/contrast-check.py`: rasio 5,36:1, PASS teks normal dan besar.
- Pembesaran teks 200% pada halaman peta desktop diperiksa, tanpa overflow horizontal. Screenshot `screenshots/zoom200.png`.
- Pemeriksaan tambahan: tombol Mulai asesmen, Lanjutkan asesmen, CTA kondisi kosong, dan ekspor simulasi bekerja. Label peta berada dalam kanvas setelah zoom pada 320, 390, 820, dan 1440 piksel.

## Block 1: Hard Gate

- R-02 PASS: pencarian sumber tidak menemukan em dash dalam teks produk.
- R-03 PASS: empat halaman diuji pada tujuh lebar; susunan navigasi dan panel berubah pada ponsel serta tablet.
- R-17 PASS: skor dihitung dari jawaban; data awal diberi label simulasi. Angka 18 indikator dan 6 bidang sesuai data mesin aturan.
- R-18 PASS: tidak ada testimoni, foto profil, atau pengguna fiktif.
- R-23 PASS: peta 3D merupakan permintaan pengguna; visual memetakan domain yang ada. Tidak ada logo grafis atau aset orang yang diasumsikan.
- R-24 PASS: empat tombol navigasi membuka halaman yang tersedia.
- R-25 PASS: audit kontras otomatis delapan layar bersih dan warna sekunder diperiksa dengan checker.
- R-26 PASS: peta, kamera, semua navigasi, formulir, target, hasil, ekspor, cetak, latihan, riwayat, dan penghapusan data memiliki perilaku yang diuji.
- R-27 PASS: kondisi tanpa hasil, pemuatan komponen 3D, penghitungan, WebGL gagal, data rusak, serta penyimpanan ditolak/penuh tersedia. Skenario kegagalan diuji.
- R-28 PASS: tidak ada FAQ pengisi halaman.
- R-32 PASS: kontrol berupa elemen semantik, fokus terlihat, Space mengaktifkan pilihan, dan Escape menutup dialog/menu. Label HTML menyediakan alternatif interaksi canvas.
- R-33 PASS: fitur ditulis langsung melalui perubahan berkas sumber. Formatter hanya memformat sumber; tidak ada skrip penambal fitur/CSS.
- R-34 PASS: satu tema terang sesuai pilihan pengguna; tidak ada toggle tema yang tidak bekerja.
- R-35 PASS: build, logika, screenshot, interaksi, serta aksesibilitas dijalankan. Daftar aksi ada di bawah.
- R-36 PASS: tidak ada klaim keamanan, performa, kepatuhan, atau pelanggan tanpa bukti.
- R-37 PASS: arah pengguna dan dials dicatat di `../DESIGN.md` sebelum UI dibangun.
- R-38 PASS: konten simulasi dinyatakan jelas; riwayat hanya muncul dari asesmen yang benar-benar diselesaikan.

## Block 2: Purpose-Gate

- R-01 PASS: hijau mengikuti pilihan pengguna. Gradasi kecil pada legenda menjelaskan warna tingkat peta, bukan latar dekoratif.
- R-04 PASS: ikon peta, formulir, hasil, buku, dan unduh sesuai fungsi; semua kontrol mempunyai label teks atau nama aksesibel.
- R-06 PASS: Newsreader untuk karakter akademik; DM Sans untuk keterbacaan antarmuka. Kode monospace hanya untuk ID aturan dan rumus teknis.
- R-07 PASS: tidak ada grid atau tekstur latar pengisi ruang. Garis pada peta menghubungkan enam domain ke satu indeks gabungan.
- R-08 PASS: panah dipakai pada aksi perpindahan alur dan membaca detail, bukan pada semua kontrol.
- R-09 PASS: penanda Contoh/Milik saya dan Simulasi menunjukkan sumber data, tanpa glow, status dot, atau klaim promosi.
- R-10 PASS: blur hanya pada backdrop dialog untuk memisahkan fokus.
- R-12 PASS: bayangan 3D menyampaikan kedalaman; bayangan kecil label memisahkan teks dari peta. Panel konten utama rata.
- R-13 PASS: tidak ada glow antarmuka.
- R-14 PASS: tidak ada kartu fitur seragam. Panel 3D, detail domain, ringkasan, dan daftar latihan memiliki bobot sesuai tugasnya.
- R-19 PASS: animasi pembentukan peta dan pembuka kamera terbatas sekitar 1,5 detik. Putaran berulang hanya setelah tombol pengguna, dapat dijeda, dan berhenti saat menyeret/memilih bidang. Transisi menghormati reduced-motion. Sepuluh skenario animasi diverifikasi dalam `animation-results.json`.
- R-22 PASS: model 3D adalah visualisasi enam domain dan tinggi indeks hasil, bukan karakter dekoratif.

## Block 3: Liveliness

- Dials PASS: ENERGY 2 / RHYTHM 2 / MOTION 2 tercatat di DESIGN.md.
- Konsistensi PASS: judul editorial, peta interaktif dominan, serta bagian hasil yang lebih tenang terlihat pada screenshot.
- Titik fokus PASS: peta pada ringkasan, pertanyaan pada asesmen, status kesiapan pada hasil, dan rumus pada dasar penilaian.
- Ruang PASS: jarak besar memisahkan pemetaan dari langkah lanjut; daftar domain lebih rapat untuk perbandingan.
- Aksen PASS: limau menandai indeks dan tindakan di permukaan hijau gelap.
- Motif PASS: enam bidang bernomor menghubungkan peta, formulir, dan hasil.
- Design Read PASS: arah akademik modern dan ketiga dials diumumkan sebelum implementasi.

## Block 4: Craftsmanship & Quality Locks

- C-1 / R-31 PASS: alasan warna, tipografi, ruang, susunan panel, dan visual tercatat di DESIGN.md.
- C-2 PASS: tidak ada kontrol palsu atau fitur bertanda TODO; interaksi utama selesai diuji.
- C-3 / R-05 PASS: susunan halaman mengikuti pemetaan, asesmen, hasil, dan penjelasan aturan; tidak ada bagian promosi pengisi.
- C-4 PASS: kondisi kosong/gagal, fallback WebGL, form, keyboard, mobile, dan penyimpanan diuji sesuai cakupan bukti di atas.
- C-5 PASS: tidak ada klaim validitas pakar; semua hasil contoh ditandai dan skor pribadi berasal dari jawaban.
- R-11 PASS: radius kecil untuk kontrol, sedang untuk panel, bentuk bulat hanya untuk penanda langkah.
- R-15 PASS: CTA menyatakan tindakannya: Mulai asesmen, Lihat hasil asesmen, Unduh JSON, dan Hapus semua data lokal.
- R-16 PASS: tidak ada buzzword promosi AI.
- R-20 PASS: bentang enam domain, tipografi akademik, dan pemetaan ke latihan memberi identitas yang terkait tugas produk.
- R-21 PASS: tema terang dipilih eksplisit oleh pengguna.
- R-29 PASS: hijau, sage, kertas netral, dan satu aksen limau; merah hanya untuk kesalahan/destruksi.
- R-30 PASS: tidak ada instruksi atau implementasi peniruan produk tertentu.

## Catatan klik per elemen

| Elemen | Hasil yang diamati |
|---|---|
| Navigasi Peta, Asesmen, Hasil, Dasar penilaian | Halaman yang sesuai tampil, termasuk pada menu mobile |
| Enam label bidang 3D | Bidang aktif dan panel detail berubah |
| Seret canvas, +, −, Atur ulang | Kamera berputar, zoom berubah, tampilan dipulihkan |
| Contoh / Milik saya | Data simulasi, data pribadi, atau kondisi belum dinilai tampil |
| Mulai / Lanjutkan asesmen | Formulir terbuka; draf sebelumnya tetap tersedia |
| Lihat indikator | Formulir membuka bidang yang dipilih |
| Pilihan target | Ketiga profil dapat dipilih |
| Seluruh 18 radio jawaban | Nilai dipilih dan bertahan sesudah reload |
| Enam tombol bidang | Kelompok pertanyaan yang sesuai terbuka |
| Bidang berikutnya tanpa jawaban | Pesan validasi muncul |
| Bidang berikutnya / Sebelumnya | Langkah berubah sesuai arah |
| Lihat hasil dengan jawaban tidak lengkap | Kembali ke domain pertama yang belum lengkap |
| Lihat hasil dengan 18 nilai 3 | Indeks 75, K1, Siap berkembang, satu riwayat baru |
| Lihat 10 langkah penalaran | Rincian domain, bobot, prasyarat, dan aturan kesimpulan terbuka |
| Tiga centang latihan | Centang/lepaskan, tersimpan dan terbaca setelah reload |
| Unduh JSON pribadi / simulasi | Berkas terunduh; payload pribadi berisi indeks 75 dan identitas asesmen mandiri |
| Cetak hasil | Memanggil window.print; dialog cetak sistem tidak diotomasi |
| Entri riwayat | Hasil yang disimpan ditampilkan kembali |
| Baca dasar penilaian | Halaman rumus, bobot, dan prasyarat terbuka |
| Kelola data lokal dari sidebar/halaman aturan | Dialog data terbuka |
| Batal / Escape pada dialog | Dialog tertutup tanpa menghapus data |
| Hapus semua data lokal | Jawaban, riwayat, dan centang aplikasi dikosongkan |
| Buka/tutup menu, backdrop, Escape | Menu mobile dapat dibuka dan ditutup |
| Tombol domain fallback tanpa WebGL | Detail domain tetap berubah dan halaman tetap dapat dipakai |

Status akhir: keempat blok PASS untuk ruang lingkup prototipe lokal ini. Validasi pakar dan penggunaan sebagai penilaian resmi berada di luar ruang lingkup yang sudah dikerjakan.

## Pembaruan animasi 3D, 17 September 2026

Permintaan lanjutan pengguna: gunakan animasi 3D agar lebih menarik. Arah visual akademik hijau tetap dipakai.

- Hard Gate PASS: build berhasil; 16 skenario aplikasi tetap lulus; 10 skenario animasi lulus; audit aksesibilitas otomatis delapan layar tidak menemukan pelanggaran.
- Purpose-Gate PASS: animasi pembuka memperlihatkan pembentukan enam bidang; transisi menandai fokus; gerak kamera membantu melihat kedalaman. Tidak ada putaran terus-menerus tanpa tindakan pengguna.
- Liveliness PASS: ENERGY 2 / RHYTHM 2 / MOTION 2 tetap sesuai; animasi hanya pada peta dan kontrol kamera yang relevan.
- Craftsmanship PASS: ulang animasi, putar/jeda, pembatalan putaran saat seret, zoom/reset, reduced-motion langsung, penanganan tab tersembunyi, dan cleanup saat berpindah halaman diuji.

| Kontrol atau kondisi baru | Hasil pengujian |
|---|---|
| Ulang animasi | Koordinat label berubah selama bidang tumbuh dan kamera bergerak, lalu stabil |
| Putar otomatis / Jeda putaran | Peta berputar, aria-pressed berubah, lalu berhenti saat dijeda |
| Perbesar / Atur ulang | Kamera bertransisi bertahap dan kembali ke posisi awal |
| Pilih bidang | Bentuk/warna/cincin fokus berubah dan panel detail sesuai |
| Seret ketika putaran aktif | Putaran otomatis berhenti, kontrol manual mengambil alih |
| Tab tersembunyi | Penghitung requestAnimationFrame berhenti; melanjutkan saat terlihat |
| Reduced-motion diubah saat berjalan | Gerak tambahan berhenti; tombol gerak dinonaktifkan dengan penjelasan; pemilihan bidang tetap bekerja |
| Lebar 320/390/820/1440 px | Label dan kontrol tidak melewati batas setelah animasi selesai |
| Pindah ke asesmen | Canvas dilepas dan siklus requestAnimationFrame berhenti |

Bukti: `animation-results.json`, `browser-results.json`, `accessibility-results.json`, serta `screenshots/animated-map.png` dan `screenshots/animated-mobile.png`.
