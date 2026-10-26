# Rohkris Pelita Nusantara

Website resmi **Rohani Kristen SMK PLUS PELITA NUSANTARA** — landing page publik
untuk seluruh kegiatan Rohkris, dilengkapi panel admin agar pengurus dapat
memperbarui konten tanpa menyentuh source code dan tanpa deploy ulang.

Pendaftaran peserta **tidak disimpan di website**. Tombol *Daftar Sekarang*
hanya mengarahkan pengunjung ke tautan eksternal (Google Forms/Drive) yang
diatur admin.

---

## Daftar Isi

1. [Persyaratan](#1-persyaratan)
2. [Instalasi dan menjalankan lokal](#2-instalasi-dan-menjalankan-lokal)
3. [Menyiapkan database MySQL](#3-menyiapkan-database-mysql)
4. [Membuat admin pertama](#4-membuat-admin-pertama)
5. [Deploy ke hosting cPanel](#5-deploy-ke-hosting-cpanel)
6. [Menjalankan test](#6-menjalankan-test)
7. [Backup](#7-backup)
8. [Environment variables](#8-environment-variables)
9. [Cara menambah kegiatan dari panel admin](#9-cara-menambah-kegiatan-dari-panel-admin)
   - [Formulir internal (pengganti Google Form)](#formulir-internal-pengganti-google-form)
10. [Struktur proyek](#10-struktur-proyek)
11. [Catatan keamanan](#11-catatan-keamanan)
12. [Yang masih dibutuhkan dari pihak sekolah](#12-yang-masih-dibutuhkan-dari-pihak-sekolah)

---

## 1. Persyaratan

| Kebutuhan | Versi |
|---|---|
| Node.js | **26** (dikunci di `package.json` dan `.nvmrc`) |
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

Buka http://localhost:3000. Panel admin ada di http://localhost:3000/admin.

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
3. **Add New User** dengan kata sandi yang kuat (pakai *Password Generator*).
4. **Add User To Database**: pilih user dan database tadi, lalu centang
   **SELECT, INSERT, UPDATE, DELETE** saja. Tidak perlu *ALL PRIVILEGES*.
5. Buka **phpMyAdmin**, pilih database, buka tab **Import**, unggah
   `database/schema.sql`, lalu klik **Go**.
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

## 5. Deploy ke hosting cPanel

Butuh fitur **Setup Node.js App** di cPanel. Bila menu itu tidak ada,
hosting tersebut tidak bisa menjalankan aplikasi Next.js.

### Langkah pertama kali

1. **Siapkan database** sesuai bagian 3.
2. **Setup Node.js App di cPanel → Create Application**:
   - *Node.js version*: **20+** (disarankan 20 LTS atau 22).
   - *Application mode*: Production
   - *Application root*: `rohkris` (folder di `/home/akunanda/rohkris`)
   - *Application URL*: domain/subdomain Anda
   - *Application startup file*: `.next/standalone/server.js`
3. Tambahkan **Environment variables** di menu Setup Node.js App:
   - `DATABASE_HOST=localhost` (atau `127.0.0.1`)
   - `DATABASE_NAME=nama_database`
   - `DATABASE_USER=nama_user`
   - `DATABASE_PASSWORD=kata_sandi_user`
   - `ADMIN_SECRET_KEY=isi-dengan-uuid-acak`
   - `UPLOAD_DIR=/home/akunanda/rohkris-uploads`
   - `NEXT_PUBLIC_SITE_URL=https://domainanda.com`
   - `NODE_ENV=production`
   Klik **Save**.
4. **Buat folder unggahan** di luar folder aplikasi, misalnya `/home/akunanda/rohkris-uploads`.
5. **Kompilasi dan kemas di komputer lokal:**
   ```bash
   npm run build
   powershell scripts/pack-build.ps1
   ```
   Skrip ini otomatis menyalin aset statis (`.next/static` dan `public`) ke `.next/standalone`, mengecualikan berkas sensitif, dan menghasilkan arsip `rohkris-build.zip` dengan path berslash maju.
6. **Unggah dan ekstrak di server:**
   Lewat File Manager atau SCP, unggah `rohkris-build.zip` ke `/home/akunanda/rohkris`.
   Di Terminal cPanel:
   ```bash
   cd ~/rohkris
   rm -rf .next
   unzip -o rohkris-build.zip
   touch tmp/restart.txt
   ```
7. Buat akun super admin di Terminal cPanel:
   ```bash
   source ~/nodevenv/rohkris/20/bin/activate && cd ~/rohkris
   npm run admin:buat
   ```
8. Kembali ke **Setup Node.js App**, lalu klik **Restart**.
9. **SSL**: buka *SSL/TLS Status*, lalu jalankan **AutoSSL** untuk domain Anda.
10. **Akses Panel Admin**:
    Buka URL gerbang admin khusus:
    `https://domainanda.com/admin/login?key=<ADMIN_SECRET_KEY>`
    (Ganti `<ADMIN_SECRET_KEY>` dengan nilai UUID yang disetel di environment variable).
    Akses tanpa parameter `key` atau cookie gerbang otomatis disajikan halaman **404 Not Found**.

### Memperbarui website

Bila ada pembaruan kode:

1. Di komputer lokal:
   ```bash
   npm run build
   powershell scripts/pack-build.ps1
   ```
2. Unggah `rohkris-build.zip` ke `~/rohkris` di hosting.
3. Di Terminal cPanel:
   ```bash
   cd ~/rohkris
   rm -rf .next
   unzip -o rohkris-build.zip
   touch tmp/restart.txt
   ```
4. Di cPanel **Setup Node.js App**, klik tombol **Restart**.

> **Bila pembaruan membawa berkas baru di `database/migrations/`**, jalankan
> berkas SQL itu **sebelum** langkah 2 (phpMyAdmin → database → tab *Import*,
> dengan akun pemilik database, bukan akun aplikasi). Kode baru langsung
> membaca kolom/tabel baru tersebut. Contoh: pembaruan *Formulir Internal*
> membutuhkan `database/migrations/2026-10-formulir-internal.sql`.


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

### Uji manual sebelum rilis

- [ ] Pengunjung anonim melihat event published, **tidak** melihat draft.
- [ ] Detail event tanpa `registration_url` tidak menampilkan tombol daftar rusak.
- [ ] Tombol daftar membuka URL tersimpan di tab baru.
- [ ] `/admin` tanpa login dialihkan ke halaman masuk.
- [ ] Akun yang dinonaktifkan langsung kehilangan akses.
- [ ] Unggah poster berhasil dan gambarnya tampil di halaman publik.
- [ ] Event draft → publish langsung tampil di publik tanpa rebuild.
- [ ] Tampilan rapi pada lebar ponsel, tablet, dan desktop.

---

## 7. Backup

Semua data sekarang ada di hosting Anda, jadi **backup menjadi tanggung jawab
Anda**:

- **Database**: cPanel → *Backup* → *Download a MySQL Database Backup*, atau
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
| `ADMIN_SECRET_KEY` | **RAHASIA** | Ya | Kunci gerbang panel admin; juga menandatangani token anti-spam formulir internal |
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
   (lihat *Memperbarui website*), lalu isi `FORM_UPLOAD_DIR` bila formulir
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

## 10. Struktur proyek

```
app/
  (public)/              Halaman publik + navbar/footer
  (admin-auth)/admin/login   Halaman masuk — DI LUAR gerbang admin
  (admin-protected)/admin/   Panel admin — dilindungi requireAdmin()
  sitemap.ts robots.ts not-found.tsx error.tsx
components/
  site/     Navbar, Footer, EventCard, Lightbox
  admin/    Form, field, tombol aksi, dialog konfirmasi
  ui/       Button, Badge, state kosong/galat/muat
lib/
  auth/guard.ts          requireAdmin() / requireSuperAdmin()
  auth/session.ts        Sesi login (cookie + tabel admin_sessions), pembatas login
  auth/password.ts       Hash kata sandi scrypt
  db/index.ts            Koneksi MySQL (mysql2) + helper query
  db/types.ts            Tipe baris database
  actions/               Server Action per entitas
  data/                  Query publik dan admin
  events/status.ts       Logika status pendaftaran (teruji)
  validation/schemas.ts  Skema Zod bersama client & server
  markdown.ts            Render Markdown + sanitasi
  format/date.ts         Format Indonesia, zona Asia/Jakarta
app/uploads/[...path]/   Menyajikan foto unggahan dari UPLOAD_DIR
database/
  schema.sql             Skema MySQL (import lewat phpMyAdmin)
  seed-demo.sql          Data DEMO berlabel
scripts/
  buat-admin.mjs         CLI pembuat/pengatur ulang super admin
tests/
  unit/                  Vitest — logika murni
proxy.ts                 Header no-store untuk halaman admin
```

---

## 11. Catatan keamanan

Keamanan panel bertumpu pada **tiga lapis**, bukan pada URL yang sulit ditebak:

1. **Gerbang server.** `app/(admin-protected)/admin/layout.tsx` memanggil
   `requireAdmin()`, yang memverifikasi sesi lewat `getUser()` (menghubungi
   server auth, bukan membaca cookie) lalu mencocokkannya dengan baris aktif di
   `admin_users`.
2. **Pemeriksaan ulang di setiap Server Action.** Tidak ada aksi yang menumpang
   pada proteksi layout, karena Server Action dapat dipanggil langsung.
3. **Row Level Security.** Penjaga terakhir di database. Sekalipun seseorang
   memanggil Data API secara langsung dengan kunci publik, anonim hanya bisa
   membaca konten `published` dan tidak bisa menulis apa pun.

Hal lain yang diterapkan:

- Halaman login berada di route group terpisah agar pengguna yang belum masuk
  tidak terjebak loop pengalihan.
- Markdown dari admin disanitasi memakai *allowlist* pada AST
  (`rehype-sanitize`) sebelum dirender; HTML mentah tidak pernah dipercaya.
- URL pendaftaran dan dokumen wajib `https://`, divalidasi di form, di Server
  Action, dan oleh `CHECK` constraint database.
- Tautan eksternal memakai `target="_blank"` dengan `rel="noopener noreferrer"`.
- Unggahan dibatasi jenis MIME dan ukuran (5 MB) di form, Server Action, dan
  konfigurasi bucket; nama berkas dinormalkan agar aman.
- Trigger database mencegah super admin terakhir dinonaktifkan atau dihapus.
- Panel admin diberi `noindex` dan dikecualikan dari `robots.txt` serta sitemap.
- Header keamanan dasar diatur di `next.config.ts`.

---

## 12. Yang masih dibutuhkan dari pihak sekolah

Hal-hal berikut memakai placeholder dan perlu diganti sebelum rilis:

| Item | Cara mengganti |
|---|---|
| **Logo resmi Rohkris/sekolah** | Saat ini memakai ikon salib sebagai placeholder di navbar, footer, dan halaman masuk. Ganti di `components/site/Navbar.tsx`, `components/site/Footer.tsx`, dan halaman login. |
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
>>>>>>> 89f93ea (feat: initial commit for Rohkris Pelita Nusantara portal)
