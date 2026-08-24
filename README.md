# BPS Reminder Pro

Prompt untuk Lovable — Sistem Reminder Kenaikan Pangkat & KGB (BPS)

Buatkan saya aplikasi web full-stack (dengan database & backend) untuk Bagian Umum Kantor BPS yang berfungsi sebagai sistem reminder otomatis via WhatsApp untuk 2 hal saja: Kenaikan Pangkat dan Kenaikan Gaji Berkala (KGB). Berikut spesifikasi lengkapnya:

1. Tujuan Aplikasi

Aplikasi internal untuk admin Bagian Umum agar tidak lupa memproses dan menginformasikan kenaikan pangkat serta KGB pegawai, dengan cara mengirim reminder otomatis ke nomor WhatsApp yang sudah didaftarkan. Aplikasi ini tidak melakukan perhitungan apapun — semua tanggal target diinput manual oleh admin.

1a. Database & Backend

Gunakan Supabase sebagai database dan backend (sudah terhubung ke project Lovable ini, gunakan integrasi native Supabase yang tersedia di Lovable). Ketentuannya:

Semua data pegawai, pengaturan reminder, dan riwayat log pengiriman disimpan di Supabase Postgres, buatkan tabel-tabel yang sesuai (misal: employees, reminders, reminder_logs)

Gunakan Supabase Auth untuk login admin (email & password), aktifkan Row Level Security (RLS) supaya data hanya bisa diakses oleh admin yang sudah login

Untuk pengecekan harian tanggal reminder yang jatuh tempo dan proses kirim ke WhatsApp Gateway, gunakan Supabase Edge Function yang dijalankan terjadwal (via pg_cron / Supabase Scheduled Triggers) setiap hari

Simpan API key WhatsApp Gateway (Fonnte/Wablas/dll) di Supabase Secrets/Environment Variables, jangan hardcode atau simpan di sisi client

Struktur tabel harus mendukung reminder dengan skala/interval yang fleksibel per pegawai (misal tabel reminders punya kolom jenis (pangkat/kgb), tanggal_target, dan tabel relasi reminder_schedules berisi daftar hari-sebelum-tanggal-target untuk tiap reminder)

2. Data Master Pegawai (Identitas Kedinasan)

Form tambah/edit pegawai dengan field berikut:

Nama lengkap (dengan gelar) — text

NIP (Nomor Induk Pegawai) — text, unik

Jabatan/posisi — text

Unit kerja / bagian / subbagian — text

Golongan/pangkat saat ini (misal III/a, IV/b) — text/dropdown

Status kepegawaian — dropdown (PNS / PPPK / Honorer)

Nomor WhatsApp pegawai (sebagai data kontak/identitas saja, bukan tujuan pengiriman reminder — lihat ketentuan di bagian Reminder)

Sediakan halaman daftar/direktori pegawai dalam bentuk tabel dengan fitur search & filter (berdasarkan unit kerja, status kepegawaian), serta aksi edit/hapus per baris.

3. Fitur Reminder (Inti Aplikasi)

Penting — Tujuan Pengiriman Reminder: Semua reminder (baik Kenaikan Pangkat maupun Kenaikan Gaji Berkala) tidak dikirim ke nomor WhatsApp masing-masing pegawai, melainkan dikirim ke satu nomor WhatsApp tunggal milik admin/Bagian Umum yang mengelola aplikasi ini. Nomor WA tunggal ini diatur satu kali di halaman Pengaturan (bukan per pegawai). Nomor WhatsApp pegawai pada data master hanya berfungsi sebagai informasi kontak, tidak dipakai sistem untuk mengirim apapun.

Untuk setiap pegawai, admin bisa mengatur 2 jenis reminder terpisah:

a. Reminder Kenaikan Pangkat

Input tanggal target kenaikan pangkat (manual, date picker)

Skala reminder yang bisa diatur bebas oleh admin: jumlah reminder (misal 2x, 3x, atau lebih) dan berapa hari/bulan sebelum tanggal target masing-masing reminder dikirim (contoh: 90 hari sebelum, 30 hari sebelum, 7 hari sebelum — jumlah dan nilainya harus bisa ditambah/kurang bebas, bukan hardcode)

