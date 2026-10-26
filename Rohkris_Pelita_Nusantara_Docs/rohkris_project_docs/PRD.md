# PRD — Website Rohani Kristen SMK PLUS PELITA NUSANTARA

> **Nama produk:** Rohkris Pelita Nusantara  
> **Jenis produk:** Website publik + CMS/panel admin  
> **Status dokumen:** Draft awal untuk MVP  
> **Bahasa utama:** Indonesia  
> **Target pengguna:** Siswa, alumni, pembina, guru, orang tua, serta pengunjung yang ingin mengenal kegiatan Rohani Kristen (Rohkris).

## 1. Ringkasan Produk

Website Rohani Kristen SMK PLUS PELITA NUSANTARA adalah pusat informasi digital untuk menyimpan, mengelola, dan menampilkan kegiatan Rohkris dalam satu tempat. Website publik berfungsi sebagai landing page yang memperkenalkan komunitas Rohkris, menampilkan kegiatan mendatang seperti Natal, Paskah, ibadah rutin, retreat, persekutuan, pelayanan, dan aksi sosial, serta menjadi arsip dokumentasi kegiatan yang sudah berlangsung.

Setiap kegiatan memiliki halaman detail yang bisa dibuka dari kartu kegiatan. Tombol **Daftar** pada halaman tersebut mengarahkan pengunjung ke tautan pendaftaran eksternal yang dikelola panitia—utamanya Google Forms atau tautan Google Drive yang relevan. Admin memperbarui konten melalui panel admin tanpa perlu mengubah source code.

**Acuan pengalaman:** pola umum situs Festival Pelajar Unggulan: event/program ditampilkan sebagai kartu, detail kegiatan tersedia terpisah, informasi jadwal mudah dipindai, dan materi/berita terdokumentasi. Website Rohkris harus memiliki identitas visual dan konten orisinal sendiri, bukan menyalin desain atau aset referensi.

## 2. Masalah yang Ingin Diselesaikan

- Informasi kegiatan Rohkris tersebar di chat, media sosial, dan dokumen berbeda.
- Informasi kegiatan lama sulit dicari kembali setelah event selesai.
- Perubahan tanggal, poster, deskripsi, atau tautan pendaftaran sering membutuhkan bantuan orang yang memahami source code.
- Pengunjung membutuhkan satu sumber informasi yang jelas tentang kegiatan Rohkris dan cara mendaftar.
- Konten perlu dikelola oleh admin yang sudah diberi izin, bukan siapa pun yang mengetahui URL panel.

## 3. Tujuan dan Indikator Keberhasilan

### Tujuan

1. Menjadi pusat informasi resmi kegiatan Rohkris SMK PLUS PELITA NUSANTARA.
2. Memudahkan siswa dan pengunjung menemukan kegiatan, memahami detailnya, dan membuka tautan pendaftaran.
3. Memudahkan tim Rohkris memperbarui kegiatan, dokumentasi, pengumuman, dan tautan tanpa perubahan kode.
4. Menyimpan jejak dokumentasi kegiatan sebagai arsip yang dapat diakses kembali.
5. Membatasi perubahan konten hanya untuk admin yang terautentikasi dan berwenang.

### KPI awal yang dapat diukur

- Semua kegiatan yang dipublikasikan dapat dibuka di halaman detail.
- Setiap event yang membuka pendaftaran memiliki CTA yang menuju tautan eksternal yang benar.
- Admin dapat membuat, mengubah, menerbitkan, mengarsipkan, dan menghapus event dari panel admin.
- Tidak ada operasi tulis konten yang dapat dijalankan oleh pengunjung anonim.
- Halaman inti dapat digunakan pada ponsel dan desktop, termasuk koneksi yang lambat.
- Waktu pembaruan event tidak bergantung pada developer setelah panel admin aktif.

## 4. Target Pengguna dan Kebutuhan

### 4.1 Pengunjung / siswa

- Ingin mengetahui kegiatan Rohkris terdekat.
- Ingin melihat tanggal, waktu, tempat, biaya (bila ada), dress code, dan informasi penting.
- Ingin menekan tombol daftar dan langsung menuju formulir eksternal.
- Ingin melihat dokumentasi kegiatan sebelumnya.

