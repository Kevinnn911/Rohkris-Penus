# Prompt Implementasi — Website Rohkris SMK PLUS PELITA NUSANTARA

Salin seluruh prompt di bawah ini ke AI coding assistant atau platform pembuat website yang kamu gunakan. Jika platform dapat membaca file, berikan juga `PRD.md` sebagai dokumen kebutuhan utama.

---

## PROMPT

Bertindaklah sebagai **senior full-stack engineer, UI/UX designer, dan application security engineer**. Bangun website production-ready bernama **Rohani Kristen SMK PLUS PELITA NUSANTARA** dengan nama pendek **Rohkris Pelita Nusantara**. Website berisi landing page publik untuk seluruh kegiatan Rohkris dan panel admin/CMS agar panitia dapat memperbarui kegiatan tanpa mengubah source code.

### 1. Tujuan dan perilaku utama

Website harus menjadi pusat informasi resmi kegiatan Rohkris. Inspirasi pola informasi boleh diambil dari https://festivalpelajar.id/ : event unggulan di beranda, kartu program/kegiatan, halaman detail, jadwal, berita, galeri, dan dokumen pendukung. **Jangan menyalin desain, logo, copywriting, foto, atau aset dari situs referensi.** Ciptakan identitas visual sendiri yang relevan dengan komunitas Rohani Kristen dan lingkungan pelajar.

Contoh kegiatan yang akan dikelola: Natal, Paskah, ibadah rutin, persekutuan, retreat, pelayanan, aksi sosial, dan kegiatan lainnya. Pengunjung harus bisa:

1. Membuka landing page dan memahami identitas Rohkris.
2. Menemukan kegiatan mendatang atau kegiatan terdahulu.
3. Mengeklik kartu kegiatan untuk membuka halaman detail.
4. Membaca tanggal, waktu, lokasi/format, deskripsi, ketentuan, dan status pendaftaran.
5. Mengeklik tombol **Daftar Sekarang** untuk membuka `registration_url` yang diatur admin—biasanya Google Forms atau tautan Google Drive—di tab baru.
6. Melihat galeri serta berita/recap kegiatan yang sudah terlaksana.

Jangan menganggap pendaftaran sukses atau menyimpan data pendaftar ke database website karena proses pendaftaran berlangsung di layanan eksternal.

### 2. Teknologi

Gunakan pilihan berikut kecuali lingkungan kerja memiliki batasan yang jelas:

- Next.js App Router dan TypeScript.
- Tailwind CSS dan komponen UI yang aksesibel.
- Supabase PostgreSQL untuk database.
- Supabase Auth untuk login admin.
- Supabase Storage atau layanan storage kompatibel untuk poster dan dokumentasi.
- Validasi input di server menggunakan Zod atau library sejenis.

Gunakan versi stabil yang kompatibel saat proyek dibuat, bukan versi eksperimen tanpa alasan. Pisahkan komponen UI, akses database, validasi, dan logika otorisasi. Jangan membuat seluruh website sebagai mockup statis; CRUD dan data dinamis harus benar-benar berfungsi.

### 3. Arah desain

Buat desain modern, rapi, hangat, berjiwa komunitas, rohani, dan cocok untuk siswa SMK. Pakai layout responsif dengan whitespace cukup, tipografi bersih, hierarchy yang kuat, kartu kegiatan yang konsisten, dan CTA yang jelas. Rekomendasi warna awal: navy/biru tua, putih hangat/ivory, serta aksen emas lembut atau hijau sage. Gunakan aset placeholder berlabel jelas jika logo/foto resmi belum tersedia; sediakan cara untuk menggantinya dari panel admin. Hindari desain yang terlalu ramai, animasi berlebihan, atau visual generik yang mengganggu informasi.

Prioritaskan pengalaman mobile. Pastikan kontras teks baik, ukuran tap target memadai, tombol/link dapat dipakai dengan keyboard, semua input memiliki label, gambar informatif punya alt text, dan error state mudah dipahami. Hormati `prefers-reduced-motion` jika memakai animasi.

### 4. Halaman publik yang harus dibuat

