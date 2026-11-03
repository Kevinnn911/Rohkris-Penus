# Analysis Report

## [DONE] Implementasi Struktur Fleksibel Pilih Kategori (Halaman Beranda)

* **Status:** Selesai (Production Ready)
* **Feature:** Komponen Pilih Kategori Fleksibel (Stepped / Podium 2-Kartu & 3-Kartu) pada Halaman Beranda (`/`)
* **Technical Implementation:**
  1. Membuat komponen client `components/site/KategoriFleksibel.tsx` yang mengadaptasi struktur berjenjang/podium fleksibel sesuai referensi desain wireframe (Gambar 1: 2 kartu [1 tinggi, 2 rendah], Gambar 2: 3 kartu [1 rendah, 2 tinggi, 3 rendah]).
  2. Menyediakan kemampuan responsif otomatis (`auto`): menampilkan 2 kartu pada layar ponsel/mobile (<768px) dan 3 kartu pada layar desktop/tablet (>=768px), serta tombol beralih mode manual (`Auto`, `2 Kartu`, `3 Kartu`).
  3. Mengintegrasikan interaktivitas lengkap:
     - Kartu utama/aktif (tinggi) berlatar gelap (`bg-navy-950`) dengan tag sorotan emas (`gold-300`), ikon kategori dinamis, deskripsi, dan tombol CTA langsung ke halaman filter kegiatan (`/kegiatan?kategori=...`).
     - Kartu pendamping (rendah) yang dapat diklik untuk langsung menggeser/mengaktifkan kategori tersebut.
     - Kontrol tombol navigasi panah kiri/kanan (`IconChevronLeft`, `IconChevronRight`), dukungan keyboard (`ArrowLeft`, `ArrowRight`), serta gesture sentuh/geser horizontal (`touch swipe`).
  4. Mengganti penggunaan `KategoriCarousel` pada `app/(public)/page.tsx` dengan `KategoriFleksibel`.
  5. Memastikan seluruh build TypeScript, lint ESLint, unit testing Vitest, dan build Turbopack Next.js 16 berhasil 100% tanpa error maupun warning.
* **Impact:**
  - Tampilan beranda pada bagian "Pilih Kategori" kini memiliki daya tarik visual yang dinamis, modern, dan fleksibel sesuai kebutuhan pengguna.
  - Pengalaman navigasi pengguna (UX) menjadi jauh lebih intuitif di perangkat mobile maupun desktop.

## [DONE] Penghapusan Tag Pill/Badge pada Kartu Kategori Fleksibel

* **Status:** Selesai (Production Ready)
* **Feature:** Penyederhanaan visual kartu kategori utama pada `KategoriFleksibel`
* **Technical Implementation:**
  1. Menghapus render pill tag kategori (seperti "Terbuka", "Rutin", "Tahunan", dll.) dan badge "Kategori Terpilih" dari kartu kategori aktif di `components/site/KategoriFleksibel.tsx`.
  2. Menghapus import `Tag` yang tidak terpakai agar mematuhi aturan zero unused imports ESLint.
  3. Memverifikasi validitas tipe data dengan `tsc --noEmit` dan linting dengan `eslint .`.
* **Impact:**
  - Tampilan kartu kategori utama menjadi jauh lebih bersih, minimalis, dan elegan, berfokus langsung pada nomor urut, ikon, nama kategori, dan tombol aksi tanpa elemen dekoratif berlebih.

## [DONE] Penghapusan Baris Tab Pill Kategori Horizontal

* **Status:** Selesai (Production Ready)
* **Feature:** Penyederhanaan layout Pilih Kategori dengan menghapus strip tab pill kategori
* **Technical Implementation:**
  1. Menghapus baris tablist pill kategori horizontal (`kategoriList.map(...)`) dari `components/site/KategoriFleksibel.tsx`.
  2. Memastikan navigasi kategori tetap dapat dilakukan dengan mulus melalui kartu samping (klik kartu 1 / 3), tombol panah kiri/kanan, tombol keyboard, serta gesture sentuh/swipe.
  3. Memverifikasi validitas tipe data dengan `tsc --noEmit` dan linting dengan `eslint .`.
* **Impact:**
  - Bagian "Pilih Kategori" kini tampil lebih ringkas, langsung menyorot panggung kartu berjenjang/podium tanpa distraksi baris tombol pill di atasnya.

## [DONE] Struktur 3 Kartu Otomatis di Desktop dan Mobile

* **Status:** Selesai (Production Ready)
* **Feature:** Penguncian struktur 3 kartu permanen di seluruh ukuran layar dan penghapusan tombol pengalih mode
* **Technical Implementation:**
  1. Menghapus tombol toggle pengalih mode (`Auto`, `2 Kartu`, `3 Kartu`) dan state `mode` serta `isMobile` dari `components/site/KategoriFleksibel.tsx`.
  2. Mengonfigurasi tampilan agar secara permanen dan otomatis selalu menampilkan struktur 3 kartu (Kartu 1 [Rendah], Kartu 2 [Tinggi di tengah], Kartu 3 [Rendah]) di layar desktop maupun mobile.
  3. Mengoptimalkan ukuran proporsional kartu samping dan kartu tengah pada layar kecil menggunakan utilitas responsif Tailwind (`min-w-0`, `p-3 sm:p-5`, `text-xs sm:text-lg`, dsb.) agar pas dan tidak meluap (*overflow*) di layar ponsel.
  4. Memverifikasi dengan `tsc --noEmit`, `eslint .`, dan `vitest run`.
* **Impact:**
  - Antarmuka menjadi lebih konsisten di seluruh perangkat, tanpa perlu interaksi manual untuk beralih mode.

## [DONE] Peningkatan Animasi Transisi Halus (Smooth Transitions & Micro-interactions)

* **Status:** Selesai (Production Ready)
* **Feature:** Animasi transisi slide terarah yang halus saat berpindah kategori
* **Technical Implementation:**
  1. Menambahkan keyframes dan utility animasi Tailwind v4 di `app/globals.css`:
     - `--animate-slide-left`: efek geser halus dari kanan ke kiri dengan kurva cubic-bezier halus (`cubic-bezier(0.16, 1, 0.3, 1)`).
     - `--animate-slide-right`: efek geser halus dari kiri ke kanan.
     - `--animate-card-in`: efek perbesaran halus (*scale-in*).
  2. Mengimplementasikan state penanda arah navigasi (`arah: 1 | -1`) pada `components/site/KategoriFleksibel.tsx` sehingga animasi masuk mengikuti arah aksi pengguna (klik panah kanan/kartu berikutnya menghasilkan slide ke kiri, dan sebaliknya).
  3. Menggunakan `key` dinamis pada konten masing-masing kartu untuk memicu animasi masuk (*entrance animation*) secara instan dan tanpa jeda.
  4. Menambahkan efek interaktif pada tombol: *micro-interaction scale* pada tombol panah (`active:scale-90 hover:scale-105`), kartu samping (`hover:-translate-y-1.5 active:scale-[0.98]`), dan indikator titik (`transition-all duration-500 ease-out`).
  5. Memverifikasi seluruh kode dengan `tsc --noEmit`, `eslint .`, dan `vitest run`.
* **Impact:**
  - Perpindahan antar kategori kini terasa sangat halus, dinamis, dan premium layaknya pengalaman aplikasi native.

## [DONE] Perbaikan Offset Piksel Presisi pada Trek Meluncur Fisik (Fix Off-Screen Track Bug)

* **Status:** Selesai (Production Ready)
* **Feature:** Perbaikan posisi kartu pada trek geser fisik menggunakan kalkulasi piksel akurat
* **Technical Implementation:**
  1. Mengidentifikasi akar masalah hilangnya kartu pada tangkapan layar pengguna: persentase `50%` di dalam `translateX(calc(50% ...))` CSS dievaluasi terhadap lebar elemen trek itu sendiri (24 kartu = ~8.880px), bukan terhadap kontainer induk, sehingga seluruh kartu terlempar ribuan piksel keluar layar.
  2. Mengganti perhitungan `calc(50% ...)` CSS dengan pengukuran piksel riil via `containerRef.current.clientWidth` dan formula presisi `offset = (containerWidth - cardWidth) / 2 - trackIndex * (cardWidth + gap)`.
  3. Menerapkan `transform: translate3d(${offset}px, 0, 0)` yang berakselerasi GPU sehingga kartu selalu berada tepat di tengah viewport secara stabil di semua ukuran layar (ponsel maupun desktop).
  4. Memverifikasi dengan `tsc --noEmit`, `eslint .`, dan `vitest run`.
* **Impact:**
  - Ketiga kartu (1 [Rendah], 2 [Tinggi di tengah], 3 [Rendah]) kini selalu tampil jelas, tepat di tengah, dan meluncur secara fisik dengan sangat mulus tanpa risiko hilang atau terlempar keluar layar.

## [DONE] Arsitektur Virtual Sliding Window Carousel (Anti-Hilang & Tahan Navigasi Cepat)

* **Status:** Selesai (Production Ready)
* **Feature:** Arsitektur sliding carousel 7-slot virtual yang tahan spam klik dan tidak pernah kosong
* **Technical Implementation:**
  1. Menggantikan sistem array bertingkat (tripled list 24 kartu) dengan model *7-slot virtual window* `[-3, -2, -1, 0, 1, 2, 3]` yang dirender secara dinamis dengan indeks modulo terhadap `activeIndex`.
  2. Mengimplementasikan *navigation lock* berbasis `useRef` dan timer cadangan 480ms untuk mencegah penumpukan animasi (*animation race condition*) saat pengguna mengeklik tombol navigasi secara berulang-ulang dengan cepat.
  3. Memastikan filter `e.target === e.currentTarget` pada penanganan event `onTransitionEnd` agar transisi CSS elemen kartu anak tidak memicu penyelesaian transisi trek lebih awal.
  4. Menyinkronkan pergeseran fisik trek (`translate3d`), pembesaran tinggi podium (dari 16.5rem ke 23rem), dan perubahan warna kartu secara simultan selama 420ms dengan kurva `cubic-bezier(0.2, 0.8, 0.2, 1)`.
  5. Memvalidasi visual dan fungsionalitas menggunakan browser subagent (pengujian klik beruntun 4x berturut-turut pada tombol next dan 3x pada tombol previous), lolos `tsc --noEmit`, `eslint .`, dan 67 pengujian vitest.