### 4.2 Pengurus Rohkris / admin konten

- Ingin membuat event baru dan mengunggah poster.
- Ingin memperbarui informasi tanpa mengedit kode.
- Ingin menentukan status pendaftaran, tautan pendaftaran, status publikasi, dan kegiatan unggulan.
- Ingin menyimpan dokumentasi serta berita recap.

### 4.3 Pembina / super admin

- Ingin mengatur siapa yang dapat mengakses panel admin.
- Ingin meninjau, mengoreksi, dan menerbitkan konten.
- Ingin dapat mencabut akses admin yang sudah tidak bertugas.

## 5. Prinsip Produk

- **Informasi kegiatan sebagai fokus utama:** pengunjung cepat menemukan kegiatan dan CTA daftar.
- **Mudah diperbarui:** konten disimpan di database, bukan ditulis permanen dalam komponen halaman.
- **Akses admin aman:** login dan otorisasi server/database wajib; URL tersembunyi atau UUID tidak boleh menjadi satu-satunya pengaman.
- **Arsip tetap tersedia:** event terdahulu tidak otomatis hilang; tampil di bagian arsip berdasarkan status/tanggal.
- **Desain rohani yang hangat:** mengutamakan komunitas, pelayanan, pengharapan, dan pertumbuhan iman; tidak menggunakan aset berhak cipta tanpa izin.
- **Mobile-first:** navigasi, kartu, galeri, dan CTA nyaman digunakan di layar ponsel.

## 6. Ruang Lingkup

### 6.1 MVP — Wajib ada

1. Landing page publik.
2. Daftar kegiatan mendatang dan kegiatan sebelumnya.
3. Kategori kegiatan.
4. Halaman detail kegiatan dengan CTA pendaftaran eksternal.
5. Jadwal kegiatan / timeline sederhana.
6. Galeri dokumentasi kegiatan.
7. Berita atau recap kegiatan.
8. Halaman Tentang Rohkris dan Informasi Kontak.
9. Panel admin dengan autentikasi dan allowlist admin.
10. CRUD (create, read, update, delete) untuk kegiatan, galeri, berita, dan pengumuman.
11. Pengelolaan URL Google Forms/Drive untuk setiap event.
12. Status draft/published/archived serta status pendaftaran.
13. Responsif, aksesibilitas dasar, SEO dasar, empty state, loading state, dan error state.

### 6.2 Direkomendasikan setelah MVP

- Kalender bulanan interaktif.
- Pencarian dan filter kegiatan yang lebih lengkap.
- Halaman unduhan materi seperti rundown, booklet, atau surat izin.
- Testimoni dan statistik kegiatan.
- Riwayat perubahan konten / audit log lebih rinci.
- Multi-role admin seperti Editor, Admin, dan Super Admin.
- Notifikasi saat event akan berlangsung.

### 6.3 Di luar cakupan MVP

- Sistem pembayaran.
- ~~Registrasi peserta yang disimpan di database website.~~ (Kini tersedia sebagai opsi: lihat catatan di bawah.)
- Integrasi otomatis membaca isi Google Drive atau Google Forms.
- Sistem akun untuk pengunjung umum.
- Live streaming bawaan website.

> Catatan: pendaftaran dilakukan oleh form/layanan eksternal. Website hanya menyimpan tautan pendaftaran dan mengarahkan pengunjung ke sana.
>
> **Pembaruan (Oktober 2026): Formulir Internal.** Per kegiatan, admin dapat memilih *formulir luar* (perilaku di atas) atau *formulir internal* yang dibuat di panel admin (jawaban singkat, paragraf, pilihan ganda, kotak centang, dropdown, skala linear, kisi, tanggal, waktu, unggah berkas, lompat bagian). Pada mode internal, respons disimpan di database website, hanya dapat dilihat admin, dan dapat diekspor ke CSV; dilengkapi kuota, batas waktu (memakai jadwal pendaftaran kegiatan), satu respons per email, tautan ubah jawaban, email konfirmasi opsional, serta kotak persetujuan penggunaan data. Ketentuan privasi pada §9 untuk formulir eksternal tetap berlaku untuk mode eksternal; kebijakan privasi situs diperbarui untuk mode internal.

## 7. Struktur Halaman / Information Architecture

