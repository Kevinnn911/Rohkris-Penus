# Catatan Perbaikan Bug (Bug Tracking & Resolution)

## [HIGH] Kartu Kategori Hilang / Kosong Saat Navigasi Cepat Carousel

* **Priority:** HIGH
* **Location:** `components/site/KategoriFleksibel.tsx`
* **Severity:** High (Functional & Visual Defect)
* **Status:** Resolved (Production Ready)
* **Root Cause:**
  1. Pada implementasi carousel berbasis array statis 24 kartu (tripled list), navigasi cepat (*rapid click*) atau interupsi transisi sebelum event `transitionend` selesai menyebabkan `trackIndex` bertambah terus hingga melewati batas indeks (>= 24).
  2. Ketika `trackIndex` keluar dari batas array, seluruh kartu terdorong keluar layar (`offset < -8000px`) dan tidak ada elemen kartu yang cocok dengan slot aktif, menyebabkan area carousel tampak putih/kosong.
  3. Event `onTransitionEnd` mengalami *event bubbling* dari transisi properti CSS elemen anak (seperti `min-height`, `opacity`, `background-color`), sehingga proses teleportasi terpicu lebih awal secara prematur.
* **Solution:**
  1. Merombak struktur carousel menjadi model *Virtual Sliding Window* 7 slot `[-3, -2, -1, 0, 1, 2, 3]` berbasis `activeIndex` dengan operasi *modulo* terhadap total kategori.
  2. Menerapkan *navigation lock/throttle* (`isNavigatingRef`) dengan batas waktu cadangan (*failsafe timer*) sebesar 480ms untuk mencegah *race condition* akibat klik cepat.
  3. Menyaring `handleTransitionEnd` dengan validasi ketat `e.target === e.currentTarget`.
  4. Finalisasi state secara atomik dan bebas lonjakan (*zero-jump swap*) saat transisi selesai, menjamin kartu 100% selalu ada di layar dalam kondisi apa pun.
* **Target Deadline:** Selesai (19 Oktober 2026)

## [HIGH] Koneksi Database MySQL Gagal (connect ECONNREFUSED 127.0.0.1:3306)

* **Priority:** HIGH
* **Location:** `lib/data/public.ts`, `.env.local`
* **Severity:** High (Database Connectivity / Runtime Exception)
* **Status:** Resolved
* **Root Cause:**
  1. Service / daemon MySQL di komputer lokal (`127.0.0.1:3306`) belum dalam status aktif saat Next.js dev server berjalan dan melakukan fetching data publik (`getSiteSettings`, `events`, `news_posts`, dsb.).
  2. Laragon yang terinstal di `C:\laragon` belum dijalankan atau service MySQL di dalamnya belum di-*start*.
* **Solution:**
  1. Mengaktifkan daemon MySQL Laragon (`C:\laragon\bin\mysql\mysql-8.4.3-winx64\bin\mysqld.exe --defaults-file=C:\laragon\bin\mysql\mysql-8.4.3-winx64\my.ini`).
  2. Memverifikasi koneksi port TCP 3306 terbuka dan kredensial database `rohkris_app` di database `rohkris_dev` terhubung dengan valid.
  3. Memvalidasi endpoint publik halaman utama dan rute lainnya merespons dengan HTTP 200 tanpa galat `ECONNREFUSED`.
* **Target Deadline:** Selesai (20 Oktober 2026)

## [HIGH] Guncangan Visual Pasca-Transisi pada Carousel Kategori

* **Priority:** HIGH
* **Location:** `components/site/KategoriFleksibel.tsx`
* **Severity:** Medium (Visual Jerk / Post-Transition Animation Glitch)
* **Status:** Resolved (Production Ready)
* **Root Cause:**
  1. Pada arsitektur virtual window 7 slot sebelumnya, saat translasi fisik selesai (pada t = 500ms), fungsi penyelesaian navigasi melakukan *state swap* dengan mereset `targetSlot` kembali ke `0` dan menggeser `activeIndex`.
  2. Karena elemen DOM pada slot 0 (yang sebelumnya berstatus samping/rendah) tiba-tiba menerima kelas aktif/tinggi sementara slot 1 (yang baru saja membesar) menerima kelas samping, transisi CSS `transition-all duration-500` pada kedua elemen kartu tersebut terpicu kembali untuk kedua kalinya (*secondary transition*). Pengguna melihat pergeseran selesai diikuti oleh guncangan/tarikan ulang ukuran kartu.
  3. Container carousel tidak memiliki *min-height* yang terkunci, sehingga perbedaan tinggi kartu selama transisi dapat memicu pergeseran vertikal (*layout shift*).