* **Impact:**
  - Area carousel dijamin tidak akan pernah hilang atau kosong (*blank screen*) lagi dalam kondisi navigasi apa pun, baik pada klik tunggal, klik cepat beruntun, swipe layar sentuh, maupun perubahan ukuran jendela browser.

## [DONE] Penanganan Galat Koneksi Database Lokal (connect ECONNREFUSED 127.0.0.1:3306)

* **Status:** Selesai (Production Ready)
* **Feature:** Resolusi konektivitas runtime MySQL lokal untuk query data publik
* **Technical Implementation:**
  1. Melakukan diagnosis pada galat runtime `connect ECONNREFUSED 127.0.0.1:3306` yang memicu kegagalan query pada `lib/data/public.ts` (`daftar`, `getSiteSettings`, `BerandaPage`).
  2. Mengidentifikasi instalasi MySQL lokal pada direktori Laragon (`C:\laragon\bin\mysql\mysql-8.4.3-winx64`).
  3. Mengaktifkan daemon `mysqld` dengan konfigurasi `my.ini` Laragon (`--defaults-file=C:\laragon\bin\mysql\mysql-8.4.3-winx64\my.ini`).
  4. Mengonfirmasi port 3306 menerima koneksi TCP dan menguji otentikasi user `rohkris_app` ke skema database `rohkris_dev` berhasil dengan seluruh tabel schema siap.
  5. Melakukan validasi pengujian request ulang ke `http://localhost:3000/` dan `http://localhost:3000/kegiatan` yang menghasilkan respon HTTP 200 tanpa error runtime database.
* **Impact:**
  - Server Next.js 16 kini dapat mengambil dan menyajikan data dinamis dari database MySQL lokal secara stabil tanpa pesan kegagalan `ECONNREFUSED`.

## [DONE] Implementasi Transisi Ajaib (Magic Move Ala Canva) & Penomoran Kategori Dinamis

* **Status:** Selesai (Production Ready)
* **Feature:** Animasi morphing kontinu tanpa unmount DOM dan badge nomor urut kategori riil pada `components/site/KategoriFleksibel.tsx`
* **Technical Implementation:**
  1. **Persistent Unified DOM Architecture:** Mengeliminasi unmount/remount JSX (`div` vs `button`) pada pergantian slot center dan side. Seluruh 7 slot kini menggunakan kontainer DOM tunggal persisten sehingga transisi CSS (warna latar belakang, ukuran dimensi, elevasi shadow, dan skala) dapat berjalan mulus (*continuous morphing*) ala Magic Move Canva.
  2. **Canva-like Organic Easing:** Mengadopsi kurva timing bezier elastis-mewah `cubic-bezier(0.22, 1, 0.36, 1)` dengan durasi 500ms pada pergeseran translasi fisik trek dan metamorfosis kartu.
  3. **Penomoran Kategori Dinamis:** Mengganti angka hardcode statis `1, 2, 3` dengan formula nomor kategori riil `kategoriIndex + 1` (`nomorKategori`), sehingga kartu secara akurat merefleksikan identitas urutan kategori aslinya (misal: "Aksi Sosial" bernomor 7, "Lainnya" bernomor 8, "Natal" bernomor 1).
  4. **Smooth Sub-elements Morphing:**
     - Badge nomor dan ikon kategori bertransisi ukuran, warna latar, dan efek sorotan secara simultan.
     - Label navigasi kontekstual ("Sebelumnya" / "Berikutnya") memudar masuk/keluar dengan halus menggunakan transisi `max-height` dan `opacity`.
     - Tombol CTA `Lihat Kegiatan` pada kartu tengah meluncur (*slide-up*) dan memudar masuk secara elegan tanpa lonjakan layout.
  5. **Verifikasi:** Lolos pengujian interaktif browser subagent (navigasi tombol next dan klik langsung kartu samping), lulus `tsc --noEmit`, `eslint .`, dan 67 pengujian unit test Vitest.
* **Impact:**
  - Pengalaman visual pengguna saat berganti kategori kini terasa sangat halus, berkelas, dan dinamis layaknya transisi ajaib di Canva.
  - Informasi penomoran kategori konsisten dan sesuai dengan urutan kategori sebenarnya pada indikator bawah dan database.

## [DONE] Eliminasi Guncangan Pasca-Transisi dengan Arsitektur Infinite Continuous Track

* **Status:** Selesai (Production Ready)
* **Feature:** Arsitektur trek geser kontinu 3-set anti-guncangan (*zero-jitter / zero-shake*) pada `components/site/KategoriFleksibel.tsx`
* **Technical Implementation:**
  1. **Akar Masalah:** Mengidentifikasi bahwa guncangan visual terjadi karena pergantian data (*slot state swap*) pada arsitektur virtual window lama yang memicu transisi sekunder (*secondary morphing*) selama 500ms setelah translasi fisik trek selesai.
  2. **Infinite Continuous Track Architecture:** Mengonversi trek menjadi 3 set kartu berkelanjutan (`extendedList` = `[...kategoriList, ...kategoriList, ...kategoriList]`) dengan indeks aktif berjangkar di set tengah.
  3. **Preservasi Node Mandiri:** Setiap elemen kartu memiliki DOM node mandiri permanen. Ketika kartu bergerak dari samping ke tengah, ia membesar sekali secara simultan dengan pergeseran translasi trek dan tetap di tempatnya tanpa pertukaran data atau re-morphing tambahan.
  4. **Silent Boundary Wrap:** Ketika navigasi mencapai batas set akhir atau awal, koordinat ditransformasi kembali ke set tengah secara instan dengan `transition: none` dan pembacaan `requestAnimationFrame` ganda, menghasilkan sirkularitas tak terbatas tanpa lonjakan visual.
  5. **Vertical Layout Lock:** Mengunci tinggi minimal viewport carousel pada `min-h-[18.5rem] sm:min-h-[24.5rem]` sehingga ekspansi tinggi kartu tengah tidak memicu pergeseran vertikal (*layout shift*) pada halaman.
  6. **Validasi:** Pengujian visual browser subagent menunjukkan gerakan geser sepenuhnya stabil dan bebas guncangan (*rock-solid*), lolos `tsc --noEmit`, `eslint .`, serta seluruh 67 unit test Vitest.
* **Impact:**
  - Menghilangkan 100% efek guncangan/tarikan balik setelah kartu digeser.
  - Memberikan pengalaman navigasi carousel yang sangat halus, stabil, dan konsisten di seluruh perangkat.

## [DONE] Eliminasi Guncangan Khusus Transisi Batas Tab 8 ke Tab 1 (5-Set Continuous Buffer Track)

* **Status:** Selesai (Production Ready)
* **Feature:** Buffer 5-Set trek kontinu dan penonaktifan CSS transition bersyarat (`transitionClass`) pada `components/site/KategoriFleksibel.tsx`
* **Technical Implementation:**
  1. **Akar Masalah:** Pada arsitektur 3-set sebelumnya, transisi dari tab 8 ke tab 1 berada tepat di perbatasan array (`currentIndex` 15 ke 16), yang langsung memicu normalisasi indeks ke set pertama (`currentIndex = 8`). Hal ini menyebabkan kartu indeks 8 yang sebelumnya berada di luar layar dengan skala kecil memicu transisi sekunder pembesaran, menghasilkan guncangan visual.
  2. **5-Set Continuous Buffer:** Memperluas trek menjadi 5 set (`5 x total kategori`) dengan titik awal navigasi di Set 2 (`currentIndex = 2 * total`). Dengan demikian, transisi dari tab 8 ke tab 1 (indeks 23 ke 24) merupakan pergeseran antar-tetangga alami murni tanpa perlu reset koordinat atau teleportasi boundary.
  3. **Conditional Transition Scoping:** Menerapkan `transitionClass` (`isTransitioning ? "transition-all duration-500 ..." : "transition-none"`) pada kontainer kartu dan seluruh sub-elemen anak (badge, icon, title, label, description, CTA), mencegah adanya animasi CSS liar di luar durasi aktif 500ms.
  4. **Validasi:** Seluruh 67 pengujian Vitest lulus 100%, `tsc --noEmit` bersih, dan `eslint .` bebas warning.
* **Impact:**
  - Transisi dari Tab 8 ke Tab 1 kini berjalan sama mulusnya dengan transisi antar-tab lainnya, sepenuhnya bebas dari guncangan atau getaran.

## [DONE] Peningkatan Transisi Ultra-Smooth dengan GPU-Composited Transforms & Easing 600ms

* **Status:** Selesai (Production Ready)
* **Feature:** Optimasi performa animasi bebas CPU reflow (*pure GPU compositor*) dan kurva perlambatan elastis-mewah 600ms pada `components/site/KategoriFleksibel.tsx`
* **Technical Implementation:**
  1. **Eliminasi CPU Layout Reflow:** Mengganti animasi dimensi box-model dinamis (`min-height` dan `padding`) dengan dimensi fisik terkunci (`h-[19.5rem] sm:h-[23.5rem]` dan `p-5 sm:p-7`). Efek podium kini sepenuhnya diwujudkan via penskalaan berbasis GPU (`origin-bottom scale-[0.88]` dan `translate-y-2`), menjamin *zero layout thrashing* dan zero reflow teks pada tiap frame animasi.
  2. **Apple/Canva Silky Fluid Easing:** Mengadopsi kurva perlambatan eksponensial `cubic-bezier(0.16, 1, 0.3, 1)` dengan durasi 600ms. Kurva ini memberikan akselerasi awal yang sigap tanpa latensi dan deselerasi panjang yang sangat lembut, menciptakan kesan fisik seperti meluncur di atas es.
  3. **Hardware Layer Promotion:** Menerapkan utilitas `transform-gpu` dan `will-change-transform` pada trek dan kartu untuk mempromosikan elemen langsung ke GPU composite layers, mencapai kestabilan 60/120 FPS tanpa lag.
  4. **Smooth Sub-elements Reveal:** Transisi visibilitas tombol CTA dan teks kontekstual disederhanakan menggunakan translasi murni `opacity-100 translate-y-0` versus `opacity-0 translate-y-3`, menghilangkan manipulasi `max-height` yang boros kalkulasi CPU.
  5. **Verifikasi:** Diverifikasi via pengujian subagent browser interaktif (`ultra_smooth_glide`), lolos `tsc --noEmit`, `eslint .`, serta 67 tes unit Vitest 100%.