- `/` — Beranda dengan navbar, hero, deskripsi singkat, CTA lihat kegiatan, event unggulan, kegiatan mendatang, tentang Rohkris, cuplikan galeri, berita terbaru, dan footer.
- `/kegiatan` — Grid daftar kegiatan, filter kategori/status, sort berdasarkan tanggal, dan empty state.
- `/kegiatan/[slug]` — Detail kegiatan dengan poster, informasi utama, deskripsi, status pendaftaran, dokumen terkait, dan tombol daftar eksternal.
- `/jadwal` — Daftar/timeline jadwal kegiatan mendatang yang bisa menuju detail event. Kalender interaktif hanya jika mudah dan tidak menurunkan kualitas MVP.
- `/dokumentasi` — Galeri foto/video kegiatan.
- `/berita` — Daftar recap atau berita kegiatan.
- `/berita/[slug]` — Detail berita dengan cover, isi, tanggal terbit, dan event terkait.
- `/tentang` — Informasi Rohkris, nilai, visi-misi, dan pembina jika datanya tersedia.
- `/kontak` — Kontak dan sosial media yang bisa diubah admin.
- `/admin/login` — Login admin.
- `/admin` — Dashboard.
- `/admin/kegiatan` dan form buat/edit kegiatan.
- `/admin/galeri`, `/admin/berita`, `/admin/pengumuman`, `/admin/pengaturan`, serta `/admin/akses` jika hak pengguna Super Admin sudah aktif.

Jangan menampilkan halaman publik yang membutuhkan konten belum disediakan seolah-olah faktanya nyata. Gunakan empty state atau placeholder yang jelas.

### 5. Model data

Semua entitas inti menggunakan UUID sebagai primary key. Gunakan slug unik untuk URL publik. Minimal siapkan tabel:

**`admin_users`**
- `id` UUID primary key
- `auth_user_id` UUID unik yang sesuai dengan user pada sistem autentikasi
- `role` (`super_admin`, `admin`, atau `editor`)
- `display_name`, `is_active`, `created_at`, `updated_at`

**`events`**
- `id`, `title`, `slug`, `category`, `summary`, `description`, `cover_image_url`
- `start_at`, `end_at`, `location`, `event_mode`
- `registration_url`, `registration_open_at`, `registration_close_at`, `registration_status`
- `cost_info`, `dress_code`, `participant_rules`, `contact_info`, `resource_url`
- `is_featured`, `status` (`draft`, `published`, `archived`, `cancelled`)
- `created_by`, `updated_by`, `created_at`, `updated_at`, `published_at`

**`media_items`**
- `id`, `event_id` nullable, `title`, `caption`, `alt_text`, `media_url`, `media_type`, `taken_at`, `status`, `sort_order`, `created_by`, `created_at`, `updated_at`

**`news_posts`**
- `id`, `title`, `slug`, `excerpt`, `body`, `cover_image_url`, `event_id` nullable, `status`, `published_at`, `created_by`, `updated_by`, `created_at`, `updated_at`

**`announcements`**
- `id`, `title`, `body`, `starts_at`, `ends_at`, `priority`, `status`, `created_by`, `created_at`, `updated_at`

**`site_settings`**
- `id`, `key` unik, `value`, `updated_by`, `updated_at`

Gunakan migration/schema file yang dapat dijalankan ulang secara terkontrol. Berikan index pada kolom pencarian/filter yang perlu, terutama slug, status, category, start date, dan published date. Validasi keunikan slug serta referensi relasi.

### 6. Panel admin

Bangun panel admin yang mudah dipakai orang non-teknis.

Dashboard menampilkan ringkasan kegiatan mendatang, jumlah event published/draft, berita terkini, dan shortcut aksi utama.

Untuk kegiatan, admin dapat:
- Membuat event baru.
- Mengedit semua informasi event.
- Mengunggah poster/cover dengan preview.
- Memasukkan `registration_url` dan `resource_url` pada field terpisah.
- Menyimpan draft.
- Melihat preview sebelum publish.
- Publish, unpublish, archive, cancel, serta menghapus dengan dialog konfirmasi.
- Menentukan event unggulan.

Untuk galeri, berita, pengumuman, dan pengaturan situs, sediakan CRUD yang sesuai. Semua form wajib punya label, validasi, status loading, feedback sukses/gagal, dan konfirmasi untuk aksi destruktif. Setelah save/publish, cache halaman publik harus diperbarui melalui mekanisme yang tepat agar konten terbaru segera tampil tanpa deployment ulang.

Gunakan editor teks yang aman. Hindari merender HTML mentah dari input admin tanpa sanitasi. Jika markdown digunakan, render dengan parser yang aman.

### 7. Alur event dan tombol pendaftaran