### Website publik

- `/` — Beranda
- `/kegiatan` — Semua kegiatan, filter kategori/status
- `/kegiatan/[slug]` — Detail kegiatan
- `/jadwal` — Jadwal kegiatan
- `/dokumentasi` — Galeri dokumentasi
- `/berita` — Berita dan recap kegiatan
- `/berita/[slug]` — Detail berita
- `/tentang` — Tentang Rohkris, visi, misi, nilai, dan pembina (isi bisa dikonfigurasi)
- `/kontak` — Kontak dan kanal media sosial
- `/privasi` — Kebijakan privasi sederhana jika dibutuhkan

### Panel admin

- `/admin/login` — Login admin
- `/admin` — Dashboard ringkas
- `/admin/kegiatan` — Kelola event
- `/admin/kegiatan/baru` — Buat event
- `/admin/kegiatan/[id]` — Edit event
- `/admin/galeri` — Kelola dokumentasi
- `/admin/berita` — Kelola berita/recap
- `/admin/pengumuman` — Kelola pengumuman
- `/admin/pengaturan` — Kontak, tautan sosial, identitas situs
- `/admin/akses` — Kelola daftar admin, khusus super admin

Rute dapat disesuaikan dengan framework selama pemisahan publik dan admin tetap jelas.

## 8. Kebutuhan Fungsional

### FR-01 — Landing page

- Menampilkan nama lengkap **Rohani Kristen SMK PLUS PELITA NUSANTARA**.
- Hero section dengan pesan sambutan, deskripsi singkat, dan CTA ke kegiatan.
- Menampilkan satu atau beberapa event unggulan yang ditentukan admin.
- Menampilkan daftar kegiatan mendatang.
- Menampilkan ringkasan komunitas/tentang Rohkris.
- Menampilkan cuplikan galeri dan berita terbaru.
- Menampilkan tautan ke media sosial dan kontak jika tersedia.
- Jika belum ada event, tampilkan empty state yang tetap rapi, bukan error.

### FR-02 — Daftar kegiatan

Setiap kartu kegiatan setidaknya menampilkan poster/thumbnail (jika ada), nama kegiatan, kategori, tanggal, status kegiatan/pendaftaran, dan tombol **Lihat Detail**. Pengunjung bisa menyaring berdasarkan kategori dan status. Kegiatan draft tidak boleh terlihat publik.

### FR-03 — Detail kegiatan

Halaman detail event menampilkan:

- Nama kegiatan, poster, kategori, tanggal dan jam.
- Tempat atau informasi format kegiatan (offline/online) bila relevan.
- Deskripsi lengkap dan tujuan kegiatan.
- Informasi penting seperti dress code, ketentuan peserta, biaya, kontak panitia, dan jadwal (semua opsional/configurable).
- Tanggal buka/tutup pendaftaran jika digunakan.
- Status: segera hadir, pendaftaran dibuka, pendaftaran ditutup, selesai, atau dibatalkan.
- CTA **Daftar Sekarang** jika pendaftaran dibuka dan registration URL tersedia.
- CTA diganti pesan seperti **Pendaftaran Ditutup** bila pendaftaran tutup.
- Link dokumen pendukung (poster, rundown, booklet, surat izin) jika tersedia.
- Rekomendasi kegiatan terkait atau navigasi kembali ke daftar kegiatan.

Jika tombol **Daftar Sekarang** diklik, website membuka `registration_url` yang disimpan oleh admin, umumnya Google Forms atau Google Drive, di tab baru. Website tidak boleh menganggap pendaftaran sukses karena pengisian berlangsung di layanan eksternal.

### FR-04 — Jadwal

- Menampilkan kegiatan yang akan datang berurutan dari tanggal terdekat.
- Setiap item jadwal dapat diklik menuju detail event.
- Event tanpa tanggal/jam lengkap tetap dapat tampil dengan label yang jelas.
- Event dibatalkan/selesai tidak dicampur sebagai event mendatang.

### FR-05 — Dokumentasi / galeri

- Menampilkan foto/video dokumentasi yang diterbitkan admin.
- Setiap item dapat diberi judul, tanggal, nama event, caption, dan alt text.
- Jika foto terkait event, tampilkan tautan menuju detail event.
- Hanya media yang berstatus published yang terlihat publik.
- Perhatikan izin penggunaan foto siswa dan kebijakan sekolah.

