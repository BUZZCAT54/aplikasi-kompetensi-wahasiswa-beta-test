# Titik Siap

## Arah yang dipilih pengguna
Akademik modern: terang, hijau tua, visual 3D peta kompetensi. Ditujukan untuk mahasiswa Informatika / Sistem Informasi. Antislop digunakan sejak pembuatan.

## Interpretasi implementasi
ENERGY 2 / RHYTHM 2 / MOTION 2. Aplikasi kerja dengan peta sebagai titik fokus, bukan halaman promosi. Nama kerja produk: Titik Siap.

- Warna: hijau hutan #214b3e untuk struktur utama; putih kertas #f7f8f4 untuk keterbacaan; sage untuk bentang peta; kuning limau #e1ecad hanya untuk tindakan utama pada panel gelap.
- Tipografi: Newsreader pada judul memberi kesan jurnal akademik; DM Sans pada kontrol menjaga keterbacaan angka dan pertanyaan.
- Komposisi: peta lebar dan panel konteks di sampingnya membantu mahasiswa menghubungkan kemampuan dengan langkah berikutnya. Tidak ada statistik pengguna atau umpan aktivitas fiktif.
- Ruang: jarak besar memisahkan pemetaan dari tindakan; baris rapat dipakai hanya untuk membandingkan domain.
- 3D: enam pulau bertingkat mewakili enam domain. Tinggi mengikuti indeks hasil. Data simulasi selalu ditandai. Label HTML dan tabel menyediakan alternatif keyboard dan WebGL.
- Motion: sesuai permintaan lanjutan pengguna, enam bidang dibentuk bertahap dengan gerak pembuka kamera selama sekitar 1,5 detik. Pemilihan bidang menampilkan penekanan skala/warna dan cincin fokus satu kali. Zoom/reset kamera memakai interpolasi dan seret memakai inersia. Putaran otomatis hanya berjalan setelah tombol pengguna, bisa dijeda, dan berhenti saat pengguna mulai menyeret atau memilih bidang. Render dihentikan saat diam, tab tersembunyi, atau peta di luar layar; reduced-motion menonaktifkan animasi tambahan.
- Tema terang sesuai pilihan eksplisit pengguna. Tidak ada sakelar tema yang tidak diperlukan.
- Tidak ada logo grafis, foto profil, testimoni, atau statistik rekaan.

## Ruang lingkup
Prototipe lokal berfungsi: asesmen 18 indikator, 3 target karier, inferensi aturan transparan, peta 3D, prioritas belajar, riwayat lokal, ekspor JSON dan cetak. Basis aturan merupakan rancangan demonstrasi, belum divalidasi dosen/pakar. Tidak ada login atau sinkronisasi server.