Pesan WA berisi: nama pegawai, NIP, jabatan, golongan saat ini, tanggal target kenaikan pangkat, dan sisa hari menuju tanggal target

b. Reminder Kenaikan Gaji Berkala (KGB)

Input tanggal target KGB (manual, date picker)

Skala reminder sama seperti di atas: bebas diatur jumlah & interval harinya per pegawai

Pesan WA berisi: nama pegawai, NIP, jabatan, tanggal target KGB, dan sisa hari menuju tanggal target

c. Mekanisme Pengiriman

Gunakan Supabase Edge Function yang dijalankan terjadwal setiap hari untuk mengecek apakah ada tanggal reminder yang jatuh tempo, lalu mengirim pesan otomatis ke satu nomor WhatsApp Bagian Umum yang sudah diatur di halaman Pengaturan, menggunakan WhatsApp Gateway API (gunakan integrasi seperti Fonnte, Wablas, atau WhatsApp Business API)

Sediakan halaman Pengaturan di aplikasi untuk admin memasukkan: (1) nomor WhatsApp tunggal tujuan reminder, dan (2) API key gateway WA yang mereka miliki — simpan API key sebagai Supabase Secret (bukan di tabel database biasa/client-side)

Setelah reminder terkirim, status dicatat di tabel reminder_logs (jangan kirim dobel di hari yang sama)

4. Fitur Pendukung (opsional, tidak boleh mengganggu 2 fitur utama)

Dashboard ringkas: jumlah pegawai, jumlah reminder aktif, reminder yang akan datang dalam 30 hari ke depan

Riwayat log pengiriman reminder (tanggal kirim, pegawai, jenis reminder, status berhasil/gagal)

Autentikasi login admin menggunakan Supabase Auth (agar data hanya bisa diakses/diedit oleh admin Bagian Umum yang sudah login)

Tombol "kirim reminder manual sekarang" per pegawai untuk testing

5. Batasan & Ketentuan Penting

Jangan tambahkan field data pribadi sensitif (alamat rumah, NIK KTP, nomor rekening, status pernikahan, data keluarga, riwayat kesehatan) — cukup data identitas kedinasan di atas

Tidak ada perhitungan tanggal otomatis (misal dari TMT + 4 tahun) — semua tanggal target kenaikan pangkat & KGB murni input manual admin

Skala/interval reminder harus fleksibel dan diatur per pegawai atau minimal bisa dikustomisasi, bukan nilai tetap yang di-hardcode

6. Gaya Tampilan & Pengalaman Pengguna

Desain dominan warna orange #E08939 sebagai warna utama (untuk header, tombol utama, aksen, dan elemen navigasi aktif), dipadukan dengan warna netral (putih/abu-abu terang) sebagai latar agar tetap nyaman dibaca dan tidak norak

Tampilan dan alur penggunaan harus sefriendly dan seintuitif mungkin, dengan ketentuan:

Layout bersih, banyak white space, ikon-ikon yang jelas maknanya (bukan hanya teks) di setiap tombol/menu

Form tambah/edit pegawai dibuat simpel, satu alur (step yang jelas), dengan validasi input yang informatif (misal format nomor WA salah langsung diberi tahu, bukan baru ketahuan setelah submit)

Sediakan empty state yang ramah (misal ilustrasi/teks santai) saat belum ada data pegawai atau reminder

Sediakan konfirmasi & notifikasi (toast/alert) yang jelas setiap kali aksi berhasil/gagal (tambah pegawai, atur reminder, kirim manual, dsb)

Navigasi utama mudah diakses (sidebar atau navbar sederhana) dengan menu: Dashboard, Data Pegawai, Reminder, Riwayat, Pengaturan

Gunakan font yang mudah dibaca, ukuran teks nyaman untuk staf kantor dari berbagai usia

Bahasa antarmuka: Bahasa Indonesia

Responsif untuk desktop dan tablet (dipakai staf Bagian Umum di kantor)

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/e9bd9865-74d8-4d15-9be0-ed7fdafbf4ea).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