* **Solution:**
  1. Mengadopsi arsitektur *Infinite Continuous Track* dengan 3 set kartu terangkai (`extendedList` = 3 x total kategori) dan indeks aktif berjangkar di set tengah.
  2. Setiap kartu mempertahankan identitas dan DOM node uniknya sendiri, sehingga kartu yang bergerak ke tengah membesar sekali dan tetap pada posisinya tanpa pernah memicu *secondary morphing* atau pertukaran data slot yang mendadak.
  3. Menerapkan *silent boundary wrap*: saat batas indeks set terlampaui, pemindahan koordinat translasi terjadi secara instan dengan `transition: none` dan `requestAnimationFrame`, sehingga tidak terjadi lonjakan visual atau kedipan.
  4. Mengunci `min-h-[18.5rem] sm:min-h-[24.5rem]` pada viewport carousel untuk mengeliminasi *layout shift* vertikal 100%.
* **Target Deadline:** Selesai (20 Oktober 2026)

## [HIGH] Guncangan Visual Khusus Transisi Batas Tab 8 ke Tab 1

* **Priority:** HIGH
* **Location:** `components/site/KategoriFleksibel.tsx`
* **Severity:** Medium (Boundary Wrap Glitch)
* **Status:** Resolved (Production Ready)
* **Root Cause:**
  1. Pada trek 3 set sebelumnya, transisi dari tab 8 ke tab 1 (`currentIndex` 15 ke 16) langsung memicu normalisasi boundary `target = curr - total` (16 ke 8) tepat saat timer 500ms berakhir.
  2. Karena kartu pada indeks 8 sebelumnya berada di luar viewport dengan skala kecil dan opasitas rendah, perpindahan `currentIndex` ke 8 memaksa kartu indeks 8 bermutasi menjadi kartu aktif. Properti CSS kartu yang memiliki durasi transisi aktif memicu animasi pembesaran mendadak dari off-screen, sehingga tampak terjadi guncangan tepat pada pergantian dari tab 8 ke tab 1.
* **Solution:**
  1. Menerapkan arsitektur *5-Set Continuous Buffer Track* (5 x total kategori) dengan titik awal di Set 2 (`currentIndex = 2 * total`).
  2. Transisi dari tab 8 ke tab 1 (indeks 23 ke 24) kini menjadi pergeseran antar-elemen tetangga fisik murni di dalam array DOM tanpa memicu reset boundary atau teleportasi koordinat sama sekali.
  3. Mematikan seluruh transisi CSS (`transition-none`) pada kontainer kartu dan sub-elemen anak saat `isTransitioning === false`, memastikan tidak ada sisa transisi CSS liar yang dapat terpicu di luar durasi aktif 500ms.
* **Target Deadline:** Selesai (20 Oktober 2026)

## [MEDIUM] Hentakan Instan (Tidak Halus) Saat Kursor Hover ke Kartu Samping Putih

* **Priority:** MEDIUM
* **Location:** `components/site/KategoriFleksibel.tsx`
* **Severity:** Medium (Visual Defect / Missing Hover Transition)
* **Status:** Resolved (Production Ready)
* **Root Cause:**
  1. Saat carousel dalam status diam (*resting / not sliding*), variabel `transitionClass` bernilai `"transition-none"` untuk menonaktifkan transisi pergeseran.
  2. Akibatnya, ketika kursor diarahkan (*hover*) ke kartu putih (`isInteractive`), perubahan gaya transformasi `hover:-translate-y-1 hover:scale-[0.91] hover:shadow-lift` langsung melompat seketika (*instant jump* 0ms) tanpa adanya interpolasi waktu CSS. Saat kursor keluar, kartu juga jatuh kembali seketika tanpa kelembutan.
* **Solution:**
  1. Menerapkan transisi bertingkat adaptif pada `cardTransition`:
     - `600ms ease-[cubic-bezier(0.16,1,0.3,1)]` saat pergeseran slide carousel aktif (`isTransitioning === true`).
     - `300ms ease-[cubic-bezier(0.16,1,0.3,1)]` saat kartu dalam keadaan diam untuk melayani efek *hover & unhover* kursor mouse secara cair.
     - `none` hanya selama 1 frame siklus normalisasi silent boundary.
  2. Mengikat efek hover dengan `group` dan `group-hover` pada kontainer kartu, badge, dan ikon sehingga seluruh sub-elemen terangkat dan bertransisi secara kompak dan elegan.
* **Target Deadline:** Selesai (20 Oktober 2026)