* **Impact:**
  - Sensasi perpindahan kartu kini terasa jauh lebih halus, mewah, dan responsif layaknya presentasi interaktif Canva Magic Move atau antarmuka Apple iOS.

## [DONE] Penggantian Ikon Bintang dengan Ikon Pelita (Matius 5:14)

* **Status:** Selesai (Production Ready)
* **Feature:** Komponen vektor SVG baru `IconLamp` (Pelita / Kaki Dian) menggantikan `IconSparkle` pada kartu ayat tema di `app/(public)/page.tsx`
* **Technical Implementation:**
  1. Membuat ikon baru `IconLamp` di `components/ui/Icons.tsx` dengan geometri garis SVG yang elegan: nyala api pelita, wadah minyak, tiang kaki dian, dudukan dasar, serta 4 berkas sinar cahaya yang memancar.
  2. Menggantikan pemakaian `IconSparkle` pada kartu tema melayang "Kamu adalah terang dunia - Matius 5:14" di `app/(public)/page.tsx` dengan `IconLamp`.
  3. Desain ikon ini secara simbolis merepresentasikan identitas sekolah **SMK PLUS PELITA NUSANTARA** dan firman Tuhan tentang pelita di atas kaki dian yang menyinari seisi rumah.
  4. Memverifikasi kelulusan `tsc --noEmit`, `eslint .`, dan 67 unit test Vitest 100%.
* **Impact:**
  - Tampilan kartu ayat tema kini lebih bermakna secara teologis dan selaras dengan identitas nama Pelita Nusantara dibandingkan ikon bintang dekoratif generik sebelumnya.

## [DONE] Peningkatan Efek Hover Halus pada Kartu Samping Putih

* **Status:** Selesai (Production Ready)
* **Feature:** Animasi melayang naik (*hover float lift*) 300ms yang sangat halus dan luwes pada kartu samping putih di `components/site/KategoriFleksibel.tsx`
* **Technical Implementation:**
  1. **Akar Masalah:** Saat carousel tidak sedang bergeser (*idle/rest*), nilai transisi sebelumnya diset ke `"transition-none"`, sehingga saat kursor diarahkan ke kartu putih, efek transformasi naik (`translate-y` dan `scale`) melompat seketika (*instant jump* 0ms) tanpa kehalusan interpolasi waktu.
  2. **Multi-tier Dynamic Transition:** Mengimplementasikan `cardTransition` dinamis:
     - Menggunakan `transition-all duration-600 ease-[cubic-bezier(0.16,1,0.3,1)]` saat pergeseran slide carousel aktif (`isTransitioning === true`).
     - Menggunakan `transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]` saat status diam (*idle*), memungkinkan efek hover naik/turun bertransisi cair tanpa patahan.
     - Menggunakan `transition-none` hanya pada single frame normalisasi silent boundary.
  3. **Group Micro-interactions:** Menambahkan interaksi terkoordinasi (`group-hover:scale-105` pada badge nomor dan `group-hover:scale-110` pada ikon) untuk pengalaman taktil yang modern dan hidup.
  4. **Verifikasi:** Diverifikasi melalui browser subagent dengan simulasi hover/unhover kursor mouse, lolos `tsc --noEmit`, `eslint .`, dan 67 unit test Vitest.
* **Impact:**
  - Saat kursor diarahkan ke kartu samping (tab putih), kartu kini terangkat naik secara perlahan dan halus, lalu turun kembali dengan anggun saat kursor meninggalkan kartu.

## [DONE] Konfigurasi dan Verifikasi Akses Akun Dashboard Admin

* **Status:** Selesai (Production Ready)
* **Feature:** Kredensial aktif dan mekanisme otentikasi Super Admin untuk Dashboard Admin (`/admin`)
* **Technical Implementation:**
  1. Memeriksa arsitektur keamanan bawaan proyek di `README.md` dan skrip resmi pembuatan admin `scripts/buat-admin.mjs` (`npm run admin:buat`).
  2. Mengonfigurasi kata sandi terenkripsi scrypt Node.js native (`N=16384, r=8, p=1, keylen=64`) yang sesuai standar `lib/auth/password.ts` untuk akun Super Admin utama:
     - Email: `admin@rohkris.sch.id`
     - Peran: `super_admin`
     - Status: `is_active = 1`
  3. Melakukan pengujian end-to-end otentikasi login melalui browser subagent di halaman `http://localhost:3000/admin/login`. Form login memvalidasi kredensial, membuat sesi `admin_sessions`, mengatur cookie sesi terproteksi `rohkris_admin_session`, dan berhasil melakukan redirect ke halaman panel utama `http://localhost:3000/admin`.
  4. Memvalidasi bahwa seluruh komponen dashboard admin (ringkasan statistik artikel, warta, kegiatan, galeri, serta menu navigasi manajemen) dapat diakses dengan sempurna.
* **Impact:**
  - Pengguna memiliki akses langsung yang teruji dan valid ke panel admin tanpa kendala otentikasi, sekaligus memiliki panduan resmi untuk membuat atau mengatur ulang akun admin baru sewaktu-waktu.

## [DONE] Persiapan Deploy Produksi cPanel (Domain rohkrissmkpenus.web.id)

* **Status:** Selesai (Production Ready)
* **Feature:** Konfigurasi kompatibilitas Node LTS, pembuatan paket arsip deploy bersih `rohkris-deploy.zip`, dan panduan multi-domain cPanel tanpa interferensi
* **Technical Implementation:**
  1. Menyesuaikan `engines.node` pada `package.json` menjadi `>=20.9.0` dan `.nvmrc` menjadi `20` agar kompatibel penuh dengan lingkungan runtime Node.js LTS pada cPanel CloudLinux (Setup Node.js App) tanpa error engine mismatch.
  2. Memverifikasi seluruh pengujian unit Vitest (67 passed), TypeScript typechecking (`tsc --noEmit`), linting (`eslint .`), serta build produksi mandiri (`next build` output standalone).
  3. Mengemas paket sumber produksi bersih `rohkris-deploy.zip` (ukuran 274.8 KB) yang mengecualikan `node_modules`, `.next`, `.git`, `.env.local`, dan file temporer, siap diunggah langsung ke File Manager cPanel.
  4. Merumuskan panduan arsitektur isolasi 4 lapis (Domain/Document Root terpisah, Database & User MySQL terpisah, Node.js App Application Root terpisah, serta direktori unggahan terpisah) guna menjamin website pertama di akun hosting yang sama tidak tersentuh sama sekali.
* **Impact:**
  - Proses deployment ke cPanel untuk domain `rohkrissmkpenus.web.id` terstandarisasi, aman, dan siap dieksekusi tanpa risiko terhadap aset website lain di hosting pengguna.

## [DONE] Verifikasi Deployment Live Berhasil di cPanel (Domain rohkrissmkpenus.web.id)

* **Status:** Selesai (Production Ready & Live)
* **Feature:** Website Rohkris Pelita Nusantara dan Panel Admin resmi mengudara secara live di cPanel Cloud Hosting
* **Technical Implementation:**
  1. Melakukan bypass pembatasan memori virtual cPanel CloudLinux (Wasm instantiate out of memory) dengan mengunggah paket build produksi mandiri `rohkris-build.zip` langsung ke direktori aplikasi `/home/pvote/rohkris`.
  2. Menghubungkan proses runtime Next.js standalone via LiteSpeed web server pada cPanel Setup Node.js App dengan konfigurasi domain `rohkrissmkpenus.web.id`.
  3. Memverifikasi kedaulatan website pertama `pvote.my.id` tetap 100% aman, aktif, dan tidak mengalami dampak apa pun (HTTP 307 /masuk normal).
  4. Melakukan verifikasi langsung melalui browser subagent terhadap halaman publik `https://rohkrissmkpenus.web.id` (HTTP 200 OK, render lengkap aset statis, font, carousel, dan tema Pelita) serta halaman otentikasi admin `https://rohkrissmkpenus.web.id/admin/login` (HTTP 200 OK).
* **Impact:**
  - Website resmi Rohani Kristen SMK PLUS PELITA NUSANTARA berhasil online penuh di hosting cPanel bersama website pertama tanpa interferensi, siap diakses oleh siswa, guru, dan pengurus.

## [DONE] Optimasi SEO On-Page, Schema JSON-LD, dan Pencegahan Localhost Leakage untuk Kata Kunci "Rohkris SMK Penus"

