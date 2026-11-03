# Rohkris Pelita Nusantara

Website resmi **Rohani Kristen SMK PLUS PELITA NUSANTARA** — landing page publik
untuk seluruh kegiatan Rohkris, dilengkapi panel admin agar pengurus dapat
memperbarui konten tanpa menyentuh source code dan tanpa deploy ulang.

Pendaftaran peserta **tidak disimpan di website**. Tombol *Daftar Sekarang*
hanya mengarahkan pengunjung ke tautan eksternal (Google Forms/Drive) yang
diatur admin.

---

### Daftar Isi

1. [Persyaratan](#1-persyaratan)
2. [Instalasi dan menjalankan lokal](#2-instalasi-dan-menjalankan-lokal)
3. [Menyiapkan database MySQL](#3-menyiapkan-database-mysql)
4. [Membuat admin pertama](#4-membuat-admin-pertama)
5. [Deploy ke hosting cPanel (Isolasi Penuh Multi-Website)](#5-deploy-ke-hosting-cpanel-isolasi-penuh-multi-website)
6. [Menjalankan test](#6-menjalankan-test)
7. [Backup](#7-backup)
8. [Environment variables](#8-environment-variables)
9. [Cara menambah kegiatan dari panel admin](#9-cara-menambah-kegiatan-dari-panel-admin)
   - [Formulir internal (pengganti Google Form)](#formulir-internal-pengganti-google-form)
   - [E-Tiket Digital & Pemindai Kode QR Multi-Fungsi](#e-tiket-digital--pemindai-kode-qr-multi-fungsi)
10. [Struktur proyek](#10-struktur-proyek)
11. [Catatan keamanan](#11-catatan-keamanan)
12. [Yang masih dibutuhkan dari pihak sekolah](#12-yang-masih-dibutuhkan-dari-pihak-sekolah)

---

## 1. Persyaratan

| Kebutuhan | Versi |
|---|---|
| Node.js | **20 LTS+** (dikunci `>=20.9.0` di `package.json` dan `20` di `.nvmrc`) |
| npm | 10+ |
| Database | **MySQL 8.0.16+** atau **MariaDB 10.5+** (tersedia di hampir semua hosting cPanel) |

Semua data, akun admin, dan foto unggahan disimpan di hosting Anda sendiri.
Tidak ada layanan pihak ketiga yang bisa menonaktifkan website karena tidak
ada aktivitas.

---

## 2. Instalasi dan menjalankan lokal

```bash
npm install
cp .env.example .env.local     # lalu isi koneksi database (bagian 3)
npm run dev
```

Buka http://localhost:3000. Panel admin ada di `http://localhost:3000/admin/login?key=<ADMIN_SECRET_KEY>`.

Untuk MySQL lokal di Windows bisa memakai **Laragon** atau **XAMPP**.

Perintah yang tersedia:

| Perintah | Kegunaan |
|---|---|
| `npm run dev` | Menjalankan server pengembangan |
| `npm run build` | Build produksi (menghasilkan `.next/standalone`) |
| `npm start` | Menjalankan hasil build |
| `npm run admin:buat` | Membuat super admin / mengatur ulang kata sandi admin |
| `npm run lint` | Memeriksa gaya kode |
| `npm run typecheck` | Memeriksa tipe TypeScript |
| `npm test` | Menjalankan unit test |

---

## 3. Menyiapkan database MySQL

### Di cPanel

1. Buka **MySQL® Databases**.
2. **Create New Database**, misalnya `rohkris`. cPanel menambahkan awalan
   nama akun, jadi hasilnya seperti `akunanda_rohkris`.
3. **Add New User** khusus untuk Rohkris dengan kata sandi yang kuat (pakai *Password Generator*).
4. **Add User To Database**: pilih user dan database tadi, lalu centang
   **SELECT, INSERT, UPDATE, DELETE** saja. Tidak perlu *ALL PRIVILEGES*.
5. Buka **phpMyAdmin**, pilih database `akunanda_rohkris`, buka tab **Import**, unggah
   `database/schema.sql`, lalu klik **Go**. (`database/schema.sql` sudah mencakup seluruh tabel termasuk Formulir Internal dan E-Tiket QR).
6. (Opsional) Import juga `database/seed-demo.sql` untuk data contoh
   berlabel `[DEMO]`. Hapus sebelum situs dibuka untuk umum:

```sql
DELETE FROM events        WHERE title LIKE '[DEMO]%';
DELETE FROM news_posts    WHERE title LIKE '[DEMO]%';
DELETE FROM announcements WHERE title LIKE '[DEMO]%';
DELETE FROM media_items   WHERE title LIKE '[DEMO]%';
```

> Import `schema.sql` lewat phpMyAdmin memakai akun cPanel, bukan user
> aplikasi, karena membuat tabel butuh hak `CREATE`. User aplikasi cukup
> punya hak baca/tulis.

### Di komputer lokal

```bash
mysql -u root -p -e "CREATE DATABASE rohkris CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
mysql -u root -p rohkris < database/schema.sql
mysql -u root -p rohkris < database/seed-demo.sql   # opsional
```

Lalu isi `.env.local`:

```bash
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_NAME=rohkris
DATABASE_USER=root
DATABASE_PASSWORD=
```

---

## 4. Membuat admin pertama

Aplikasi sengaja **tidak memiliki akun bawaan**. Admin pertama dibuat lewat
terminal dari folder aplikasi (env database harus sudah terisi):

```bash
npm run admin:buat
```

Skrip menanyakan email, nama, dan kata sandi (minimal 10 karakter; ketikan
kata sandi tidak tampil di layar). Akun yang dibuat berperan **super admin**.

- Bila email sudah ada, skrip **mengatur ulang** kata sandinya, mengaktifkan
  akun, dan mengeluarkan semua sesi lamanya. Pakai ini bila lupa kata sandi.
- Admin berikutnya cukup ditambahkan dari panel → **Kelola Admin** (email,
  nama, kata sandi awal, peran).

---

## 5. Deploy ke hosting cPanel (Isolasi Penuh Multi-Website)

Butuh fitur **Setup Node.js App** di cPanel. Bila di dalam satu akun hosting
cPanel sudah terdapat website lain yang sedang aktif (misalnya di `public_html`
atau folder aplikasi lain), ikuti **Arsitektur Isolasi 5 Lapis** berikut agar
website Rohkris berjalan mandiri 100% **tanpa menyentuh atau mengganggu website lain**:

### Arsitektur Isolasi 5 Lapis (Zero-Interference)

| Lapis Isolasi | Pengaturan Khusus Website Rohkris | Dampak ke Website Lain di Hosting |
|---|---|---|
| **1. Domain & Document Root** | Tambahkan domain (mis. `rohkrissmkpenus.web.id`) di menu **Domains → Create A New Domain**, matikan centang *Share document root*, dan arahkan Document Root ke folder terpisah (mis. `/home/akunanda/rohkrissmkpenus.web.id` atau `/home/akunanda/rohkris/public`). **JANGAN** memakai `/home/akunanda/public_html`. | Website utama di `public_html` atau addon domain lain tidak tersentuh. |
| **2. Folder Aplikasi Node.js (`Application Root`)** | Simpan seluruh kode dan build di `/home/akunanda/rohkris`. Virtual environment Node.js otomatis terisolasi di `/home/akunanda/nodevenv/rohkris/20/`. | Proses, port internal Passenger, dan `node_modules` terpisah penuh dari aplikasi lain. |
| **3. Database & User MySQL** | Buat database khusus `akunanda_rohkris` dan user khusus `akunanda_rohkris` yang hanya diberi hak `SELECT, INSERT, UPDATE, DELETE` pada `akunanda_rohkris`. | Tabel dan koneksi database website lain tidak dapat diakses atau terpengaruh. |
| **4. Direktori Unggahan di Luar `public_html`** | Gunakan `/home/akunanda/rohkris-uploads` untuk `UPLOAD_DIR` (poster/galeri publik) dan `/home/akunanda/rohkris-form-uploads` untuk `FORM_UPLOAD_DIR` (berkas privat peserta). | Berkas unggahan tidak bercampur dengan media website lain dan aman saat deploy ulang. |
| **5. Pre-built Standalone Bundle (`rohkris-build.zip`)** | Build dikompilasi di komputer lokal (`npm run build` + `powershell scripts/pack-build.ps1`), bukan di server cPanel. | Tidak mengonsumsi kuota CPU/RAM WebAssembly di server shared hosting sehingga website lain tetap cepat dan stabil. |

### Langkah pertama kali

1. **Siapkan domain terpisah**: di cPanel → **Domains**, tambahkan domain Rohkris dengan Document Root mandiri (di luar `public_html`).
2. **Siapkan database mandiri** sesuai bagian 3.
3. **Buat folder aplikasi dan folder unggahan terpisah** lewat File Manager atau Terminal cPanel:
   ```bash
   mkdir -p ~/rohkris ~/rohkris-uploads ~/rohkris-form-uploads
   chmod 750 ~/rohkris-uploads ~/rohkris-form-uploads
   ```
4. **Setup Node.js App di cPanel → Create Application**:
   - *Node.js version*: **20+** (disarankan 20 LTS atau 22).
   - *Application mode*: Production
   - *Application root*: `rohkris` (folder `/home/akunanda/rohkris`)
   - *Application URL*: domain/subdomain Rohkris Anda (mis. `rohkrissmkpenus.web.id`)
   - *Application startup file*: `.next/standalone/server.js`
5. Tambahkan **Environment variables** di menu Setup Node.js App (khusus aplikasi `rohkris`):
   - `DATABASE_HOST=localhost` (atau `127.0.0.1`)
   - `DATABASE_NAME=akunanda_rohkris`
   - `DATABASE_USER=akunanda_rohkris`
   - `DATABASE_PASSWORD=kata_sandi_user_rohkris`
   - `ADMIN_SECRET_KEY=isi-dengan-uuid-acak`
   - `UPLOAD_DIR=/home/akunanda/rohkris-uploads`
   - `FORM_UPLOAD_DIR=/home/akunanda/rohkris-form-uploads`
   - `NEXT_PUBLIC_SITE_URL=https://rohkrissmkpenus.web.id`
   - `NODE_ENV=production`
   Klik **Save**.
6. **Kompilasi dan kemas di komputer lokal:**
   ```bash
   npm run build
   powershell scripts/pack-build.ps1
   ```
   Skrip ini otomatis menyalin aset statis (`.next/static` dan `public`) ke `.next/standalone`, menormalisasi path ke format POSIX Linux, menyertakan `database/`, `scripts/buat-admin.mjs`, `package.json`, `.env.example`, serta `tmp/restart.txt`, mengecualikan seluruh berkas sensitif, dan menghasilkan arsip `rohkris-build.zip`.
7. **Unggah dan ekstrak hanya di dalam folder `~/rohkris`:**
   Lewat File Manager atau SCP, unggah `rohkris-build.zip` ke `/home/akunanda/rohkris`.
   Di Terminal cPanel:
   ```bash
   cd ~/rohkris
   rm -rf .next
   unzip -o rohkris-build.zip
   touch tmp/restart.txt
   ```
8. Buat akun super admin di Terminal cPanel:
   ```bash
   source ~/nodevenv/rohkris/20/bin/activate && cd ~/rohkris
   npm run admin:buat
   ```
9. Kembali ke **Setup Node.js App**, lalu klik **Restart** pada baris aplikasi `rohkris`.
10. **SSL**: buka *SSL/TLS Status*, centang hanya domain Rohkris Anda, lalu jalankan **AutoSSL**.
11. **Akses Panel Admin**:
    Buka URL gerbang admin khusus:
    `https://rohkrissmkpenus.web.id/admin/login?key=<ADMIN_SECRET_KEY>`
    (Ganti `<ADMIN_SECRET_KEY>` dengan nilai UUID yang disetel di environment variable).
    Akses tanpa parameter `key` atau cookie gerbang otomatis disajikan halaman **404 Not Found**.

### Memperbarui website (Tanpa Mengganggu Website Lain)

Bila ada pembaruan kode:

1. **Bila pembaruan membawa berkas baru di `database/migrations/`**, jalankan berkas SQL migrasi tersebut terlebih dahulu di **phpMyAdmin** hanya pada database `akunanda_rohkris` → tab **Import**:
   - `database/migrations/2026-10-formulir-internal.sql` (untuk fitur Formulir Internal)
   - `database/migrations/2026-11-e-tiket-qr.sql` (untuk fitur E-Tiket Digital & Pemindai QR)
2. Di komputer lokal:
   ```bash
   npm run build
   powershell scripts/pack-build.ps1
   ```
3. Unggah `rohkris-build.zip` ke `~/rohkris` di hosting.
4. Di Terminal cPanel (hanya beroperasi di dalam `~/rohkris`):
   ```bash
   cd ~/rohkris
   rm -rf .next
   unzip -o rohkris-build.zip
   touch tmp/restart.txt
   ```
5. Di cPanel **Setup Node.js App**, klik tombol **Restart** khusus pada aplikasi `rohkris`.

---

## 6. Menjalankan test

### Unit test (tidak perlu database)

```bash
npm test
```

Mencakup logika yang paling rawan salah:

- **Status pendaftaran**: matriks lengkap kapan tombol *Daftar Sekarang* boleh
  muncul (status kegiatan × status pendaftaran × ada/tidaknya URL × jadwal).
- **Sanitasi Markdown**: `<script>`, `onerror`, `javascript:`, dan `<iframe>`
  harus terbuang, sementara format sah tetap utuh.
- **Validasi form**: slug, URL https, path unggahan, urutan waktu, batas unggahan.
- **Kata sandi & unggahan**: hash scrypt, deteksi isi gambar (berkas PHP
  berkedok `.png` ditolak), dan penolakan path traversal.
- **Tanggal WIB**: konversi UTC ↔ Asia/Jakarta, termasuk pergantian hari.
- **Formulir internal & E-Tiket QR**: validasi definisi form, percabangan bagian,
  tanda tangan kriptografi HMAC SHA-256 kode QR, dan resolusi data peserta.

### Uji manual sebelum rilis

- [ ] Pengunjung anonim melihat event published, **tidak** melihat draft.
- [ ] Detail event tanpa `registration_url` tidak menampilkan tombol daftar rusak.
- [ ] Tombol daftar membuka URL tersimpan di tab baru.
- [ ] `/admin` tanpa kunci gerbang menampilkan 404 Not Found.
- [ ] Akun yang dinonaktifkan langsung kehilangan akses.
- [ ] Unggah poster berhasil dan gambarnya tampil di halaman publik.
- [ ] Event draft → publish langsung tampil di publik tanpa rebuild.
- [ ] Tampilan rapi pada lebar ponsel, tablet, dan desktop.

---

## 7. Backup

Semua data sekarang ada di hosting Anda, jadi **backup menjadi tanggung jawab
Anda**:

- **Database**: cPanel → *Backup* → *Download a MySQL Database Backup* (pilih `akunanda_rohkris`), atau
  phpMyAdmin → *Export*. Lakukan rutin, misalnya mingguan.
- **Foto unggahan**: kompres lalu unduh folder `UPLOAD_DIR`
  (misalnya `rohkris-uploads`) lewat File Manager.
- **Berkas peserta formulir internal**: folder `FORM_UPLOAD_DIR`
  (misalnya `rohkris-form-uploads`). Berisi data pribadi siswa — simpan
  cadangannya dengan aman dan hapus bila kegiatan sudah selesai.
- Banyak hosting juga menyediakan backup otomatis (misalnya JetBackup).
  Pastikan fitur itu aktif dan mencakup folder unggahan.

---

## 8. Environment variables

| Variabel | Sifat | Wajib | Keterangan |
|---|---|---|---|
| `DATABASE_HOST` | **RAHASIA** | Ya | Biasanya `localhost` di cPanel |
| `DATABASE_PORT` | Rahasia | Tidak | Default `3306` |
| `DATABASE_NAME` | **RAHASIA** | Ya | Mis. `akunanda_rohkris` |
| `DATABASE_USER` | **RAHASIA** | Ya | User MySQL dengan hak SELECT/INSERT/UPDATE/DELETE |
| `DATABASE_PASSWORD` | **RAHASIA** | Ya | Kata sandi user MySQL |
| `DATABASE_URL` | **RAHASIA** | Tidak | Alternatif satu baris `mysql://user:pass@host:3306/db` |
| `UPLOAD_DIR` | Server | Disarankan | Folder foto unggahan, di luar folder aplikasi |
| `NEXT_PUBLIC_SITE_URL` | Publik | Disarankan | Domain produksi, untuk SEO & sitemap (dibaca saat build) |
| `NODE_ENV` | Server | Ya (produksi) | `production`, mengaktifkan cookie `Secure` |
| `ADMIN_SECRET_KEY` | **RAHASIA** | Ya | Kunci gerbang panel admin; juga menandatangani token anti-spam formulir & HMAC QR E-Tiket |
| `FORM_UPLOAD_DIR` | Server | Disarankan | Folder **privat** berkas unggahan peserta formulir internal. Harus di luar folder aplikasi dan **tidak boleh** berada di dalam `UPLOAD_DIR` (aplikasi menolak bekerja bila bertumpuk) |
| `MAIL_FROM` | Server | Untuk email | Pengirim email konfirmasi, mis. `Rohkris <noreply@domainanda.sch.id>` |
| `MAIL_TRANSPORT` | Server | Tidak | `smtp` (bawaan) atau `sendmail` (pakai `/usr/sbin/sendmail` hosting) |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_SECURE` | Server | Untuk SMTP | Mis. `mail.domainanda.sch.id`, `465`, `true` |
| `SMTP_USER` / `SMTP_PASS` | **RAHASIA** | Untuk SMTP | Akun email cPanel pengirim |

**Variabel berawalan `NEXT_PUBLIC_` ikut terkirim ke browser.** Jangan pernah
menaruh rahasia di sana, dan jangan commit `.env.local`.

---

## 9. Cara menambah kegiatan dari panel admin

1. Masuk ke `/admin`, pilih **Kegiatan → + Buat Kegiatan**.
2. Isi judul; slug URL terisi otomatis dan masih bisa diubah.
3. Pilih kategori, lalu isi ringkasan dan deskripsi (mendukung Markdown).
4. Unggah poster, atau tempel URL gambar yang diawali `https://`.
5. Isi waktu mulai/selesai dalam **WIB**, lokasi, dan format kegiatan.
6. Bagian **Pendaftaran** — perhatikan dua kolom yang berbeda:
   - **Tautan PENDAFTARAN** → tujuan tombol *Daftar Sekarang* (Google Forms).
   - **Tautan DOKUMEN PENDUKUNG** → rundown, booklet, atau surat izin.
7. Atur status pendaftaran. Tombol daftar hanya muncul bila status **Dibuka**
   **dan** formulirnya siap: tautan `https://` untuk formulir luar, atau formulir
   internal yang sudah berisi pertanyaan.
8. Simpan sebagai **Draft** dulu bila belum siap, lalu **Terbitkan** dari daftar
   kegiatan. Perubahan langsung tampil di website tanpa deploy ulang.

---

### Formulir internal (pengganti Google Form)

Selain tautan Google Form, setiap kegiatan bisa memakai formulir yang dibuat
langsung di panel admin. Jawaban tersimpan di server dan hanya bisa dilihat admin.

1. **Satu kali**: jalankan `database/migrations/2026-10-formulir-internal.sql`
   (bila memperbarui dari database lama), lalu isi `FORM_UPLOAD_DIR` bila formulir
   memakai pertanyaan unggah berkas.
2. Buka kegiatan → tab **Detail** → bagian Pendaftaran → pilih **Formulir internal**,
   atur status **Dibuka** dan (opsional) waktu buka/tutup, lalu simpan.
3. Tab **Formulir**: susun bagian & pertanyaan (jawaban singkat, paragraf, pilihan
   ganda, kotak centang, dropdown, skala linear, kisi pilihan, tanggal, waktu,
   unggah berkas). Pilihan ganda/dropdown bisa **melompat ke bagian** tertentu
   (hanya ke bagian sesudahnya). Gunakan tab **Pratinjau** untuk mencoba.
4. Tab **Pengaturan** (di builder): kumpulkan email, satu respons per email,
   izinkan ubah jawaban, kirim salinan email, **kuota**, pesan setelah kirim,
   dan teks persetujuan data.
5. Tab **Respons**: ringkasan per pertanyaan, tampilan per respons (termasuk
   unduh berkas), **ekspor CSV** — pilih *CSV (Excel)* untuk Excel berbahasa
   Indonesia (pemisah titik koma) atau *CSV (Google Sheets)* — dan hapus respons.

Catatan:
- Setelah ada respons, jenis pertanyaan yang sudah ada dikunci; teks dan opsi
  masih boleh diubah. Respons lama tetap terbaca walau opsi/pertanyaan dihapus.
- Kuota dijaga di database dengan penguncian baris, sehingga dua kiriman
  bersamaan tidak bisa melampaui kuota.
- **Email konfirmasi** butuh `MAIL_FROM` + SMTP (atau `MAIL_TRANSPORT=sendmail`).
  Banyak hosting memblokir SMTP keluar; coba `sendmail` bila SMTP gagal.
  Bila belum dikonfigurasi, opsi kirim salinan otomatis nonaktif.
- Formulir tanpa login dilindungi kolom jebakan bot, token waktu, dan batas
  kiriman per jaringan. “Satu respons per email” mencegah pendaftaran ganda
  tanpa sengaja, bukan verifikasi identitas.

---

### E-Tiket Digital & Pemindai Kode QR Multi-Fungsi

Kegiatan yang memakai **Formulir internal** dapat menerbitkan E-Tiket resmi
berkode QR ber-signature HMAC SHA-256 untuk presensi kehadiran (*check-in*) dan
penukaran kupon fasilitas (misalnya konsumsi, suvenir, photobooth).

1. **Satu kali**: jalankan `database/migrations/2026-11-e-tiket-qr.sql` pada
   database lama (atau gunakan `database/schema.sql` untuk instalasi baru).
2. Buka kegiatan → tab **Formulir** → sub-tab **Pengaturan** → aktifkan
   **Terbitkan E-Tiket & Kode QR**.
3. Pilih pertanyaan penentu nama peserta, mode penukaran (**Fleksibel Bertahap**
   per pos atau **Semua Sekaligus / Otomatis**), serta daftar kupon/fasilitas.
4. Saat peserta mendaftar:
   - Layar selesai langsung menampilkan kartu **E-Tiket Digital** dengan tombol
     **Unduh Gambar (PNG)** dan **Cetak / Simpan PDF**.
   - Bila email konfirmasi aktif, kartu E-Tiket beserta gambar QR otomatis
     dikirimkan ke surel peserta.
5. **Tab Tiket** (`/admin/kegiatan/[id]/tiket`): memantau daftar tiket, status
   kehadiran, kupon yang sudah ditukar, kirim ulang surel tiket, serta membuka
   modal **Tiket Cadangan Server** bila peserta kehilangan tiket di lokasi acara.
6. **Tab Pindai QR** (`/admin/kegiatan/[id]/scan`): antarmuka pemindai panitia
   menggunakan kamera perangkat (ponsel/laptop) maupun *USB Barcode Scanner Gun*
   dengan proteksi *anti-double-claim* dan isolasi lintas kegiatan.

---

## 10. Struktur proyek

```
app/
  (public)/                  Halaman publik + formulir pendaftaran peserta
  (admin-auth)/admin/login   Halaman masuk — dilindungi kunci gerbang UUID
  (admin-protected)/admin/   Panel admin — dilindungi requireAdmin()
  admin/gate/[key]/          Route handler penyetel cookie gerbang admin
  uploads/[...path]/         Menyajikan foto unggahan dari UPLOAD_DIR
  sitemap.ts robots.ts not-found.tsx error.tsx
components/
  site/      Navbar, Footer, EventCard, KategoriFleksibel, Lightbox
  formulir/  FormulirPublik, InputPertanyaan
  tiket/     KartuETiket, AksiUnduhTiket (ekspor PNG Canvas & cetak PDF)
  admin/     Form CRUD, PembangunFormulir, Respons, ManajemenTiket, PindaiTiket
  ui/        Button, Badge, Icons, state kosong/galat/muat
lib/
  auth/      guard.ts, session.ts, password.ts, gate.ts, gate-crypto.ts
  db/        index.ts (koneksi MySQL mysql2), types.ts
  actions/   Server Actions (events, news, media, announcements, settings, formulir, scan)
  data/      Query publik, admin, dan formulir
  forms/     Skema, validasi jawaban, percabangan, CSV, penyimpanan berkas, email
  tickets/   Pembuatan kode tiket, HMAC signature QR, generator QR, klaim presensi/kupon
  email/     Pengirim surel Nodemailer (SMTP / sendmail + lampiran CID QR)
  events/    Logika status pendaftaran
  validation/ Skema Zod bersama client & server
database/
  schema.sql             Skema lengkap MySQL (siap import untuk instalasi baru)
  seed-demo.sql          Data DEMO berlabel
  migrations/            Skrip SQL migrasi bertahap untuk database yang sudah berjalan
scripts/
  buat-admin.mjs         CLI pembuat/pengatur ulang super admin
  pack-build.ps1         Skrip pengemas bundel produksi mandiri (rohkris-build.zip)
tests/
  unit/                  Vitest — pengujian logika inti, keamanan, formulir, dan tiket
proxy.ts                 Gerbang rute admin & header no-store
```

---

## 11. Catatan keamanan

Keamanan panel bertumpu pada **tiga lapis**, bukan pada URL yang sulit ditebak:

1. **Gerbang kunci rahasia UUID (`ADMIN_SECRET_KEY`).** Pengunjung atau bot yang
   mengakses `/admin` atau `/admin/login` tanpa kunci gerbang langsung menerima
   respons **404 Not Found**.
2. **Gerbang sesi server (`requireAdmin()`).** `app/(admin-protected)/admin/layout.tsx`
   memverifikasi token sesi dari cookie HttpOnly terhadap tabel `admin_sessions`
   dan mencocokkannya dengan baris aktif di `admin_users`.
3. **Pemeriksaan ulang di setiap Server Action.** Tidak ada aksi mutasi yang
   menumpang pada proteksi layout, karena Server Action dapat dipanggil langsung.

Hal lain yang diterapkan:

- Halaman login berada di route group terpisah agar pengguna yang belum masuk
  tidak terjebak loop pengalihan.
- Markdown dari admin disanitasi memakai *allowlist* pada AST
  (`rehype-sanitize`) sebelum dirender; HTML mentah tidak pernah dipercaya.
- Kode QR E-Tiket ditandatangani secara kriptografis dengan HMAC SHA-256
  (`timingSafeEqual`) dan divalidasi per ID kegiatan agar tidak bisa dipalsukan
  atau dipakai lintas kegiatan.
- URL pendaftaran dan dokumen wajib `https://`, divalidasi di form, di Server
  Action, dan oleh `CHECK` constraint database.
- Tautan eksternal memakai `target="_blank"` dengan `rel="noopener noreferrer"`.
- Unggahan dibatasi jenis MIME dan ukuran (5 MB), diverifikasi magic bytes-nya,
  dan nama berkas dinormalkan agar bebas path traversal.
- Trigger database mencegah super admin terakhir dinonaktifkan atau dihapus.
- Panel admin diberi `noindex` dan dikecualikan dari `robots.txt` serta sitemap.
- Header keamanan dasar diatur di `next.config.ts`.

---

## 12. Yang masih dibutuhkan dari pihak sekolah

Hal-hal berikut dapat disesuaikan langsung melalui panel admin sebelum atau
sesudah rilis:

| Item | Cara mengganti |
|---|---|
| **Visi, misi, nilai, profil Rohkris** | Panel admin → **Pengaturan → Halaman Tentang** |
| **Email dan nomor kontak** | Panel admin → **Pengaturan → Kontak** |
| **Tautan media sosial** | Panel admin → **Pengaturan → Media Sosial** |
| **Foto dokumentasi kegiatan** | Panel admin → **Dokumentasi**. Pastikan izin penggunaan foto siswa sudah sesuai kebijakan sekolah. |
| **Keterangan/alamat sekolah** | Panel admin → **Pengaturan → Identitas Situs** |
| **Domain produksi** | Isi `NEXT_PUBLIC_SITE_URL` saat deployment |
| **Data kegiatan sebenarnya** | Hapus data `[DEMO]`, lalu isi lewat panel admin |

Selain itu, perlu keputusan dari pihak sekolah mengenai:

- Siapa yang menjadi **super admin** pertama.
- Kebijakan persetujuan penggunaan foto siswa di halaman dokumentasi.
- Apakah halaman **Kebijakan Privasi** perlu ditinjau pihak sekolah sebelum rilis.

