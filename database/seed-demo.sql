-- =====================================================================
-- DATA DEMO — Rohkris Pelita Nusantara (MySQL)
--
-- PERINGATAN:
--   Seluruh isi berkas ini adalah CONTOH berlabel [DEMO] dengan tanggal
--   relatif terhadap waktu dijalankan. Ini BUKAN pengumuman resmi sekolah.
--   Hapus sebelum situs dibuka untuk umum:
--       DELETE FROM events        WHERE title LIKE '[DEMO]%';
--       DELETE FROM news_posts    WHERE title LIKE '[DEMO]%';
--       DELETE FROM announcements WHERE title LIKE '[DEMO]%';
--       DELETE FROM media_items   WHERE title LIKE '[DEMO]%';
--
--   Berkas ini TIDAK memuat akun admin. Admin pertama dibuat dengan
--   `npm run admin:buat` (lihat README).
--   Jalankan SETELAH database/schema.sql. Aman dijalankan ulang (INSERT IGNORE).
-- =====================================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- Kegiatan contoh ------------------------------------------------------
INSERT IGNORE INTO events (
  id, title, slug, category, summary, description,
  start_at, end_at, location, event_mode,
  registration_url, registration_status, is_featured, status, published_at,
  dress_code, cost_info, contact_info
) VALUES
(
  UUID(),
  '[DEMO] Ibadah Natal Rohkris',
  'demo-ibadah-natal-rohkris',
  'Natal',
  'Perayaan Natal bersama keluarga besar Rohkris. Isi ringkasan ini dengan teks asli dari panitia.',
  '## Tentang Kegiatan\n\nIni adalah **data contoh** untuk menunjukkan tampilan halaman detail kegiatan. Ganti seluruh teks ini melalui panel admin.\n\n## Susunan Acara\n\n- Pujian dan penyembahan\n- Renungan Natal\n- Drama musikal\n- Ramah tamah\n\n> Catatan: tanggal dan tempat di bawah masih placeholder.',
  UTC_TIMESTAMP(3) + INTERVAL 30 DAY,
  UTC_TIMESTAMP(3) + INTERVAL 30 DAY + INTERVAL 3 HOUR,
  'Aula SMK PLUS PELITA NUSANTARA (contoh)',
  'offline',
  'https://forms.gle/contoh-pendaftaran-natal',
  'open',
  1,
  'published',
  UTC_TIMESTAMP(3),
  'Rapi dan sopan, nuansa merah atau putih',
  'Gratis untuk seluruh siswa',
  'Hubungi pengurus Rohkris (contoh)'
),
(
  UUID(),
  '[DEMO] Perayaan Paskah Bersama',
  'demo-perayaan-paskah-bersama',
  'Paskah',
  'Ibadah Paskah dan kegiatan kebersamaan. Teks contoh, silakan diganti.',
  '## Tentang Kegiatan\n\nData contoh untuk kategori Paskah. Pendaftaran pada contoh ini sengaja dibuat **belum dibuka** agar terlihat bagaimana label "Segera Dibuka" tampil.',
  UTC_TIMESTAMP(3) + INTERVAL 120 DAY,
  UTC_TIMESTAMP(3) + INTERVAL 120 DAY + INTERVAL 4 HOUR,
  'Gedung Serbaguna (contoh)',
  'offline',
  NULL,
  'not_open',
  0,
  'published',
  UTC_TIMESTAMP(3),
  NULL,
  NULL,
  NULL
),
(
  UUID(),
  '[DEMO] Ibadah Rutin Jumat',
  'demo-ibadah-rutin-jumat',
  'Ibadah Rutin',
  'Persekutuan rutin setiap Jumat sore. Contoh kegiatan tanpa pendaftaran.',
  '## Tentang Kegiatan\n\nContoh kegiatan rutin yang **tidak memerlukan pendaftaran**. Semua siswa Kristen dipersilakan hadir.',
  UTC_TIMESTAMP(3) + INTERVAL 5 DAY,
  UTC_TIMESTAMP(3) + INTERVAL 5 DAY + INTERVAL 2 HOUR,
  'Ruang Doa (contoh)',
  'offline',
  NULL,
  'external_only',
  0,
  'published',
  UTC_TIMESTAMP(3),
  NULL,
  NULL,
  NULL
),
(
  UUID(),
  '[DEMO] Retreat Pemuda',
  'demo-retreat-pemuda',
  'Retreat',
  'Retreat dua hari satu malam untuk pembinaan iman. Contoh dengan pendaftaran sudah ditutup.',
  '## Tentang Kegiatan\n\nContoh kegiatan dengan status **pendaftaran ditutup**, untuk memperlihatkan bahwa tombol daftar tidak ditampilkan.',
  UTC_TIMESTAMP(3) + INTERVAL 60 DAY,
  UTC_TIMESTAMP(3) + INTERVAL 61 DAY,
  'Villa Retreat (contoh)',
  'offline',
  'https://forms.gle/contoh-retreat',
  'closed',
  0,
  'published',
  UTC_TIMESTAMP(3),
  'Pakaian santai dan sopan',
  'Rp0 (contoh — isi biaya sebenarnya)',
  NULL
),
(
  UUID(),
  '[DEMO] Aksi Sosial Bakti Masyarakat',
  'demo-aksi-sosial-bakti-masyarakat',
  'Aksi Sosial',
  'Kegiatan berbagi dengan masyarakat sekitar. Contoh kegiatan yang sudah terlaksana.',
  '## Tentang Kegiatan\n\nContoh kegiatan yang **sudah selesai**, untuk memperlihatkan bagian arsip dan dokumentasi.',
  UTC_TIMESTAMP(3) - INTERVAL 45 DAY,
  UTC_TIMESTAMP(3) - INTERVAL 45 DAY + INTERVAL 5 HOUR,
  'Lingkungan sekitar sekolah (contoh)',
  'offline',
  NULL,
  'not_open',
  0,
  'published',
  UTC_TIMESTAMP(3) - INTERVAL 45 DAY,
  NULL,
  NULL,
  NULL
),
(
  UUID(),
  '[DEMO] Draft Kegiatan Belum Terbit',
  'demo-draft-kegiatan-belum-terbit',
  'Lainnya',
  'Contoh draft — TIDAK boleh terlihat di halaman publik.',
  'Baris ini sengaja berstatus draft untuk menguji bahwa konten draft tidak bocor ke publik.',
  UTC_TIMESTAMP(3) + INTERVAL 90 DAY,
  NULL,
  NULL,
  'tbd',
  NULL,
  'not_open',
  0,
  'draft',
  NULL,
  NULL,
  NULL,
  NULL
);