## [HIGH] Analisis Google PageSpeed Insights Gagal ("Tidak dapat memuat URL / Periksa validitas URL")

* **Priority:** HIGH
* **Location:** cPanel Web Server (LiteSpeed / ModSecurity / Imunify360) & `lib/env.ts` (`NEXT_PUBLIC_SITE_URL`)
* **Severity:** High (SEO & Performance Audit Blocker)
* **Status:** Identified (Action Plan Documented)
* **Root Cause:**
  1. Proteksi Firewall / WAF / Bot Shield di shared hosting cPanel IDWebHost (LiteSpeed Anti-Bot, Imunify360, atau ModSecurity) mendeteksi request otomatis dari IP pool Google Cloud / crawler Google PageSpeed Insights (Lighthouse) sebagai bot atau traffic luar negeri mencurigakan, sehingga koneksi ditolak atau dicegat verifikasi captcha/JS challenge.
  2. Variabel lingkungan `NEXT_PUBLIC_SITE_URL` belum terdefinisi secara efektif pada environment server cPanel (Node.js App), menyebabkan `app/robots.ts` dan metadata `metadataBase` menghasilkan URL kanonikal dan sitemap fallback ke `http://localhost:3000/sitemap.xml` di lingkungan produksi.
* **Solution:**
  1. Menggunakan audit performa Lighthouse langsung melalui Chrome DevTools (`F12` > Tab Lighthouse > "Analyze page load") yang berjalan di sisi klien pengguna (bukan cloud Google) sehingga terbebas dari blokir firewall server.
  2. Mengonfigurasi variabel `NEXT_PUBLIC_SITE_URL=https://rohkrissmkpenus.web.id` pada cPanel > "Setup Node.js App" lalu me-restart aplikasi.
  3. Mengajukan tiket / whitelist ke penyedia hosting (IDWebHost) untuk mengizinkan request dari Googlebot / Google PageSpeed Insights / Google Cloud IP range, atau menonaktifkan aturan ModSecurity / Anti-Bot yang memblokir Google crawler.
* **Target Deadline:** 22 Oktober 2026

## [HIGH] Tampilan Tab Browser Chrome Menampilkan Ikon Bumi Default (Favicon Hilang / 404)

* **Priority:** HIGH
* **Location:** `app/layout.tsx`, `public/`, `app/`
* **Severity:** High (Branding & Browser UI Recognition Defect)
* **Status:** Resolved (Production Ready)
* **Root Cause:**
  1. Root segment Next.js App Router belum mendefinisikan properti `icons` di dalam objek `metadata` pada `app/layout.tsx`.
  2. Direktori `public/` dan `app/` belum memiliki berkas aset favicon standar (`favicon.ico`, `icon.png`, `apple-icon.png`).
  3. Browser Google Chrome yang memuat situs web tidak menemukan tag `<link rel="icon">` dan mengalami kegagalan 404 saat melakukan direct fetching ke `/favicon.ico`, sehingga Chrome otomatis menampilkan ikon globe/bumi bawaan (*fallback default icon*).
* **Solution:**
  1. Membuat generator otomatis `scripts/generate-favicons.mjs` berbasis `sharp` untuk mengekstrak dan mengoptimalkan gambar beresolusi tinggi `Logo.png` (1.27 MB, 1254x1254px) menjadi multi-resolusi yang sangat ringan dan presisi:
     - `favicon.ico`: format multi-frame (16x16, 32x32, 48x48) dengan channel RGBA (~7.6 KB) yang kompatibel penuh dengan Turbopack compiler.
     - `icon.png`: resolusi 32x32 (~2.3 KB) untuk desktop browser tab.
     - `apple-icon.png`: resolusi 180x180 (~34 KB) untuk Apple Touch Device.
     - `icon-192.png` & `icon-512.png`: untuk manifest PWA dan Android Chrome.
     - `Logo.png` (512x512) di dalam direktori `public/`.
  2. Menempatkan berkas favicon ganda pada direktori `app/` (konvensi file-based Next.js App Router) dan `public/` (fallback akses berkas statis web server).
  3. Memperbarui `metadata.icons` pada `app/layout.tsx` dengan konfigurasi rel icon, shortcut, dan apple-touch-icon.
* **Target Deadline:** Selesai (22 Oktober 2026)

## [HIGH] Internal Server Error (500) pada Rute /admin/login di Lingkungan Produksi cPanel