- Kartu event memiliki link **Lihat Detail** menuju `/kegiatan/[slug]`.
- Tombol **Daftar Sekarang** hanya tampil jika pendaftaran dianggap terbuka dan `registration_url` tersedia serta valid.
- Link dibuka pada tab baru dengan `target="_blank"` dan `rel="noopener noreferrer"`.
- URL harus menggunakan HTTPS, kecuali ada pengecualian yang dijustifikasi.
- Jika pendaftaran belum dibuka, tampilkan label **Segera Dibuka** bila jadwal tersedia.
- Jika pendaftaran ditutup, tampilkan **Pendaftaran Ditutup**; jangan tetap tampilkan CTA yang seolah masih menerima pendaftar.
- Jika tautan belum diisi, tampilkan pesan yang sesuai atau sembunyikan tombol; jangan mengarahkan ke link dummy.
- Event berstatus draft tidak boleh muncul di publik. Event archived/selesai tersedia di arsip sesuai desain.
- Semua tanggal ditampilkan dalam bahasa Indonesia dengan zona waktu `Asia/Jakarta`.

### 8. Keamanan — jangan ditawar

Pengguna meminta penggunaan UUID agar panel admin tidak dapat dimasuki sembarang orang. Implementasikan UUID sebagai identitas unik pengguna/admin dan referensi data, **bukan sebagai satu-satunya password atau pengaman route**. Jangan memberi akses hanya karena seseorang mengetahui URL atau UUID.

Wajib:

1. Semua rute admin dan semua endpoint/Server Action mutasi memverifikasi sesi autentikasi di server.
2. Cocokkan UUID pengguna yang telah terautentikasi dengan record aktif di `admin_users` dan cek role untuk setiap operasi yang dilindungi.
3. Jangan hanya menyembunyikan tombol atau halaman di frontend; proteksi harus di server/database.
4. Terapkan Supabase Row Level Security pada semua tabel yang dapat diakses lewat Data API; atur grants dan policy least-privilege secara tepat.
5. Publik hanya dapat membaca konten published yang memang publik. Publik tidak boleh melakukan insert/update/delete.
6. Hanya Super Admin yang dapat mengelola daftar admin dan role.
7. Admin nonaktif langsung kehilangan hak saat server/database memeriksa role lagi.
8. Jangan pernah memasukkan Supabase service-role key, database password, auth secret, atau kredensial privat ke client bundle atau repository. Simpan di environment variables server.
9. Jangan membuat kredensial default yang sama untuk semua deployment. Buat panduan aman untuk membuat admin pertama melalui Supabase Auth + insert allowlist admin oleh operator tepercaya/migration yang aman.
10. Tambahkan rate limiting pada login atau instruksi konfigurasi platform untuk membatasinya. Gunakan pesan login yang tidak mengungkap apakah email tertentu terdaftar.
11. Gunakan validasi server pada payload dan URL, sanitasi konten rich text/markdown, validasi MIME/ukuran file, dan penamaan file aman.
12. Gunakan HTTPS saat deployment; jangan log token, password, atau rahasia.
13. Buat pengujian otorisasi yang memastikan publik dan user non-admin tidak dapat mengubah konten.

Rute boleh memakai `/admin` yang umum. Keamanan berasal dari autentikasi + role authorization + database policies, bukan menyembunyikan UUID di URL.

### 9. Konfigurasi dan file dokumentasi

Sediakan `.env.example` tanpa nilai rahasia asli, minimal berisi placeholder yang diperlukan seperti:

- `NEXT_PUBLIC_SUPABASE_URL=`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY=` atau publishable key sesuai versi layanan
- `SUPABASE_SERVICE_ROLE_KEY=` **server-only dan jangan pernah di-expose ke browser; masukkan hanya jika benar-benar diperlukan di server**
- variabel tambahan hanya jika arsitektur membutuhkan

Jangan wajibkan penggunaan service role key untuk operasi normal pengguna jika bisa memakai sesi pengguna dan RLS. Dokumentasikan perbedaan variable publik dan rahasia.

Buat `README.md` berisi:
- Persyaratan environment.
- Cara instalasi dan menjalankan lokal.
- Cara membuat/menghubungkan proyek Supabase.
- Cara menjalankan migration dan konfigurasi RLS.
- Cara membuat admin pertama dengan aman.
- Cara menjalankan test.
- Cara deploy.
- Daftar environment variables dan klasifikasi mana yang rahasia.
- Cara menambahkan event baru dari panel admin.

Tambahkan seed data DEMO yang diberi label jelas, misalnya event Natal/Paskah contoh dengan tanggal placeholder, dan jangan membuat data demo seolah-olah pengumuman resmi sekolah. Seed tidak boleh berisi kredensial administrator.

### 10. Kualitas implementasi

- Gunakan TypeScript dengan tipe data yang jelas; hindari `any` tanpa alasan.
- Buat komponen yang reusable dan aksesibel.
- Gunakan server-side data fetching sesuai arsitektur dan invalidate/revalidate cache setelah perubahan.
- Buat skeleton/loading, error boundary atau penanganan error, empty state, dan not-found page.
- Tangani gambar gagal dimuat.
- Tambahkan metadata SEO, Open Graph, sitemap, dan robots sesuai kebutuhan.
- Jangan masukkan secret ke source map atau log.
- Pastikan halaman inti responsif pada layar ponsel dan desktop.
- Jangan mengimplementasikan fitur fiktif atau tombol yang tidak bekerja.
- Berikan validasi dan pesan error yang dapat dimengerti pengguna berbahasa Indonesia.

### 11. Test yang harus dibuat

Minimal tambahkan automated tests atau checklist uji yang runnable untuk:

1. Publik hanya menerima event published.
2. Pengguna tanpa sesi ditolak di panel admin dan operasi mutasi.
3. Pengguna login yang UUID-nya tidak ada/tidak aktif di `admin_users` ditolak.
4. Admin berizin dapat membuat dan mengedit event.
5. Publik tidak dapat insert/update/delete event melalui API/database.
6. Tombol daftar membuka URL yang tersimpan ketika valid dan pendaftaran terbuka.
7. Tidak ada CTA daftar yang rusak jika URL kosong atau pendaftaran ditutup.
8. Slug duplikat dan input wajib kosong divalidasi.
9. Upload file dengan tipe/ukuran tidak diperbolehkan ditolak.
10. Perubahan dari panel admin terlihat di halaman publik setelah mekanisme revalidation berjalan.

### 12. Deliverables

Jangan hanya memberikan ide, screenshot, atau prototype visual. Bangun aplikasi yang berfungsi dan berikan:

1. Source code lengkap dan struktur proyek rapi.
2. Schema/migration database.
3. RLS policies untuk semua tabel yang terekspos.
4. Panel admin yang benar-benar melakukan CRUD.
5. Website publik dan halaman detail event.
6. `.env.example` tanpa secret.
7. `README.md` instalasi, konfigurasi, provisioning admin, test, dan deployment.
8. Test atau skrip untuk memvalidasi alur dan keamanan inti.
9. Daftar hal yang masih memerlukan input sekolah seperti logo resmi, kontak, tautan sosial, foto dokumentasi, dan domain.

### 13. Urutan pengerjaan

1. Periksa folder/repository yang tersedia dan jelaskan secara singkat struktur yang akan dibuat.
2. Implementasikan schema, auth, role checks, dan RLS sejak awal—jangan menunda keamanan hingga akhir.
3. Bangun komponen desain dan halaman publik.
4. Bangun admin dashboard serta CRUD untuk event terlebih dahulu, lalu galeri, berita, pengumuman, dan pengaturan.
5. Implementasikan link daftar Google Forms/Drive dan state pendaftaran.
6. Tambahkan SEO, accessibility, loading/error/empty state.
7. Jalankan lint, typecheck, test, dan build; perbaiki error yang ditemukan.
8. Berikan ringkasan file penting, setup yang harus dilakukan pemilik proyek, hasil pemeriksaan, dan keterbatasan yang benar-benar tersisa. Jangan mengklaim test berhasil jika belum dijalankan.

Mulai implementasi sekarang dengan mengikuti PRD yang disediakan dan semua aturan di atas. Jika ada detail identitas sekolah yang belum diberikan, gunakan placeholder yang eksplisit dan mudah diganti; jangan berhenti hanya untuk menanyakan detail tersebut.

---

## Cara memakai prompt

1. Lampirkan `PRD.md` dan file `PROMPT_IMPLEMENTASI.md` ke AI coding tool yang digunakan.
2. Tempel bagian **PROMPT** ke tool tersebut.
3. Hubungkan layanan database/auth hanya melalui dashboard resmi dan environment variables; jangan tempel secret ke percakapan publik atau source code.
4. Sebelum website dibuka untuk umum, tes akses dengan tiga kondisi: pengunjung anonim, user login non-admin, dan admin aktif.