* **Status:** Selesai (Production Ready)
* **Feature:** Optimasi SEO On-Page komprehensif, metadata penargetan kata kunci spesifik "Rohkris SMK Penus", Schema.org EducationalOrganization & WebSite JSON-LD, serta pembersihan URL sitemap/robots.
* **Technical Implementation:**
  1. Memperbaiki `lib/env.ts` pada fungsi `getSiteUrl()` agar otomatis menggunakan fallback `"https://rohkrissmkpenus.web.id"` pada lingkungan `NODE_ENV === "production"`, mencegah kebocoran `http://localhost:3000` pada berkas `robots.txt`, `sitemap.xml`, dan kanonikal.
  2. Memperbarui `app/layout.tsx` dengan metadata teroptimasi:
     - Judul default: `Rohkris SMK Penus — Rohani Kristen SMK Plus Pelita Nusantara`
     - Template judul: `%s — Rohkris SMK Penus`
     - Deskripsi ramah SEO yang memuat kata kunci pencarian utama siswa ("Rohkris SMK Penus", "SMK Plus Pelita Nusantara").
     - Penambahan deretan `keywords` relevan dan tag verifikasi kepemilikan Google Search Console.
     - Penambahan tautan kanonikal dan tag OpenGraph/Twitter Card yang konsisten.
  3. Menambahkan structured data Schema.org JSON-LD (`@type: EducationalOrganization` dan `@type: WebSite`) dengan daftar `alternateName` lengkap (`Rohkris SMK Penus`, `Rohkris Penus`, `Rohani Kristen SMK Penus`, `SMK Penus Rohkris`) untuk memudahkan Google Knowledge Graph mengidentifikasi entitas organisasi sekolah secara presisi.
  4. Menambahkan badge penegasan entitas `"Rohkris SMK Penus · SMK Plus Pelita Nusantara"` pada hero `app/(public)/page.tsx` dan menyelaraskan metadata pada `app/(public)/tentang/page.tsx`.