* **Priority:** HIGH
* **Location:** `proxy.ts`, `app/admin/gate/[key]/route.ts`
* **Severity:** High (Crash / 500 Internal Server Error)
* **Status:** Resolved (Production Ready)
* **Root Cause:**
  1. Pada `proxy.ts`, baris `const response = NextResponse.next({ request });` menyertakan argumen `{ request }` yang tidak valid. Di lingkungan standalone Node.js produksi cPanel, Next.js memeriksa `request.headers` dan melempar eksepsi fatal `Error: request.headers must be an instance of Headers`.
  2. `proxy.ts` mengimpor `lib/auth/gate-crypto.ts` yang memuat dependensi modul bawaan Node.js (`node:crypto`) dan `lib/env.ts`, yang dapat memicu crash runtime pada eksekusi proxy Next.js.
  3. Akibat unhandled error pada fungsi `proxy`, seluruh permintaan HTTP yang cocok dengan pola matcher `["/admin", "/admin/:path*"]` langsung terhenti dan menyajikan pesan teks `Internal Server Error` (status 500).
* **Solution:**
  1. Menyederhanakan `proxy.ts` menjadi *zero-dependency*: menghapus impor `node:crypto` dan modul eksternal.
  2. Memperbaiki pemanggilan `NextResponse.next()` tanpa argumen invalid sehingga berjalan mulus tanpa error.
  3. Mengalihkan parameter kueri `?key=...` langsung ke Route Handler `/admin/gate/:key` via `NextResponse.redirect`. Route Handler berjalan di runtime Node.js penuh dan bertugas memvalidasi kunci serta menyetel cookie HttpOnly `rohkris_admin_gate` secara aman.
  4. Memvalidasi bahwa akses tanpa kunci ke `/admin/login` mengembalikan status 404 (Halaman Tidak Ditemukan) secara bersih, sementara akses dengan kunci valid menyetel cookie dan membuka halaman form login (HTTP 200).
* **Target Deadline:** Selesai (22 Oktober 2026)
## [HIGH] Galat RangeError WebAssembly Out of Memory saat npm run build di Terminal cPanel & Broken Symlinks Standalone

* **Priority:** HIGH
* **Location:** Terminal cPanel (`/home/pvote/rohkris`), `.next/standalone`, `scripts/pack-standalone.mjs`
* **Severity:** High (Build Failure & Production 500 Error)
* **Status:** Resolved (Production Ready)
* **Root Cause:**
  1. Batasan memori CloudLinux pada shared hosting cPanel (`vmi2435571`) membatasi alokasi memori WebAssembly, sehingga eksekusi `npm run build` langsung memicu `unhandledRejection RangeError: WebAssembly.instantiate(): Out of memory: Cannot allocate Wasm memory for new instance`.
  2. Saat build standalone dikompilasi pada workstation Windows, Next.js / Turbopack membuat symlink berkas untuk modul `mysql2-3d80281e5ed34ca6` yang merujuk ke path absolut Windows (`C:\Best Project\Rohkris\node_modules\mysql2`). Ketika diekstrak di server Linux cPanel, symlink tersebut rusak (*broken link*) sehingga runtime Node.js gagal memuat modul `mysql2/promise` (Error: Cannot find module).
  3. Berkas `server.js` dan manifes `required-server-files.json` memuat path absolut Windows yang tidak dikenali pada struktur filesystem Linux cPanel (`/home/pvote/rohkris`).
* **Solution:**
  1. Membuat skrip otomatis `scripts/pack-standalone.mjs` yang melakukan dereference pada seluruh symlink menjadi berkas fisik riil, menyematkan folder `mysql2` lengkap pada seluruh jalur resolusi `node_modules` internal Next.js.
  2. Menormalisasi path absolut Windows (`C:\Best Project\Rohkris`) menjadi path Linux cPanel (`/home/pvote/rohkris`) pada `server.js` dan berkas manifes server.
  3. Memastikan seluruh route module dinamis (`/admin/gate/[key]`, `/kegiatan`) dan chunk server disalin lengkap ke `.next/standalone/.next/server`.
  4. Mengompresi seluruh paket siap pakai menjadi `rohkris-next.zip` (17.80 MB) menggunakan utilitas `tar.exe` bawaan, termasuk trigger restart LiteSpeed Passenger `tmp/restart.txt`.
* **Target Deadline:** Selesai (22 Oktober 2026)

## [HIGH] Internal Server Error (500) pada Rute Dinamis /kegiatan dan /admin/login Akibat Modul Hash Turbopack mysql2