### FR-06 — Berita dan recap

- Admin dapat menulis recap setelah kegiatan, termasuk ringkasan, tanggal, cover image, dan foto pilihan.
- Halaman berita menampilkan berita terbaru.
- Setiap berita memiliki slug, tanggal terbit, ringkasan, isi, dan status publikasi.

### FR-07 — Pengumuman

- Admin dapat membuat pengumuman dengan judul, isi singkat, periode tayang, prioritas, dan status publikasi.
- Pengumuman aktif dapat tampil di beranda atau halaman kegiatan.
- Pengumuman kedaluwarsa otomatis tidak ditampilkan sebagai pengumuman aktif.

### FR-08 — Panel admin

- Admin harus login sebelum membuka konten admin.
- Dashboard menampilkan ringkasan jumlah event, event mendatang, draft, dan berita/galeri terbaru.
- Admin dapat membuat, melihat, memperbarui, menerbitkan, menarik publikasi, mengarsipkan, dan menghapus konten sesuai perannya.
- Form memiliki validasi dan pesan error yang mudah dipahami.
- Admin bisa menyimpan sebagai draft sebelum menerbitkan.
- Konfirmasi diperlukan sebelum penghapusan permanen.
- Admin dapat preview konten sebelum publish bila memungkinkan.
- Perubahan tersimpan di database dan tercermin pada website publik tanpa deploy ulang.

### FR-09 — Manajemen tautan

- Setiap event dapat memiliki `registration_url` terpisah dari `resource_url` atau link dokumen pendukung.
- UI admin memberi label jelas untuk masing-masing tautan, agar tautan daftar tidak tertukar dengan tautan poster/rundown.
- URL harus divalidasi menggunakan protokol HTTPS kecuali ada alasan teknis yang terdokumentasi.
- Bila link kosong, jangan tampilkan CTA daftar yang rusak.
- Tautan eksternal dibuka dengan proteksi atribut browser yang sesuai (`target="_blank"` dan `rel="noopener noreferrer"` untuk tab baru).

### FR-10 — Pengaturan situs

Admin berwenang dapat memperbarui tagline, deskripsi singkat, logo, alamat/keterangan sekolah bila disetujui, email kontak, media sosial, dan footer tanpa mengedit source code.

## 9. Desain dan UX

### Arah visual

- Nuansa modern, ramah pelajar, hangat, dan penuh pengharapan.
- Rekomendasi palet awal: navy atau biru tua sebagai warna utama, ivory/putih hangat sebagai latar, aksen emas lembut atau hijau sage secukupnya.
- Gunakan tipografi sans-serif yang mudah dibaca.
- Gunakan ruang kosong yang cukup, kontras teks yang baik, kartu kegiatan yang konsisten, dan CTA yang jelas.
- Elemen salib, Alkitab, atau visual ibadah bisa digunakan secara proporsional jika sesuai identitas sekolah. Hindari visual yang terlalu ramai.
- Jangan menyalin layout pixel-perfect, logo, foto, teks, atau aset Festival Pelajar. Referensi hanya untuk pola informasi dan alur pengguna.

### Komponen antarmuka penting

- Navbar responsif.
- Hero dan CTA.
- Event card.
- Badge status pendaftaran.
- Filter kategori dan status.
- Breadcrumb pada detail event/berita.
- Galeri grid/lightbox yang aksesibel.
- Form admin dengan label, validasi, helper text, dan upload preview.
- Toast/notifikasi keberhasilan dan kegagalan.
- Empty/loading/error states.
- Footer berisi informasi Rohkris dan tautan sosial.

### Aksesibilitas dasar

- Semua gambar konten memiliki alt text.
- Kontras teks memenuhi WCAG AA sebisa mungkin.
- Navigasi dapat dilakukan melalui keyboard.
- Input mempunyai label yang jelas; jangan hanya mengandalkan placeholder.
- Status dan error tidak disampaikan melalui warna saja.
- Tombol dan link mempunyai nama yang deskriptif.
- Hormati `prefers-reduced-motion` jika animasi digunakan.

## 10. Model Data yang Disarankan