-- Berita contoh --------------------------------------------------------
INSERT IGNORE INTO news_posts (id, title, slug, excerpt, body, status, published_at, event_id)
SELECT
  UUID(),
  '[DEMO] Recap Aksi Sosial Bakti Masyarakat',
  'demo-recap-aksi-sosial',
  'Ringkasan contoh dari kegiatan aksi sosial yang telah terlaksana.',
  '## Jalannya Kegiatan\n\nIni adalah **berita contoh**. Ganti isinya melalui panel admin setelah kegiatan sebenarnya terlaksana.\n\nTerima kasih kepada seluruh panitia dan peserta.',
  'published',
  UTC_TIMESTAMP(3) - INTERVAL 40 DAY,
  (SELECT id FROM events WHERE slug = 'demo-aksi-sosial-bakti-masyarakat');

-- Pengumuman contoh (hanya bila belum ada) ------------------------------
INSERT INTO announcements (id, title, body, starts_at, ends_at, priority, status)
SELECT
  UUID(),
  '[DEMO] Selamat datang di website Rohkris',
  'Ini pengumuman contoh. Admin dapat mengubah atau menghapusnya dari panel admin.',
  UTC_TIMESTAMP(3) - INTERVAL 1 DAY,
  UTC_TIMESTAMP(3) + INTERVAL 60 DAY,
  10,
  'published'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM announcements WHERE title = '[DEMO] Selamat datang di website Rohkris');

-- Pengaturan situs: nilai awal berlabel placeholder --------------------
INSERT IGNORE INTO site_settings (id, `key`, value) VALUES
  (UUID(), 'site_tagline',     'Bertumbuh bersama dalam iman, kasih, dan pelayanan'),
  (UUID(), 'site_description', 'Pusat informasi kegiatan Rohani Kristen SMK PLUS PELITA NUSANTARA.'),
  (UUID(), 'contact_email',    ''),
  (UUID(), 'contact_phone',    ''),
  (UUID(), 'school_info',      'SMK PLUS PELITA NUSANTARA'),
  (UUID(), 'instagram_url',    ''),
  (UUID(), 'youtube_url',      ''),
  (UUID(), 'tiktok_url',       ''),
  (UUID(), 'whatsapp_url',     ''),
  (UUID(), 'footer_note',      ''),
  (UUID(), 'about_vision',     'Isi visi Rohkris di panel admin › Pengaturan.'),
  (UUID(), 'about_mission',    'Isi misi Rohkris di panel admin › Pengaturan.'),
  (UUID(), 'about_values',     'Isi nilai-nilai Rohkris di panel admin › Pengaturan.'),
  (UUID(), 'about_body',       'Isi profil lengkap Rohkris di panel admin › Pengaturan.');