* **Priority:** HIGH
* **Location:** `package.json` (build script), `lib/env.ts`, `scripts/pack-build.ps1`
* **Severity:** High (Crash / 500 Internal Server Error & Security Hardening)
* **Status:** Resolved (Production Ready)
* **Root Cause:**
  1. Kompilasi build Next.js 16 menggunakan Turbopack secara default menghasilkan chunk server yang memuat dependensi database melalui nama modul ber-hash (`require("mysql2-3d80281e5ed34ca6/promise")`). Modul ini hanya tersedia di direktori temporer `.next/node_modules/` dan bergantung pada symlink sistem berkas Windows yang patah/tidak terbaca saat diekstrak di server Linux CloudLinux cPanel.
  2. Saat rute dinamis SSR dieksekusi (`/kegiatan` memuat `searchParams` dan `/admin/login` membaca cookie), modul `mysql2` gagal dimuat sehingga memicu eksepsi `Failed to load external module mysql2-3d80281e5ed34ca6/promise` dan mengembalikan respons HTTP 500 Internal Server Error.
  3. Terdapat fallback default kunci admin yang di-hardcode pada fungsi `getAdminSecretKey()` di `lib/env.ts` dan tercantum di `.env.example`, yang berpotensi membuka gerbang login tanpa perlindungan jika environment variable tidak diisi.
  4. Skrip pemaketan lama memakai `Compress-Archive` yang menghasilkan path berkas ber-backslash (`\`) Windows dan mengemas seluruh folder `.next`, bukan hanya folder `.next/standalone`.
* **Solution:**
  1. Mengubah script `build` pada `package.json` menjadi `next build --webpack` untuk memastikan webpack bundler menghasilkan pemanggilan modul polos `require("mysql2/promise")` dari `.next/standalone/node_modules/mysql2`.
  2. Menghapus fallback kunci rahasia di `lib/env.ts` sehingga sistem menolak akses secara mutlak (*fail-closed*) apabila `ADMIN_SECRET_KEY` tidak dikonfigurasi.
  3. Menghapus rute `app/api/debug-status/route.ts` dan direktori `app/api/`.
  4. Menulis ulang `scripts/pack-build.ps1` menggunakan `tar.exe` bawaan dengan forward slash (`/`), hanya mengemas `.next/standalone` beserta folder `static` dan `public`, serta mengabaikan berkas kredensial, `.env*`, storage, dan tests.
  5. Memvalidasi dengan pengujian unit Vitest (72 test lolos), `npm run typecheck`, `npm run lint`, dan pengujian curl lokal pada standalone server port HTTP production (status 200 untuk `/`, `/kegiatan`, 404 untuk `/admin/login` tanpa kunci, dan 307 ke `/` jika kunci tidak valid).
* **Target Deadline:** Selesai (22 Oktober 2026)

## [HIGH] Pengalihan Gerbang Admin Mengarah ke 0.0.0.0:3000 (ERR_ADDRESS_INVALID) Akibat Reverse Proxy Passenger

* **Priority:** HIGH
* **Location:** `proxy.ts`, `app/admin/gate/[key]/route.ts`
* **Severity:** High (Access Blocker / ERR_ADDRESS_INVALID)
* **Status:** Resolved (Production Ready)
* **Root Cause:**
  1. Pada lingkungan hosting cPanel yang dijalankan via Phusion Passenger / LiteSpeed reverse proxy, daemon Node.js terikat pada socket internal `0.0.0.0:3000`. Nilai `request.url` pada NextRequest membawa origin internal tersebut.
  2. Pemanggilan `new URL("/admin/login", request.url)` pada Route Handler dan proxy Next.js menghasilkan URL mutlak `https://0.0.0.0:3000/admin/login` pada header `Location`.
  3. Browser klien yang menerima pengalihan tersebut gagal membuka halaman dengan error `ERR_ADDRESS_INVALID` karena alamat IP `0.0.0.0` bukan alamat tujuan yang valid untuk navigasi peramban.
* **Solution:**
  1. Membuat fungsi utilitas `getPublicOrigin(request)` pada `proxy.ts` dan `app/admin/gate/[key]/route.ts` yang membaca `x-forwarded-host`, `host`, dan `x-forwarded-proto`.
  2. Menolak host jika mengandung `0.0.0.0` dan otomatis mengalihkannya ke domain publik resmi (`process.env.NEXT_PUBLIC_SITE_URL` atau fallback `"https://rohkrissmkpenus.web.id"`).
  3. Memvalidasi bahwa seluruh redirect gerbang admin mengembalikan `Location: https://rohkrissmkpenus.web.id/admin/login`, bukan `0.0.0.0`.
* **Target Deadline:** Selesai (22 Oktober 2026)