Semua entitas utama memakai UUID sebagai primary key (`id UUID`). Slug digunakan untuk URL publik yang mudah dibaca. Timestamp disimpan konsisten dalam UTC di database dan ditampilkan menggunakan zona waktu `Asia/Jakarta`.

### `admin_users`

- `id`: UUID primary key
- `auth_user_id`: UUID unik yang merujuk ke pengguna pada sistem autentikasi
- `role`: enum `super_admin` / `admin` / `editor` (MVP dapat dimulai dengan `super_admin` dan `admin`)
- `display_name`: nama tampilan
- `is_active`: boolean
- `created_at`, `updated_at`: timestamp

### `events`

- `id`: UUID primary key
- `title`: string wajib
- `slug`: string unik wajib
- `category`: enum/string terkontrol seperti `Natal`, `Paskah`, `Ibadah Rutin`, `Persekutuan`, `Retreat`, `Pelayanan`, `Aksi Sosial`, `Lainnya`
- `summary`: ringkasan pendek
- `description`: isi/detail event
- `cover_image_url`: URL gambar poster/cover, nullable
- `start_at`, `end_at`: timestamp, nullable bila memang belum ditentukan
- `location`: string, nullable
- `event_mode`: enum `offline` / `online` / `hybrid` / `tbd`
- `registration_url`: URL daftar eksternal, nullable
- `registration_open_at`, `registration_close_at`: timestamp nullable
- `registration_status`: enum `not_open` / `open` / `closed` / `external_only`
- `cost_info`, `dress_code`, `participant_rules`, `contact_info`: nullable text
- `resource_url`: URL dokumen pendukung, nullable
- `is_featured`: boolean
- `status`: enum `draft` / `published` / `archived` / `cancelled`
- `created_by`, `updated_by`: UUID pengguna admin, nullable untuk data migrasi
- `created_at`, `updated_at`, `published_at`: timestamp

### `media_items`

- `id`: UUID primary key
- `event_id`: UUID referensi ke event, nullable
- `title`, `caption`, `alt_text`: string/text
- `media_url`: URL aset
- `media_type`: enum `image` / `video` / `document`
- `taken_at`: timestamp/date nullable
- `status`: enum `draft` / `published` / `archived`
- `sort_order`: integer
- `created_by`, `created_at`, `updated_at`

### `news_posts`

- `id`: UUID primary key
- `title`: string wajib
- `slug`: string unik
- `excerpt`: ringkasan
- `body`: isi artikel
- `cover_image_url`: URL nullable
- `event_id`: UUID event terkait, nullable
- `status`: enum `draft` / `published` / `archived`
- `published_at`, `created_by`, `updated_by`, `created_at`, `updated_at`

### `announcements`

- `id`: UUID primary key
- `title`, `body`: string/text
- `starts_at`, `ends_at`: timestamp nullable
- `priority`: integer
- `status`: enum `draft` / `published` / `archived`
- `created_by`, `created_at`, `updated_at`

### `site_settings`

- `id`: UUID primary key
- `key`: string unik
- `value`: JSON/text sesuai kebutuhan
- `updated_by`, `updated_at`

### Relasi utama

- Satu event dapat memiliki banyak item galeri.
- Satu event dapat memiliki banyak berita/recap, atau satu berita dapat mengarah ke satu event; MVP mendukung `news_posts.event_id` yang nullable.
- Konten memiliki referensi pembuat/pengubah untuk jejak perubahan dasar.

## 11. Keamanan, UUID, dan Hak Akses

**Persyaratan kritis:** UUID bukan password dan bukan pengganti autentikasi. UUID berguna untuk identitas unik record/pengguna serta relasi database, tetapi mengetahui atau menebak UUID tidak boleh memberi akses admin.

### Desain yang disarankan