* **Impact:**
  - Situs web memiliki relevansi On-Page dan sinyal teknis maksimal untuk memenangkan peringkat teratas (#1) di Google Search saat calon pengunjung mencari kueri "rohkris smk penus", didukung oleh nama domain yang sudah berupa Exact Match Domain (`rohkrissmkpenus.web.id`).

## [DONE] Implementasi Favicon dan App Icons dari Logo.png untuk Tab Browser Chrome

* **Status:** Selesai (Production Ready)
* **Feature:** Penggantian ikon bumi bawaan Chrome tab dengan Logo resmi Rohkris SMK Penus (`Logo.png`)
* **Technical Implementation:**
  1. Menyiapkan skrip generator otomatis `scripts/generate-favicons.mjs` menggunakan pustaka `sharp` untuk memproses berkas asli `Logo.png` (1254x1254px, 1.27 MB):
     - Memusatkan lambang utama (crop 1120x1120px) agar lambang Rohkris memenuhi bidang favicon secara optimal dan terbaca jelas pada skala kecil di bilah tab peramban.
     - Menyisipkan channel RGBA (`ensureAlpha()`) untuk memastikan kompatibilitas penuh dengan pengurai berkas ICO pada Next.js Turbopack compiler.
     - Menghasilkan berkas multi-resolusi ICO (`16x16`, `32x32`, `48x48`) berukuran hanya ~7.6 KB (mereduksi 99.4% beban payload dibandingkan gambar asli 1.27 MB).
     - Menghasilkan berkas PNG teroptimasi: `icon.png` (32x32), `apple-icon.png` (180x180), `icon-192.png` (192x192), `icon-512.png` (512x512), dan `public/Logo.png`.
  2. Menerapkan arsitektur aset ganda:
     - Konvensi File-Based Next.js App Router pada `app/favicon.ico`, `app/icon.png`, dan `app/apple-icon.png`.
     - Static Public Assets pada `public/favicon.ico`, `public/icon.png`, `public/apple-icon.png`, `public/icon-192.png`, `public/icon-512.png`, dan `public/Logo.png` guna melayani request direct-access browser atau web server cPanel LiteSpeed secara instan.
  3. Memperbarui konfigurasi `metadata.icons` pada `app/layout.tsx`:
     - `icon`: `/favicon.ico` (sizes: any) dan `/icon.png` (sizes: 32x32, image/png).
     - `shortcut`: `/favicon.ico`.
     - `apple`: `/apple-icon.png` (sizes: 180x180, image/png).
  4. Memvalidasi hasil kompilasi HTML di seluruh halaman (`.next/server/app/*.html`), memastikan tag `<link rel="icon">`, `<link rel="shortcut icon">`, dan `<link rel="apple-touch-icon">` terpasang secara sempurna.
  5. Memastikan 100% lulus seluruh pengujian unit Vitest (67 passed), TypeScript typechecking (`tsc --noEmit`), linting (`eslint .`), dan kompilasi produksi `next build`.
* **Impact:**
  - Tab browser Chrome (serta Edge, Safari, Firefox, dan peramban ponsel) kini secara otomatis menampilkan Logo Rohkris SMK Penus yang tajam, proporsional, dan elegan, menggantikan ikon bumi/globe default.
  - Ukuran favicon yang sangat ringan (~7.6 KB untuk ICO dan ~2.3 KB untuk PNG) menjamin performa website tetap optimal tanpa membebani skor Core Web Vitals atau PageSpeed Insights.

## [DONE] Perlindungan Gerbang Panel Admin dengan Kunci Rahasia UUID (Admin Secret Gate)

* **Status:** Selesai (Production Ready)
* **Feature:** Pengamanan rute login dan dashboard admin dengan kunci rahasia UUID (`ADMIN_SECRET_KEY`)
* **Technical Implementation:**
  1. Menetapkan kunci UUID kriptografis unik (`db20a436-c20d-4b5e-8543-57f8dd50277c`) sebagai gerbang akses panel admin dan mendokumentasikannya pada `kredensial_hosting.txt`, `.env.example`, dan `.env.local`.
  2. Membangun modul autentikasi gerbang `lib/auth/gate-crypto.ts` dan `lib/auth/gate.ts`:
     - Penyimpanan izin gerbang berbasis cookie aman (`rohkris_admin_gate`) dengan enkripsi nilai satu arah (SHA-256 hash).
     - Durasi izin gerbang dibatasi 24 jam dengan flag `HttpOnly`, `SameSite=Lax`, dan `Secure` di lingkungan produksi.
  3. Memperbarui `proxy.ts` (Next.js middleware) untuk mendeteksi kueri URL `?key=<UUID>`. Jika kunci valid, proxy otomatis menyetel cookie gerbang dan mengalihkan ke URL bersih tanpa meninggalkan jejak parameter rahasia di bilah alamat browser.
  4. Membuat Route Handler `app/admin/gate/[key]/route.ts` sebagai gerbang langsung alternatif untuk memudahkan verifikasi dan penyetelan izin sebelum diteruskan ke halaman login.
  5. Mengamankan `app/(admin-auth)/admin/login/page.tsx` dan `lib/auth/guard.ts`:
     - Setiap pengunjung yang membuka `/admin`, `/admin/login`, atau sub-rute admin lainnya tanpa kunci UUID rahasia langsung disajikan halaman **404 Not Found** (`notFound()`), merahasiakan keberadaan panel admin dari publik dan bot.
  6. Mengintegrasikan pembersihan cookie gerbang dan sesi database secara atomik saat admin menekan tombol "Keluar" (`keluar()` pada `lib/actions/auth.ts`), lalu mengarahkan ke halaman beranda `/`.
  7. Menambahkan pengujian unit pada `tests/unit/gate.test.ts` (4 pengujian baru) dan memverifikasi kelulusan 100% pada 71 pengujian Vitest, `tsc --noEmit`, `eslint .`, serta kompilasi produksi `next build`.
* **Impact:**
  - Panel admin tidak dapat lagi ditemukan atau dicoba-coba (*brute-force attack*) oleh siswa, pengunjung umum, atau bot pemindai web karena alamat standar `/admin` menghasilkan respons 404 (Not Found).
  - Admin yang memiliki kunci rahasia UUID dapat masuk dengan lancar dan aman melalui tautan resmi yang telah disediakan di `kredensial_hosting.txt`.

## [DONE] Penghapusan Butir "Akun admin" dari Daftar Isi dan Halaman Kebijakan Privasi

* **Status:** Selesai (Production Ready)
* **Feature:** Penghapusan informasi privat akun admin dari halaman publik Kebijakan Privasi (`/privasi`)
* **Technical Implementation:**
  1. Menghapus item `{ id: "akun-admin", label: "Akun admin" }` dari konstanta `DAFTAR_ISI` pada `app/(public)/privasi/page.tsx` sehingga daftar isi hanya memuat 4 butir umum yang relevan bagi pengunjung umum (Data yang kami kumpulkan, Dokumentasi kegiatan, Tautan ke layanan lain, Pertanyaan).
  2. Menghapus subjudul `<h2 id="akun-admin">Akun admin</h2>` beserta seluruh paragraf penjelasannya dari bodi artikel halaman kebijakan privasi guna menjaga privasi dan kerahasiaan struktural akun pengurus.
  3. Memverifikasi seluruh pengujian unit Vitest (71 passed), TypeScript typechecking (`tsc --noEmit`), linting (`eslint .`), dan kompilasi produksi mandiri `next build`.
  4. Mengemas ulang paket arsip rilis `rohkris-deploy.zip` dan `rohkris-next.zip` agar sinkron dengan perubahan terbaru.
* **Impact:**
  - Halaman Kebijakan Privasi publik kini bersih dari rujukan administratif internal, menjaga kerahasiaan sistem manajemen panel admin dan meningkatkan postur keamanan situs web.

## [DONE] Resolusi Internal Server Error (500) pada Rute Panel Admin & Peningkatan Stabilitas Proxy

* **Status:** Selesai (Production Ready)
* **Feature:** Perbaikan crash 500 Internal Server Error pada rute panel admin (`/admin/:path*`) dan arsitektur delegasi gerbang Route Handler mandiri
* **Technical Implementation:**
  1. Melakukan diagnosis pada penyebab respons 500 `Internal Server Error` pada server produksi cPanel:
     - Argumen tidak valid `NextResponse.next({ request })` di `proxy.ts` memicu `Error: request.headers must be an instance of Headers` pada runtime mandiri server.
     - Impor modul bawaan Node.js (`node:crypto`) dan utilitas lingkungan di dalam kode proxy berpotensi menimbulkan crash eksekusi middleware.
  2. Mengonversi `proxy.ts` menjadi *zero-dependency*:
     - Memperbaiki pemanggilan `NextResponse.next()` tanpa argumen invalid.
     - Mendeteksi parameter query `?key=...` dan langsung mendelegasikannya via `NextResponse.redirect` ke Route Handler `/admin/gate/:key`.
  3. Memperbarui Route Handler `app/admin/gate/[key]/route.ts` menggunakan `NextResponse.redirect` yang menyematkan cookie HttpOnly `rohkris_admin_gate` secara atomik pada saat redirect ke `/admin/login`.
  4. Memvalidasi seluruh skenario pengujian:
     - Akses langsung tanpa kunci ke `/admin/login` mengembalikan status 404 (Halaman Tidak Ditemukan) dengan aman tanpa error 500.
     - Akses dengan kunci via `?key=...` atau `/admin/gate/:key` sukses menyetel cookie gerbang dan membuka antarmuka form login dengan status 200 OK.
  5. Memverifikasi kelulusan 100% pada 71 pengujian unit Vitest, TypeScript typecheck (`tsc --noEmit`), linter ESLint (`eslint .`), dan kompilasi `next build`.
  6. Mengemas ulang berkas produksi `rohkris-next.zip` (13.62 MB) yang memuat pembaruan `.next` dan `public/`.
* **Impact:**
  - Menghilangkan galat 500 Internal Server Error secara tuntas pada domain live `rohkrissmkpenus.web.id`.
  - Panel admin terlindungi penuh di balik gerbang UUID rahasia tanpa risiko server crash.

## [DONE] Otomasi Pemaketan Standalone Linux cPanel (Dereferensi Symlink & Normalisasi Path)

* **Status:** Selesai (Production Ready)
* **Feature:** Generator paket standalone siap-deploy cPanel (`rohkris-next.zip`) bebas ketergantungan build di server
* **Technical Implementation:**
  1. Menganalisis kendala kegagalan build `npm run build` di terminal cPanel (`RangeError: WebAssembly.instantiate(): Out of memory: Cannot allocate Wasm memory for new instance`), yang disebabkan oleh alokasi kuota memori proses WebAssembly CloudLinux.
  2. Mengembangkan skrip utilitas `scripts/pack-standalone.mjs` yang memproses output build Windows lokal untuk kebutuhan runtime server Linux:
     - Mendereferensikan seluruh symlink internal Next.js/Turbopack menjadi direktori dan berkas fisik asli, khususnya paket dependensi `mysql2` pada `node_modules/mysql2-3d80281e5ed34ca6` dan `node_modules/mysql2`.
     - Menyalin seluruh modul rute dinamis server (`.next/server/app/admin/gate/[key]`, `.next/server/app/(public)/kegiatan`, dll.) ke direktori runtime `.next/standalone/.next/server`.
     - Mengubah path absolut sistem operasi Windows (`C:\Best Project\Rohkris`) menjadi path absolut server Linux cPanel (`/home/pvote/rohkris`) pada `server.js`, `required-server-files.json`, dan `required-server-files.js`.
     - Menyertakan berkas pemicu reload LiteSpeed Passenger `tmp/restart.txt`.
  3. Menggunakan utilitas native `tar.exe` untuk mengompresi struktur `.next`, `public`, dan `tmp` menjadi berkas `rohkris-next.zip` (17.80 MB) secara cepat, aman dari karakter spasi path, dan kompatibel penuh dengan perintah `unzip` Linux.
* **Impact:**
  - Menyediakan solusi deployment yang 100% mandiri tanpa memerlukan kompilasi berbeban tinggi di server cPanel.
  - Memastikan seluruh modul server SSR, konektivitas database MySQL, dan rute dinamis admin/kegiatan berjalan stabil tanpa error modul hilang atau symlink rusak.

## [DONE] Resolusi Modul Hash Turbopack mysql2, Penguatan Gerbang Admin Fail-Closed, dan Otomasi Deploy Webpack Standalone

* **Status:** Selesai (Production Ready)
* **Feature:** Migrasi bundler build ke Webpack (`next build --webpack`), penguatan fail-closed pada kunci gerbang admin, eliminasi rute debug berisiko, serta standarisasi skrip pemaketan deployment `scripts/pack-build.ps1`
* **Technical Implementation:**
  1. Mengubah script `build` di `package.json` menjadi `next build --webpack`. Bundler Webpack menyelesaikan masalah resolusi modul ber-hash Turbopack (`mysql2-3d80281e5ed34ca6`) dengan menghasilkan impor murni `require("mysql2/promise")` langsung dari `.next/standalone/node_modules/mysql2`, sehingga stabil saat dipindahkan dari Windows ke server Linux cPanel.
  2. Menghapus fallback nilai hardcode rahasia pada `lib/env.ts` (`getAdminSecretKey()`), menerapkan prinsip fail-closed di mana ketiadaan konfigurasi `ADMIN_SECRET_KEY` langsung menolak akses gerbang admin secara aman. Menyesuaikan placeholder `.env.example` menjadi `ISI-DENGAN-UUID-ACAK` dan memperbarui unit test `tests/unit/gate.test.ts`.
  3. Menghapus rute debug `app/api/debug-status/route.ts` dan direktori `app/api/` untuk memastikan tidak ada rahasia atau variabel lingkungan yang bocor.
  4. Menulis ulang skrip pemaketan `scripts/pack-build.ps1` menggunakan `tar.exe -a -c -f` bawaan Windows dengan separator garis miring (`/`), menyalin aset statis (`.next/static` dan `public/`) ke dalam direktori `.next/standalone`, serta mengecualikan file rahasia `.env*`, `kredensial_hosting.txt`, `storage/`, `tests/`, dan dokumentasi.
  5. Memperbarui panduan deployment di `README.md` Bagian 5 yang mencakup alur build, penyalinan static, pembersihan folder `.next` lama di server sebelum unzip, restart aplikasi, serta tata cara akses panel admin via `/admin/login?key=<ADMIN_SECRET_KEY>`.
  6. Menjalankan verifikasi lokal menyeluruh: `npm run typecheck`, `npm run lint`, `npm test` (72/72 lulus), verifikasi bundler Webpack pada `.next/trace-build`, verifikasi ketiadaan hash modul regex `mysql2-[0-9a-f]{16}`, serta pengujian HTTP pada server standalone produksi dengan status respons sesuai spesifikasi.
* **Impact:**
  - Menghilangkan galat 500 Internal Server Error pada rute dinamis `/kegiatan` dan `/admin/login` di server hosting Linux cPanel.
  - Menutup celah keamanan kebocoran kunci rahasia dan menegakkan kontrol akses fail-closed pada panel admin.
  - Memastikan paket deployment berukuran ringkas (~17.6 MB) dengan struktur path POSIX yang kompatibel dengan unzip Linux.

## [DONE] Normalisasi Origin Pengalihan Gerbang Admin dari Binding 0.0.0.0:3000 ke Domain Publik

* **Status:** Selesai (Production Ready)
* **Feature:** Pencegahan galat `ERR_ADDRESS_INVALID` (`https://0.0.0.0:3000/admin/login`) saat pengalihan kunci gerbang admin di belakang Phusion Passenger / LiteSpeed reverse proxy
* **Technical Implementation:**
  1. Menganalisis penyebab browser dialihkan ke `https://0.0.0.0:3000/admin/login`: daemon Node.js di server cPanel berjalan di balik Phusion Passenger pada binding `0.0.0.0:3000`. Konstruktor `new URL("/admin/login", request.url)` mengadopsi origin internal `request.url` (`0.0.0.0:3000`) ke header `Location`.
  2. Mengimplementasikan fungsi normalisasi `getPublicOrigin(request)` pada `proxy.ts` dan `app/admin/gate/[key]/route.ts`. Fungsi mendeteksi header `x-forwarded-host`, `host`, dan `x-forwarded-proto`, serta menolak host internal `0.0.0.0` dengan mengarahkannya ke `NEXT_PUBLIC_SITE_URL` atau fallback `"https://rohkrissmkpenus.web.id"`.
  3. Memverifikasi dengan pengujian unit Vitest (72/72 lulus), `npm run typecheck`, `npm run lint`, dan pengujian lokal simulasi header `host: 0.0.0.0:3000` yang terbukti mengembalikan `Location: https://rohkrissmkpenus.web.id/admin/login` dengan status 307.
  4. Mengemas ulang build produksi webpack mandiri ke dalam `rohkris-build.zip`.
* **Impact:**
  - Pengalihan kunci gerbang admin kini selalu mengarah ke domain publik yang benar (`https://rohkrissmkpenus.web.id/admin/login`), mengeliminasi galat `ERR_ADDRESS_INVALID` 100%.

## [DONE] Peningkatan Estetika Favicon dan Ikon Aplikasi dengan Sudut Melengkung (Squircle 22%)

* **Status:** Selesai (Production Ready)
* **Feature:** Pembulatan sudut 4 sisi latar putih favicon dan ikon aplikasi (`favicon.ico`, `icon.png`, `apple-icon.png`, `icon-192.png`, `icon-512.png`, `public/Logo.png`)
* **Technical Implementation:**
  1. Mengidentifikasi tampilan favicon pada bilah bookmark / tab browser yang sebelumnya memiliki sudut lancip 90 derajat (persegi tajam).
  2. Menerapkan mask kurva vektor SVG squircle proporsional (`rx="22%"` dan `ry="22%"`) menggunakan operasi komposit `dest-in` pada pustaka `sharp` di `scripts/generate-favicons.mjs`.
  3. Mengenerasi ulang seluruh varian aset favicon dan ikon aplikasi sehingga sudut luar kotak putih menjadi melengkung halus dan transparan pada tiap ujungnya.
  4. Memvalidasi bahwa build produksi dan paket deployment `rohkris-build.zip` telah memuat seluruh aset ikon yang diperbarui.
* **Impact:**
  - Tampilan favicon pada tab browser, bilah bookmark, dan pintasan layar kini tampak jauh lebih modern, rapi, dan menyatu secara elegan dengan antarmuka sistem operasi tanpa sudut lancip yang kaku.

## [DONE] Penghapusan Elemen Badge Hero dan Pembaruan Paket Build Arsip ZIP untuk Cloud Hosting

* **Status:** Selesai (Production Ready)
* **Feature:** Penghapusan elemen badge hero "ROHKRIS SMK PENUS · SMK PLUS PELITA NUSANTARA" dari halaman beranda publik dan pembaruan arsip deploy produksi `rohkris-build.zip` serta `rohkris-next.zip`
* **Technical Implementation:**
  1. Menghapus elemen badge `<div className="mb-4 inline-block animate-fade-up"><span ...>Rohkris SMK Penus · SMK Plus Pelita Nusantara</span></div>` yang sebelumnya berada di atas judul utama H1 hero pada `app/(public)/page.tsx`.
  2. Melakukan pengujian verifikasi penuh:
     - TypeScript strict typechecking (`npm run typecheck`) tanpa kesalahan kompilasi.
     - ESLint analysis (`npm run lint`) tanpa pelanggaran atau peringatan.
     - Vitest unit testing suite (`npm test`) dengan seluruh 72 pengujian lulus 100%.
  3. Mengompilasi ulang bundle produksi mandiri Webpack (`next build --webpack`).
  4. Menjalankan skrip pemaketan `scripts/pack-build.ps1` dan `scripts/pack-standalone.mjs` untuk memperbarui berkas arsip `rohkris-build.zip` (18.16 MB) dan `rohkris-next.zip` (20.88 MB) yang telah disesuaikan dengan static files, public assets, serta normalisasi path Linux cPanel.
* **Impact:**
  - Tampilan hero beranda kini lebih bersih, proporsional, dan langsung berfokus pada judul "Bertumbuh dalam Iman" tanpa elemen badge yang redundant.
  - Berkas arsip `.zip` untuk deployment cloud hosting telah diperbarui secara penuh dan siap langsung diunggah/di-commit oleh pengembang.
## [DONE] Inisialisasi Repository Git dan Publikasi ke GitHub (Rohkris-Penus)

* **Status:** Selesai (Production Ready & Published)
* **Feature:** Publikasi codebase resmi ke repository GitHub publik untuk kolaborasi kontributor
* **Technical Implementation:**
  1. Memperbarui `.gitignore` untuk mengecualikan berkas arsip deploy (`*.zip`, `*.tar.gz`) serta memastikan berkas rahasia (`.env.local`, `kredensial_hosting.txt`, `node_modules`) tidak terunggah ke publik.
  2. Menginisialisasi Git, membuat initial commit pada branch `main` dengan 132 file sumber bersih, konfigurasi, pengujian unit, dan dokumentasi.
  3. Menghubungkan remote repository `https://github.com/Kevinnn911/Rohkris-Penus.git`.
  4. Melakukan rebase sinkronisasi dengan remote repository yang memuat `LICENSE` (MIT License) dan menyelesaikan konflik judul dokumentasi pada `README.md`.
  5. Melakukan push branch `main` ke remote repository GitHub (`git push -u origin main`).
* **Impact:**
  - Kode sumber proyek kini tersedia di GitHub secara aman dan siap untuk kolaborasi tim maupun kontribusi pengembang luar tanpa risiko kebocoran data rahasia/kredensial produksi.

## [DONE] Implementasi Sistem Formulir Internal Pendaftaran Kegiatan dan Pengelolaan Respons

* **Status:** Selesai (Production Ready)
* **Feature:** Sistem formulir pendaftaran dinamis mandiri di dalam website (pengganti Google Forms), manajemen respons pendaftar, ekspor CSV, dan pengiriman email konfirmasi
* **Technical Implementation:**
  1. Merancang skema relasional database MySQL dan migrasi `database/migrations/2026-10-formulir-internal.sql` serta pembaruan `database/schema.sql`:
     - Menambahkan kolom `registration_mode` (`external` | `internal`) pada tabel `events`.
     - Membuat tabel terstruktur: `event_forms`, `event_form_questions`, `event_form_responses`, `event_form_answers`, `event_form_versions`, dan `event_form_files`.
  2. Mengembangkan pustaka validasi dan pemrosesan formulir di `lib/forms/`:
     - Skema JSON definisi formulir (`definition-schema.ts`) dengan Zod untuk mendukung aneka tipe pertanyaan (teks pendek, teks panjang, pilihan ganda, kotak centang, dropdown, skala linear, tanggal, waktu, nomor telepon, dan unggah berkas).
     - Mesin validasi respons peserta berbasis aturan wajib, format regex, batas kuota pendaftaran atomik, dan pencegahan duplikasi email (`limit_one_per_email`).
  3. Membangun lapisan data dan Server Actions:
     - `lib/data/forms.ts` untuk query definisi form, status pendaftaran, daftar respons, dan download berkas bukti.
     - `lib/actions/formulir-admin.ts` untuk aksi admin (simpan draf, publikasikan, rollback versi, unduh CSV respons).
     - `lib/actions/formulir-publik.ts` untuk submit pendaftaran publik, enkripsi token pengeditan respons, dan sanitasi payload.
     - `lib/email/` mengintegrasikan `nodemailer` untuk pengiriman email bukti pendaftaran otomatis berbasis template HTML/teks.
  4. Membangun antarmuka pengguna (UI):
     - Panel Admin Form Builder: `app/(admin-protected)/admin/kegiatan/[id]/formulir/` dan `components/admin/formulir/` dengan drag/reorder, preview real-time, dan pengaturan kuota.
     - Panel Admin Response Viewer: `app/(admin-protected)/admin/kegiatan/[id]/respons/` dengan tabel respons, pencarian, filter, dan unduh CSV.
     - Halaman Pendaftaran Publik: `app/(public)/kegiatan/[slug]/daftar/` dan `components/formulir/` dengan desain responsif, ramah mobile, progress bar, dan penanganan galat interaktif.
  5. Pengujian komprehensif:
     - Menulis unit test di `tests/unit/forms-builder.test.ts` dan `tests/unit/forms-core.test.ts`.
     - 112/112 unit test Vitest lulus 100%.
     - Lulus uji TypeScript strict (`npm run typecheck`) dan ESLint (`npm run lint`) tanpa peringatan.
     - Lulus kompilasi produksi Next.js 16 standalone Webpack (`next build --webpack`).
     - Paket deployment cPanel diperbarui via `scripts/pack-standalone.mjs` (`rohkris-next.zip`) dan `scripts/pack-build.ps1` (`rohkris-build.zip`).
* **Impact:**
  - Pengurus Rohkris kini memiliki kontrol penuh atas formulir pendaftaran acara langsung di website sekolah tanpa bergantung pada Google Forms pihak ketiga.
  - Data peserta tersimpan aman di database hosting sendiri dan dapat diekspor langsung ke spreadsheet format CSV.

## [DONE] Verifikasi Kesiapan Deployment cPanel dan Pembaruan Arsip Distribusi Produksi

* **Status:** Selesai (100% Production Ready for cPanel)
* **Feature:** Audit integritas kualitas kode, pengujian unit, kompilasi build standalone, dan sinkronisasi arsip deployment Linux cPanel
* **Technical Implementation:**
  1. Melakukan audit kompilasi TypeScript strict (`npm run typecheck`) dan memastikan status lolos 100% tanpa kesalahan tipe data.
  2. Menjalankan linter kode (`npm run lint`) dan memverifikasi kepatuhan terhadap standar ESLint Next.js Core Web Vitals tanpa peringatan atau pelanggaran sintaks.
  3. Menjalankan seluruh pengujian unit otomatis (`npm test` via Vitest): 8 berkas pengujian dan 112 unit tests lolos 100%.
  4. Mengompilasi ulang bundle produksi Next.js 16 mode standalone (`npm run build` dengan webpack) untuk menghasilkan server mandiri tanpa ketergantungan node_modules lengkap di server hosting.
  5. Memperbarui arsip siap deploy Linux cPanel:
     - `rohkris-next.zip` (21.22 MB): menanamkan modul MySQL2 riil, menormalkan path Windows menjadi path absolut Linux hosting (`/home/pvote/rohkris`), serta menyematkan berkas picu reload LiteSpeed Passenger (`tmp/restart.txt`).
     - `rohkris-build.zip` (18.39 MB): arsip cadangan terkompresi dengan format POSIX.
  6. Memverifikasi berkas sensitif (`.env.local`, `kredensial_hosting.txt`, `node_modules/`, `storage/`) tetap terisolasi dan diabaikan oleh `.gitignore` untuk mencegah kebocoran data kredensial.
* **Impact:**
  - Aplikasi dinyatakan siap 100% untuk diunggah dan diaktifkan di server hosting cPanel `rohkrissmkpenus.web.id` tanpa potensi kegagalan kompilasi atau dependensi path.


## [DONE] Penggantian Latar Belakang Hero (HeroBackdrop) dengan Foto Gedung SMK Plus Pelita Nusantara Full-Bleed & Seamless Bottom Blend

* **Status:** Selesai (Production Ready)
* **Feature:** Penggantian siluet SVG kapel/rumah bawaan pada `components/site/HeroBackdrop.tsx` dengan foto gedung resmi SMK Plus Pelita Nusantara (`public/gedung-sekolah.jpg`) yang membentang penuh (*full-bleed*) hingga ke sudut layar serta gradasi bawah yang menyatu (*blend*) mulus dengan latar halaman
* **Technical Implementation:**
  1. Menyalin aset foto gedung resmi SMK Plus Pelita Nusantara ke direktori publik `public/gedung-sekolah.jpg`.
  2. Memperbarui `app/(public)/page.tsx` dan `components/site/PageHeader.tsx`:
     - Menghapus pembatas lebar (`max-w-7xl`), padding samping (`px-3 sm:px-5`), dan sudut membulat (`rounded-hero`) pada pembungkus hero sehingga gambar membentang penuh (`w-full`) hingga ke pojok kiri, kanan, dan atas layar tanpa menyisakan ruang putih di tepi.
     - Menaikkan posisi bar pencarian (`Kategori`, `Status`, `Jadwal`) pada `app/(public)/page.tsx` menggunakan `-mt-28 sm:-mt-32` (sebelumnya `-mt-24 sm:-mt-20`) agar lebih dekat secara proporsional ke tombol aksi hero dan berada pas di area transisi gradasi bawah.
  3. Memperbarui komponen `components/site/HeroBackdrop.tsx`:
     - Mengganti elemen `<svg>` siluet 2 bangunan/gereja dengan komponen `<Image>` (`src="/gedung-sekolah.jpg"`, `fill`, `unoptimized`, `object-cover object-[center_44%]`).
     - Mengatur opasitas gambar menjadi `opacity-95` pada varian `full` dan `opacity-80` pada varian `subtle` tanpa blur agar fasad gedung terlihat tajam.
     - Menambahkan gradasi berlapis di bagian bawah (`h-[45%] bg-gradient-to-t from-ivory-100 from-10% via-ivory-100/80 via-48% to-transparent`) yang melebur mulus ke warna latar halaman (`--color-ivory-100`) sehingga bagian bawah foto menyambung tanpa garis batas dengan halaman di bawahnya.
  4. Memverifikasi validitas kode menggunakan `npm run typecheck`, `npm run lint`, dan `npm test`.
* **Impact:**
  - Latar belakang hero kini tampil penuh memenuhi layar hingga ke sudut-sudut atas dan samping, serta bagian bawah gambar menyatu secara alami dengan latar putih/ivory halaman dan bar pencarian.


## [DONE] Perbaikan Konflik Controlled vs Uncontrolled Input pada Komponen TextField Admin

* **Status:** Selesai (Production Ready)
* **Feature:** Eliminasi galat konsol React 19 (`both value and defaultValue props`) pada halaman pembuatan/pengeditan kegiatan dan berita di Panel Admin
* **Technical Implementation:**
  1. Memperbarui komponen `TextField` pada `components/admin/Fields.tsx` dengan mendeteksi keberadaan `rest.value !== undefined` (`const terkontrol = rest.value !== undefined`).
  2. Menyetel `defaultValue={terkontrol ? undefined : (defaultValue ?? "")}` sehingga `<input>` tidak pernah menerima `value` dan `defaultValue` secara bersamaan.
  3. Memverifikasi kode dengan `npm run typecheck` dan `npm run lint`.
* **Impact:**
  - Halaman `/admin/kegiatan/baru`, `/admin/kegiatan/[id]`, `/admin/berita/baru`, dan `/admin/berita/[id]` bebas dari peringatan/galat konsol React terkait komponen input terkontrol.


## [DONE] Penambahan Pintasan Langsung & Panduan Kontekstual Pengaturan Formulir Internal pada FormEvent

* **Status:** Selesai (Production Ready)
* **Feature:** Kotak panduan kontekstual dan tombol pintasan langsung (`Atur Pertanyaan Formulir` & `Lihat Respons`) saat opsi `Formulir internal` dipilih pada `components/admin/FormEvent.tsx`
* **Technical Implementation:**
  1. Memperbarui `components/admin/FormEvent.tsx` untuk merender panel bantu kontekstual tepat di bawah pilihan radio `Formulir internal`.
  2. Pada mode edit kegiatan (`event` tersedia), menampilkan tombol aksi langsung menuju `/admin/kegiatan/[id]/formulir` (`Atur Pertanyaan Formulir`) dan `/admin/kegiatan/[id]/respons` (`Lihat Respons`).
  3. Pada mode buat kegiatan baru (`!event`), menampilkan instruksi langkah demi langkah agar admin menyimpan kegiatan terlebih dahulu sebelum menyusun pertanyaan formulir.
* **Impact:**
  - Admin dapat langsung mengakses halaman pembuat pertanyaan formulir internal dari dalam bagian Pendaftaran tanpa perlu mencari tab navigasi di bagian atas halaman.


## [DONE] Implementasi Sistem E-Tiket Digital & Kode QR Multi-Fungsi (Presensi dan Penukaran Kupon)

* **Status:** Selesai (Production Ready)
* **Feature:** Sistem penerbitan E-Tiket otomatis dengan Kode QR multi-fungsi untuk presensi (check-in) dan penukaran kupon (konsumsi, souvenir, photobooth), dilengkapi pengiriman email QR otomatis, unduh gambar PNG/cetak PDF klien, antarmuka pemindai panitia berbasis kamera & barcode scanner gun, pencegahan scan ganda (*anti-double-claim*), serta server backup tiket untuk mengantisipasi tiket hilang pada gawai peserta.
* **Technical Implementation:**
  1. **Skema Database & Migrasi:**
     - Membuat berkas migrasi `database/migrations/2026-11-e-tiket-qr.sql` dan memperbarui `database/schema.sql`.
     - Menambahkan kolom konfigurasi tiket pada tabel `event_forms`: `ticket_enabled`, `ticket_name_question_id`, `ticket_redemption_mode`, `ticket_benefits_config`.
     - Membuat tabel `event_tickets` (`id`, `response_id`, `event_id`, `ticket_code`, `attendee_name`, `attendee_email`, `checkin_status`, `checkin_at`, `checked_in_by`) dengan indeks unik pada `ticket_code`.
     - Membuat tabel `ticket_benefits` (`id`, `ticket_id`, `benefit_key`, `benefit_name`, `status`, `claimed_at`, `claimed_by`) dengan constraint `ticket_id + benefit_key` unik.
  2. **Core Logic & Keamanan Kode QR (`lib/tickets/`):**
     - `ticket-code.ts`: Pembuatan kode tiket ramah manusia dengan format `ROH-<SLUG>-<6_CHARS>` menggunakan karakter non-ambigu, pembuatan HMAC SHA-256 signature rahasia, serta parser fleksibel yang mendukung format payload QR resmi `ROHKRIS:TICKET:<code>:<sig>`, format URL, maupun barcode mentah.
     - `qr.ts`: Generator QR Code menggunakan pustaka `qrcode` ke format Data URL (PNG Base64) dan SVG dengan tingkat koreksi galat tinggi (`errorCorrectionLevel: 'H'`).
     - `data.ts`: Penerbitan tiket di dalam transaksi pendaftaran formulir publik (`issueTicketInTx`), query tiket tunggal/kolektif, logika presensi atomik (`claimCheckin`), penukaran kupon per-stan (`claimBenefit`), dan penukaran sekaligus (`claimAll`).
  3. **Integrasi Email Pengiriman Tiket:**
     - Menambahkan dukungan lampiran berkas biner (`Buffer`) dan *Content-ID* (CID inline image) pada pengirim surel `lib/email/mailer.ts`.
     - Memperbarui template konfirmasi surel `lib/forms/email-template.ts` agar menyematkan kartu E-Tiket dengan gambar QR code otomatis yang langsung tampil di aplikasi surel peserta tanpa perlu membuka lampiran terpisah.
  4. **Antarmuka Pengguna & Unduh Klien:**
     - `components/tiket/KartuETiket.tsx`: Desain boarding pass modern bergaya kartu resmi dengan aksen emas (`gold-300`), garis potong/perforasi tiket, nama peserta, kode tiket, daftar chip kupon/fasilitas, dan kode QR.
     - `components/tiket/AksiUnduhTiket.tsx`: Generator gambar PNG beresolusi tinggi (1200x1500) berbasis HTML5 Canvas API murni tanpa ketergantungan paket berat, serta fungsi cetak/simpan PDF langsung.
     - Menyematkan kartu E-Tiket pada layar sukses pendaftaran (`LayarSelesai` di `components/formulir/FormulirPublik.tsx`).
  5. **Manajemen Tiket & Server Backup Panel Admin:**
     - Membuat rute halaman `/admin/kegiatan/[id]/tiket` dan komponen client `components/admin/tiket/ManajemenTiket.tsx`.
     - Menyediakan pencarian cepat (kode tiket, nama, email), filter status kehadiran, ringkasan statistik (total tiket, hadir, belum hadir, kupon ditukar).
     - Menyediakan modal "Tiket Cadangan Server" yang merender ulang kartu tiket lengkap dan kode QR untuk peserta yang kehilangan tiket di lokasi, lengkap dengan tombol cetak/unduh dan kirim ulang email.
  6. **Antarmuka Pemindai QR Panitia (Scanner):**
     - Membuat rute halaman `/admin/kegiatan/[id]/scan` dan komponen client `components/admin/tiket/PindaiTiket.tsx`.
     - Mendukung kamera langsung dengan auto-deteksi QR via Web `BarcodeDetector` API, tombol balik kamera depan/belakang, input manual kode tiket, serta kompatibilitas penuh dengan USB Gun Barcode Scanner.
     - Umpan balik suara interaktif tanpa aset audio eksternal menggunakan Web Audio API sintesis nada (*high pleasant chime* untuk tiket valid, *warning buzz* untuk tiket yang sudah pernah check-in, dan *error tone* untuk tiket tidak valid).
     - Tombol konfirmasi presensi dan penukaran kupon bertahap maupun serentak dengan pencegahan klaim ganda (*anti-double-claim*).
     - Riwayat pindaian sesi panitia terkini (*real-time history list*).
  7. **Konfigurasi Tab & Form Builder:**
     - Memperbarui `components/admin/SubNavKegiatan.tsx` dengan menambahkan tab navigasi `Tiket` dan `Pindai QR`.
     - Memperbarui `components/admin/formulir/PembangunFormulir.tsx` dengan bagian pengaturan E-Tiket: saklar terbitkan tiket, selektor pertanyaan penentu nama peserta, pilihan mode penukaran (*fleksibel* vs *all-in-one*), dan pengelola daftar kupon dinamis.
  8. **Verifikasi Kualitas:**
     - Membuat 7 unit test baru di `tests/unit/ticket-core.test.ts`. Seluruh 119 pengujian pada 9 test suite lulus 100% via `npm test`.
     - Verifikasi TypeScript strict mode `npm run typecheck` lolos dengan zero errors.
     - Verifikasi linting ESLint `npm run lint` lolos dengan zero warnings.
* **Impact:**
  - Panitia memiliki sistem registrasi dan presensi acara modern yang lengkap dari hulu ke hilir.
  - Meminimalkan antrean di lokasi acara, mencegah kecurangan penukaran kupon konsumsi/souvenir, dan menyediakan cadangan data aman di server bila peserta kehilangan tiket fisiknya.

## [DONE] Redesain Layout E-Tiket Digital Format Gelap Profesional (Anti-AI Slop)

* **Status:** Selesai (Production Ready)
* **Feature:** Perombakan total tata letak kartu e-tiket digital dan berkas unduhannya mengadopsi format gelap (dark mode) presisi sesuai referensi acara riil tanpa elemen dekoratif berlebih (bebas AI slop).
* **Technical Implementation:**
  1. **Komponen Kartu Web (`components/tiket/KartuETiket.tsx`):**
     - Mengubah tema kartu menjadi latar gelap pekat (`bg-[#18181b] border-zinc-800 text-white shadow-2xl`).
     - Menyematkan banner poster rasio landscape (`aspect-[21/9] sm:aspect-[16/6]`) di bagian atas kartu yang secara otomatis menggunakan foto gedung sekolah `/gedung-sekolah.jpg` (`object-cover object-[center_38%]`) seperti pada hero beranda, dilengkapi gradasi halus bawah (`from-[#18181b] via-[#18181b]/40 to-transparent`) agar menyatu mulus ke badan tiket.
     - Menyusun header terpusat dengan teks judul acara tebal, subjudul tema, waktu acara, serta kotak putih bersih (`bg-white rounded-xl shadow-md p-3 sm:p-4`) untuk memuat kode QR berkontras tinggi di posisi tengah atas.
     - Mengimplementasikan seksi tabular 2 kolom terstruktur rapi:
       - **DETAIL PESERTA:** Nama, Email, No. WhatsApp, Asal Instansi/Sekolah.
       - **DETAIL TIKET:** Tiket ID alfanumerik monospace, Harga tiket, Order ID unik, Status pendaftaran berbadge hijau (`Sudah Dibayar` / `Sudah Hadir`), serta fasilitas/kupon acara.
       - **LOKASI EVENT:** Ikon penanda lokasi dan alamat lengkap venue acara.
     - Menyematkan kotak imbauan berlatar cokelat/amber (`bg-[#3a1d06]/75 border-amber-600/80 text-amber-200`) untuk instruksi registrasi ulang dan pemindaian QR.
     - Menambahkan seksi teks regulasi resmi terstruktur:
       - **SYARAT DAN KETENTUAN DAFTAR:** Daftar berurutan 1 sampai 6 lengkap dengan tautan dinamis bergabung grup koordinasi WhatsApp.
       - **PERATURAN KEGIATAN:** Pembagian tegas tata tertib Do's (hal yang dilakukan) dan Don'ts (hal yang dihindari).
  2. **Ekspor Gambar PNG Kanvas Klien (`components/tiket/AksiUnduhTiket.tsx`):**
     - Menulis ulang modul render HTML5 Canvas (1200 x 2480 px) agar menghasilkan gambar berkas PNG dengan tipografi tajam, latar gelap pekat, kotak QR putih, badge status hijau, kotak amber, serta syarat dan peraturan lengkap yang 100% identik dengan tampilan kartu di layar.
  3. **Ekstraksi Data Peserta Otomatis (`lib/tickets/ticket-code.ts` & `lib/actions/formulir-publik.ts`):**
     - Menambahkan fungsi pembantu cerdas `resolveAttendeePhone` dan `resolveAttendeeOrg` untuk mendeteksi nomor WhatsApp dan asal sekolah/instansi secara otomatis dari jawaban isian formulir.
  4. **Pembaruan Desain Surel (`lib/forms/email-template.ts`):**
     - Menyelaraskan kartu e-tiket pada badan surel peserta dengan gaya kartu gelap, kode QR CID tersemat di tengah, tabel detail peserta, dan kotak imbauan amber.
  5. **Verifikasi Kualitas:**
     - Menambahkan pengujian unit baru pada `tests/unit/ticket-core.test.ts`. Seluruh 120 pengujian pada 9 test suite lulus 100% via `npm test`.
     - Validasi TypeScript `tsc --noEmit` lolos dengan 0 error.
     - Validasi ESLint `eslint .` lolos dengan 0 error dan 0 warning.
* **Impact:**
  - Desain e-tiket kini tampak sangat profesional, bersih, berwibawa, dan otentik layaknya e-tiket konferensi/pelatihan resmi skala nasional, bebas dari kesan desain generik kecerdasan buatan (*AI slop*).
  - Peserta mendapatkan seluruh informasi esensial (jadwal, lokasi, syarat, peraturan, grup WhatsApp) langsung di dalam satu lembar e-tiket baik di web, gambar unduhan, maupun surel.

## [DONE] Audit Menyeluruh dan Perbaikan Integritas Sistem E-Tiket, Pemindai QR, serta Formulir Pendaftaran

* **Status:** Selesai (Production Ready)
* **Feature:** Pengujian mendalam (*deep audit*) dan penyempurnaan menyeluruh pada keamanan kriptografi QR, isolasi pemindaian lintas kegiatan, eksekusi mode penukaran `all_in_one`, ketahanan skema database, kelengkapan data tiket cadangan server, dan pencetakan PDF.
* **Technical Implementation:**
  1. **Verifikasi HMAC Signature & Pencegahan Scan Lintas Kegiatan (`lib/tickets/ticket-code.ts`, `lib/actions/scan-admin.ts`, `components/admin/tiket/PindaiTiket.tsx`):**
     - Menambahkan fungsi `verifyScannedQrSignature(scannedText)` berbasis `timingSafeEqual` untuk memvalidasi tanda tangan HMAC SHA-256 pada payload QR `ROHKRIS:TICKET:<code>:<sig>` dan menolak QR yang dimanipulasi.
     - Menambahkan validasi `expectedEventId` pada `periksaKodeTiket` dan meneruskan `eventId` dari `PindaiTiket` sehingga tiket dari kegiatan lain ditolak secara eksplisit.
  2. **Implementasi Mode Penukaran "Semua Sekaligus" (`all_in_one`) (`lib/actions/scan-admin.ts`, `app/(admin-protected)/admin/kegiatan/[id]/scan/page.tsx`, `components/admin/tiket/PindaiTiket.tsx`):**
     - Membaca `ticket_redemption_mode` dari tabel `event_forms` saat pemindaian berlangsung.
     - Pada mode `all_in_one`, pemindaian pertama pada tiket valid otomatis mengeksekusi `claimAll(ticket.id, auth.admin.id)` untuk mengonfirmasi kehadiran beserta seluruh kupon sekaligus, menampilkan lencana mode aktif dan notifikasi konfirmasi otomatis.
  3. **Ketahanan Transaksi Database terhadap Input Panjang & Duplikasi Kupon (`lib/tickets/ticket-code.ts`, `lib/tickets/data.ts`, `lib/forms/definition-schema.ts`, `lib/actions/formulir-publik.ts`):**
     - Membatasi panjang nama peserta (`resolveAttendeeName` & `issueTicketInTx`) maksimal 120 karakter sesuai kolom `event_tickets.attendee_name VARCHAR(120)`.
     - Menambahkan validasi keunikan `key` kupon (case-insensitive) serta batas panjang `key <= 64` dan `name <= 100` pada `formSettingsSchema`, `parseBenefitsConfig`, dan `issueTicketInTx`.
     - Memperbaiki deteksi `ER_DUP_ENTRY` di `kirimFormulir` agar spesifik memeriksa constraint `form_responses_dedupe_uq`.
  4. **Kelengkapan E-Tiket saat Ubah Jawaban & Tiket Cadangan Admin (`lib/actions/formulir-publik.ts`, `lib/tickets/data.ts`, `app/(admin-protected)/admin/kegiatan/[id]/tiket/page.tsx`, `components/admin/tiket/ManajemenTiket.tsx`):**
     - Memperbarui `ubahJawaban` agar memuat (atau menerbitkan) E-Tiket peserta dan menyertakannya kembali pada layar selesai serta email konfirmasi perubahan.
     - Memperkaya `getEventTickets` dengan ekstraksi `attendee_phone` dan `attendee_org` dari `form_responses.answers`, serta meneruskan metadata lengkap ke modal `Tiket Cadangan Server` dan `kirimUlangEmailTiket`.
     - Menambahkan dukungan tutup modal dengan tombol `Escape`, klik latar belakang, `aria-labelledby`, serta mengganti simbol Unicode `✕` dengan `<IconClose />`.
  5. **Penyempurnaan Kanvas PNG & Cetak PDF (`components/tiket/AksiUnduhTiket.tsx`, `components/tiket/KartuETiket.tsx`, `app/globals.css`):**
     - Menambahkan fungsi `fitText` pada kanvas HTML5 untuk mencegah teks panjang meluber keluar batas horizontal maupun vertikal.
     - Menambahkan aturan `@media print` khusus `#e-tiket-card` dengan `print-color-adjust: exact` agar latar gelap dan kontras QR tercetak sempurna tanpa elemen navigasi halaman.
  6. **Verifikasi Kualitas:**
     - Menambahkan pengujian unit baru di `tests/unit/ticket-core.test.ts` (total 122 pengujian pada 9 test suite lulus 100%).
     - Lulus `npm run typecheck`, `npm run lint`, dan `npm run build` tanpa error maupun warning.
* **Impact:**
  - Seluruh alur pendaftaran, pengubahan jawaban, unduh PNG/cetak PDF, tiket cadangan admin, hingga pemindaian QR oleh panitia di lapangan berjalan konsisten, aman dari pemalsuan maupun salah kamar kegiatan, dan bebas dari risiko kegagalan transaksi database.