1. Gunakan penyedia autentikasi yang teruji, misalnya Supabase Auth dengan email/password atau magic link untuk admin.
2. Ketika login berhasil, server memverifikasi sesi/token dan mencocokkan `auth.uid()` (UUID user autentikasi) dengan entri aktif pada tabel `admin_users`.
3. Semua halaman, Server Actions/API, upload media, dan operasi database panel admin memeriksa autentikasi **serta** role di server/database. Menyembunyikan tombol di frontend bukan kontrol keamanan.
4. Sesi harus mempunyai masa berlaku, logout yang benar, perlindungan CSRF sesuai arsitektur, pembatasan percobaan login/rate limit, dan pesan gagal login yang tidak membocorkan detail akun.
5. Aktifkan Row Level Security (RLS) pada tabel yang terekspos melalui API. Tulis policy per operasi dan berikan hak minimum.
6. Pengunjung anonim hanya dapat membaca konten `published` yang memang untuk publik. Pengunjung anonim tidak dapat menulis, memperbarui, atau menghapus data apa pun.
7. `service_role` key atau rahasia backend tidak boleh dikirim ke browser, dimasukkan ke repo, atau ditampilkan di log.
8. UUID admin tidak digunakan sebagai satu-satunya gate pada route seperti `/admin/[uuid]`. Gunakan rute admin normal, lalu autentikasi dan otorisasi di server.
9. Hanya `super_admin` dapat menambahkan/menonaktifkan akun admin. Jika belum ada fitur manajemen akses di MVP, setup admin pertama dilakukan melalui prosedur provisioning server-side yang didokumentasikan.
10. Gunakan HTTPS untuk deployment. Validasi file upload (jenis MIME, ukuran maksimal, dan nama file), dan batasi folder/bucket storage sesuai izin.
11. Catat perubahan penting, seperti publish/unpublish dan perubahan role, setidaknya melalui metadata `updated_by` dan timestamp; audit log lengkap dapat menjadi tahap berikutnya.
12. Terapkan backup dan prosedur pemulihan data yang sesuai kemampuan hosting.

### Contoh matriks hak akses

| Aksi | Publik | Admin | Super Admin |
|---|---:|---:|---:|
| Melihat event published | Ya | Ya | Ya |
| Melihat draft | Tidak | Ya | Ya |
| Membuat/mengubah konten | Tidak | Ya | Ya |
| Mengelola daftar admin | Tidak | Tidak | Ya |
| Mengubah role admin | Tidak | Tidak | Ya |
| Menghapus konten | Tidak | Sesuai kebijakan | Ya |

## 12. Persyaratan Nonfungsional

### Performa

- Gunakan optimasi gambar/responsive image dan lazy loading pada galeri.
- Hindari memuat semua media ukuran penuh di beranda.
- Prioritaskan konten utama agar halaman tetap berguna pada jaringan seluler.

### SEO dan shareability

- Setiap event/berita memiliki title, meta description, slug, dan metadata Open Graph.
- Sediakan sitemap dan robots metadata sesuai kebutuhan.
- Halaman draft/preview tidak boleh diindeks.
- URL publik event tetap stabil setelah diterbitkan; jika slug berubah, pertimbangkan redirect.

### Keandalan

- Tampilkan pesan jika database/storage tidak tersedia.
- Form admin tidak kehilangan isian tanpa peringatan ketika terjadi error.
- Data utama tidak dihapus otomatis saat tanggal event terlewati.

### Privasi

- Jangan menyimpan data peserta pada website jika pendaftaran menggunakan Google Forms/Drive eksternal.
- Jangan menampilkan informasi pribadi siswa tanpa izin yang relevan.
- Media siswa mengikuti kebijakan sekolah dan persetujuan yang diperlukan.

## 13. Stack Teknologi yang Direkomendasikan

Ini rekomendasi awal, bukan kewajiban jika organisasi sudah punya standar teknologi:

- **Frontend/full-stack:** Next.js App Router + TypeScript
- **UI:** Tailwind CSS + komponen aksesibel seperti shadcn/ui bila sesuai
- **Database:** PostgreSQL melalui Supabase
- **Auth:** Supabase Auth
- **Media:** Supabase Storage atau storage kompatibel S3
- **Hosting:** Vercel atau platform sejenis yang mendukung framework pilihan
- **Validasi:** Zod atau validator sejenis untuk input server/client
- **Form:** React Hook Form atau pendekatan form bawaan yang setara

Jangan membuat dependensi layanan berbayar sebagai asumsi tersembunyi. Dokumentasikan layanan dan biaya operasional yang dibutuhkan sebelum deployment.

## 14. Kriteria Penerimaan MVP

1. Pengunjung membuka beranda dan melihat informasi Rohkris serta event unggulan jika tersedia.
2. Pengunjung dapat menemukan event dan membuka halaman detail melalui kartu event.
3. Ketika pendaftaran terbuka dan `registration_url` valid, tombol daftar mengarah ke tautan yang diset pada tab baru.
4. Jika pendaftaran tutup atau tautan tidak tersedia, UI tidak menampilkan tombol daftar yang rusak.
5. Admin login yang tidak terdaftar/aktif ditolak meskipun mencoba membuka URL admin secara langsung.
6. Pengunjung yang belum login tidak dapat mengakses halaman admin atau API mutasi.
7. Admin dapat membuat event berstatus draft, melihat preview, menerbitkan, mengedit, mengarsipkan, dan menghapus event.
8. Setelah event diterbitkan atau diperbarui, perubahan tampil di website publik tanpa rebuild manual.
9. Draft, archived, atau cancelled mengikuti aturan visibilitas yang ditentukan dan tidak muncul seolah-olah sebagai event mendatang aktif.
10. Admin dapat membuat berita dan media dokumentasi terkait event.
11. Data database terlindungi oleh policy akses; pengujian mencakup operasi baca/tulis untuk publik dan admin.
12. Halaman utama, daftar event, detail event, galeri, berita, login, dan dashboard berfungsi pada layar ponsel dan desktop.
13. Semua gambar yang membawa informasi memiliki alt text atau caption sesuai konteks.
14. Error, loading, dan empty state tersedia pada halaman data utama.
15. Tidak ada kunci rahasia backend di source code publik atau bundle browser.

## 15. Skenario Uji Utama

- Publik melihat event published tetapi tidak dapat melihat draft melalui UI maupun query yang terekspos.
- Publik membuka detail event tanpa `registration_url`; halaman tetap stabil dan CTA daftar tidak muncul.
- Admin yang sah membuat event dengan URL Google Forms; URL tersimpan dan tombol daftar bekerja.
- Admin tidak sah mencoba mengakses `/admin` dan operasi mutasi; semua ditolak.
- Pengguna yang dinonaktifkan dari `admin_users` tidak lagi bisa melakukan operasi admin meskipun sebelumnya pernah masuk.
- Event yang telah lewat masuk ke bagian arsip/riwayat, bukan hilang.
- URL berisi karakter khusus, form kosong, slug duplikat, dan file terlalu besar ditangani melalui validasi yang layak.
- Uji responsive pada lebar ponsel, tablet, dan desktop.

## 16. Asumsi dan Hal yang Perlu Dikonfirmasi Saat Implementasi

Untuk memulai pengembangan, gunakan default berikut dan buat agar mudah diubah:

- Nama resmi ditampilkan sebagai **Rohani Kristen SMK PLUS PELITA NUSANTARA**; singkatan **Rohkris Pelita Nusantara** untuk label pendek.
- Bahasa antarmuka adalah Bahasa Indonesia.
- Zona waktu tampilan: `Asia/Jakarta`.
- Satu organisasi/sekolah dan satu panel admin.
- Pendaftaran event diarahkan ke URL eksternal yang dimasukkan admin, umumnya Google Forms/Drive.
- Logo resmi, foto kegiatan, email/akun sosial, deskripsi visi-misi, dan identitas visual final disediakan oleh pihak sekolah/pengurus. Jika belum ada, gunakan placeholder yang jelas dan dapat diganti.
- URL hosting, domain, dan kredensial layanan dikonfigurasi ketika deployment; jangan memasukkannya sebagai teks tetap dalam repository.

## 17. Referensi

Pola dan alur informasi diamati dari halaman publik berikut pada 18 Oktober 2026; referensi hanya digunakan untuk inspirasi struktur konten, bukan penyalinan aset atau desain:

- [Festival Pelajar Unggulan — Beranda](https://festivalpelajar.id/)
- [Program](https://www.festivalpelajar.id/program.php)
- [Jadwal](https://festivalpelajar.id/schedule.php)
- [Resources / materi](https://www.festivalpelajar.id/resources.php)
- [Contoh detail pendaftaran](https://www.festivalpelajar.id/registration.php?program=13)

Panduan keamanan:

- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [OWASP Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)
