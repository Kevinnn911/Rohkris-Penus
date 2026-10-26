-- =====================================================================
-- Rohkris Pelita Nusantara — Skema MySQL
--
-- Untuk MySQL 8.0.16+ / MariaDB 10.5+ (cPanel). Seluruh sintaks dipilih agar
-- berjalan di keduanya (mis. REGEXP + COLLATE utf8mb4_bin, bukan REGEXP_LIKE
-- yang tidak ada di MariaDB). Jalankan sekali melalui
-- phpMyAdmin → tab Import, atau: mysql -u USER -p NAMA_DB < database/schema.sql
-- Aman dijalankan ulang (CREATE TABLE IF NOT EXISTS).
--
-- Seluruh waktu disimpan dalam UTC (koneksi aplikasi memakai zona +00:00)
-- dan ditampilkan dalam WIB oleh aplikasi (PRD §10).
--
-- Catatan keamanan: versi Supabase sebelumnya memakai Row Level Security.
-- MySQL tidak memilikinya, sehingga aturan yang sama kini ditegakkan di
-- server aplikasi (lib/auth/guard.ts + filter status di lib/data/public.ts).
-- Akun database aplikasi cukup diberi hak SELECT/INSERT/UPDATE/DELETE.
-- =====================================================================

SET NAMES utf8mb4;

-- ----------------------------------------------------------------------
-- admin_users — akun & allowlist admin
--
-- Keanggotaan aktif di tabel inilah yang memberi hak admin. Kata sandi
-- disimpan sebagai hash scrypt (lihat lib/auth/password.ts), tidak pernah
-- dalam bentuk asli.
-- ----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admin_users (
  id             CHAR(36)     NOT NULL,
  email          VARCHAR(254) NOT NULL,
  password_hash  VARCHAR(255) NOT NULL,
  role           ENUM('super_admin','admin','editor') NOT NULL DEFAULT 'admin',
  display_name   VARCHAR(120) NOT NULL,
  is_active      TINYINT(1)   NOT NULL DEFAULT 1,
  last_login_at  DATETIME(3)  NULL,
  created_at     DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at     DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY admin_users_email_uq (email),
  KEY admin_users_active_idx (is_active, role),
  CONSTRAINT admin_users_display_name_chk CHECK (CHAR_LENGTH(TRIM(display_name)) BETWEEN 1 AND 120)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------
-- admin_sessions — sesi login
--
-- Cookie hanya berisi token acak; database menyimpan HASH SHA-256-nya,
-- sehingga bocornya isi tabel tidak memberi akses ke sesi mana pun.
-- ----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admin_sessions (
  token_hash  CHAR(64)    NOT NULL,
  admin_id    CHAR(36)    NOT NULL,
  expires_at  DATETIME(3) NOT NULL,
  created_at  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  user_agent  VARCHAR(255) NULL,
  PRIMARY KEY (token_hash),
  KEY admin_sessions_admin_idx (admin_id),
  KEY admin_sessions_expires_idx (expires_at),
  CONSTRAINT admin_sessions_admin_fk FOREIGN KEY (admin_id) REFERENCES admin_users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------
-- login_attempts — pembatas percobaan login (anti tebak kata sandi)
-- ----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS login_attempts (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  email       VARCHAR(254) NOT NULL,
  ip          VARCHAR(64)  NOT NULL,
  success     TINYINT(1)   NOT NULL DEFAULT 0,
  created_at  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY login_attempts_email_idx (email, created_at),
  KEY login_attempts_ip_idx (ip, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------
-- events
-- ----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS events (
  id                    CHAR(36)     NOT NULL,
  title                 VARCHAR(200) NOT NULL,
  slug                  VARCHAR(120) NOT NULL,
  category              ENUM('Natal','Paskah','Ibadah Rutin','Persekutuan','Retreat','Pelayanan','Aksi Sosial','Lainnya')
                        NOT NULL DEFAULT 'Lainnya',
  summary               VARCHAR(300) NULL,
  description           MEDIUMTEXT   NULL,
  cover_image_url       VARCHAR(2000) NULL,
  start_at              DATETIME(3)  NULL,
  end_at                DATETIME(3)  NULL,
  location              VARCHAR(500) NULL,
  event_mode            ENUM('offline','online','hybrid','tbd') NOT NULL DEFAULT 'tbd',
  registration_url      VARCHAR(2000) NULL,
  registration_open_at  DATETIME(3)  NULL,
  registration_close_at DATETIME(3)  NULL,
  registration_status   ENUM('not_open','open','closed','external_only') NOT NULL DEFAULT 'not_open',
  -- external = tautan luar (Google Form); internal = formulir buatan panel admin.
  registration_mode     ENUM('external','internal') NOT NULL DEFAULT 'external',
  cost_info             TEXT NULL,
  dress_code            TEXT NULL,
  participant_rules     TEXT NULL,
  contact_info          TEXT NULL,
  resource_url          VARCHAR(2000) NULL,
  is_featured           TINYINT(1)   NOT NULL DEFAULT 0,
  status                ENUM('draft','published','archived','cancelled') NOT NULL DEFAULT 'draft',
  created_by            CHAR(36)     NULL,
  updated_by            CHAR(36)     NULL,
  created_at            DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at            DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  published_at          DATETIME(3)  NULL,
  PRIMARY KEY (id),
  UNIQUE KEY events_slug_uq (slug),
  KEY events_status_start_idx (status, start_at),
  KEY events_category_idx (category),
  KEY events_featured_idx (is_featured),
  KEY events_published_at_idx (published_at),
  CONSTRAINT events_created_by_fk FOREIGN KEY (created_by) REFERENCES admin_users (id) ON DELETE SET NULL,
  CONSTRAINT events_updated_by_fk FOREIGN KEY (updated_by) REFERENCES admin_users (id) ON DELETE SET NULL,
  CONSTRAINT events_title_chk CHECK (CHAR_LENGTH(TRIM(title)) BETWEEN 3 AND 200),
  CONSTRAINT events_slug_chk CHECK ((slug COLLATE utf8mb4_bin) REGEXP '^[a-z0-9]+(-[a-z0-9]+)*$'),
  CONSTRAINT events_description_chk CHECK (description IS NULL OR CHAR_LENGTH(description) <= 20000),
  -- Tautan luar wajib https agar data siswa tidak dikirim tanpa enkripsi.
  CONSTRAINT events_registration_url_https CHECK (registration_url IS NULL OR registration_url LIKE 'https://%'),
  CONSTRAINT events_resource_url_https CHECK (resource_url IS NULL OR resource_url LIKE 'https://%'),
  -- Gambar boleh https:// atau berkas unggahan lokal (/uploads/...).
  CONSTRAINT events_cover_url_chk CHECK (cover_image_url IS NULL OR cover_image_url LIKE 'https://%' OR cover_image_url LIKE '/uploads/%'),
  CONSTRAINT events_time_order CHECK (start_at IS NULL OR end_at IS NULL OR end_at >= start_at),
  CONSTRAINT events_registration_time_order CHECK (
    registration_open_at IS NULL OR registration_close_at IS NULL OR registration_close_at >= registration_open_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------
-- media_items — galeri dokumentasi
-- ----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS media_items (
  id          CHAR(36)      NOT NULL,
  event_id    CHAR(36)      NULL,
  title       VARCHAR(200)  NULL,
  caption     TEXT          NULL,
  -- Wajib demi aksesibilitas (PRD §9).
  alt_text    VARCHAR(300)  NOT NULL,
  media_url   VARCHAR(2000) NOT NULL,
  media_type  ENUM('image','video','document') NOT NULL DEFAULT 'image',
  taken_at    DATETIME(3)   NULL,
  status      ENUM('draft','published','archived') NOT NULL DEFAULT 'draft',
  sort_order  INT           NOT NULL DEFAULT 0,
  created_by  CHAR(36)      NULL,
  created_at  DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at  DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY media_items_status_sort_idx (status, sort_order, created_at),
  KEY media_items_event_idx (event_id),
  CONSTRAINT media_items_event_fk FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE SET NULL,
  CONSTRAINT media_items_created_by_fk FOREIGN KEY (created_by) REFERENCES admin_users (id) ON DELETE SET NULL,
  CONSTRAINT media_items_alt_chk CHECK (CHAR_LENGTH(TRIM(alt_text)) BETWEEN 1 AND 300),
  CONSTRAINT media_items_url_chk CHECK (media_url LIKE 'https://%' OR media_url LIKE '/uploads/%'),
  CONSTRAINT media_items_sort_chk CHECK (sort_order BETWEEN 0 AND 9999)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------
-- news_posts — berita / recap
-- ----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS news_posts (
  id              CHAR(36)      NOT NULL,
  title           VARCHAR(200)  NOT NULL,
  slug            VARCHAR(120)  NOT NULL,
  excerpt         VARCHAR(300)  NULL,
  body            MEDIUMTEXT    NULL,
  cover_image_url VARCHAR(2000) NULL,
  event_id        CHAR(36)      NULL,
  status          ENUM('draft','published','archived') NOT NULL DEFAULT 'draft',
  published_at    DATETIME(3)   NULL,
  created_by      CHAR(36)      NULL,
  updated_by      CHAR(36)      NULL,
  created_at      DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at      DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY news_posts_slug_uq (slug),
  KEY news_posts_status_published_idx (status, published_at),
  KEY news_posts_event_idx (event_id),
  CONSTRAINT news_posts_event_fk FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE SET NULL,
  CONSTRAINT news_posts_created_by_fk FOREIGN KEY (created_by) REFERENCES admin_users (id) ON DELETE SET NULL,
  CONSTRAINT news_posts_updated_by_fk FOREIGN KEY (updated_by) REFERENCES admin_users (id) ON DELETE SET NULL,
  CONSTRAINT news_posts_title_chk CHECK (CHAR_LENGTH(TRIM(title)) BETWEEN 3 AND 200),
  CONSTRAINT news_posts_slug_chk CHECK ((slug COLLATE utf8mb4_bin) REGEXP '^[a-z0-9]+(-[a-z0-9]+)*$'),
  CONSTRAINT news_posts_body_chk CHECK (body IS NULL OR CHAR_LENGTH(body) <= 50000),
  CONSTRAINT news_posts_cover_chk CHECK (cover_image_url IS NULL OR cover_image_url LIKE 'https://%' OR cover_image_url LIKE '/uploads/%')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------
-- announcements
-- ----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS announcements (
  id         CHAR(36)     NOT NULL,
  title      VARCHAR(200) NOT NULL,
  body       TEXT         NULL,
  starts_at  DATETIME(3)  NULL,
  ends_at    DATETIME(3)  NULL,
  priority   INT          NOT NULL DEFAULT 0,
  status     ENUM('draft','published','archived') NOT NULL DEFAULT 'draft',
  created_by CHAR(36)     NULL,
  created_at DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY announcements_active_idx (status, priority, starts_at),
  CONSTRAINT announcements_created_by_fk FOREIGN KEY (created_by) REFERENCES admin_users (id) ON DELETE SET NULL,
  CONSTRAINT announcements_title_chk CHECK (CHAR_LENGTH(TRIM(title)) BETWEEN 3 AND 200),
  CONSTRAINT announcements_body_chk CHECK (body IS NULL OR CHAR_LENGTH(body) <= 5000),
  CONSTRAINT announcements_priority_chk CHECK (priority BETWEEN 0 AND 100),
  CONSTRAINT announcements_time_order CHECK (starts_at IS NULL OR ends_at IS NULL OR ends_at >= starts_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------
-- site_settings — konfigurasi situs oleh admin
-- ----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS site_settings (
  id         CHAR(36)    NOT NULL,
  `key`      VARCHAR(64) NOT NULL,
  value      TEXT        NULL,
  updated_by CHAR(36)    NULL,
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY site_settings_key_uq (`key`),
  CONSTRAINT site_settings_updated_by_fk FOREIGN KEY (updated_by) REFERENCES admin_users (id) ON DELETE SET NULL,
  CONSTRAINT site_settings_key_chk CHECK ((`key` COLLATE utf8mb4_bin) REGEXP '^[a-z0-9_]+$')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- Formulir internal (lihat juga database/migrations/2026-10-formulir-internal.sql)
-- =====================================================================

-- ----------------------------------------------------------------------
-- event_forms — satu formulir internal per kegiatan
--
-- definition berisi dokumen JSON (bagian → pertanyaan), divalidasi oleh
-- lib/forms/definition-schema.ts. Disimpan sebagai LONGTEXT + JSON_VALID
-- (bukan tipe JSON) agar terbaca sama di MySQL dan MariaDB.
--   version  naik setiap isi definisi berubah (snapshot di event_form_versions)
--   revision naik setiap kali disimpan (kunci optimistis antar-admin)
--   response_count dijaga di dalam transaksi terkunci (kuota atomik)
-- ----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS event_forms (
  id                   CHAR(36)          NOT NULL,
  event_id             CHAR(36)          NOT NULL,
  definition           LONGTEXT          NOT NULL,
  definition_hash      CHAR(64)          NOT NULL,
  version              INT UNSIGNED      NOT NULL DEFAULT 1,
  revision             INT UNSIGNED      NOT NULL DEFAULT 1,
  question_count       SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  response_count       INT UNSIGNED      NOT NULL DEFAULT 0,
  quota                INT UNSIGNED      NULL,
  collect_email        TINYINT(1)        NOT NULL DEFAULT 1,
  limit_one_per_email  TINYINT(1)        NOT NULL DEFAULT 0,
  allow_edit           TINYINT(1)        NOT NULL DEFAULT 1,
  send_confirmation    TINYINT(1)        NOT NULL DEFAULT 0,
  confirmation_message VARCHAR(2000)     NULL,
  consent_text         VARCHAR(1000)     NULL,
  created_by           CHAR(36)          NULL,
  updated_by           CHAR(36)          NULL,
  created_at           DATETIME(3)       NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at           DATETIME(3)       NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY event_forms_event_uq (event_id),
  CONSTRAINT event_forms_event_fk FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE,
  CONSTRAINT event_forms_created_by_fk FOREIGN KEY (created_by) REFERENCES admin_users (id) ON DELETE SET NULL,
  CONSTRAINT event_forms_updated_by_fk FOREIGN KEY (updated_by) REFERENCES admin_users (id) ON DELETE SET NULL,
  CONSTRAINT event_forms_definition_chk CHECK (JSON_VALID(definition)),
  CONSTRAINT event_forms_quota_chk CHECK (quota IS NULL OR quota BETWEEN 1 AND 100000),
  -- "Satu respons per email" dan "kirim salinan" butuh alamat email responden.
  CONSTRAINT event_forms_one_email_chk CHECK (limit_one_per_email = 0 OR collect_email = 1),
  CONSTRAINT event_forms_confirm_chk CHECK (send_confirmation = 0 OR collect_email = 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------
-- event_form_versions — snapshot definisi setiap versi, agar respons lama
-- tetap bisa ditampilkan setelah pertanyaan/opsi diubah atau dihapus.
-- ----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS event_form_versions (
  form_id     CHAR(36)     NOT NULL,
  version     INT UNSIGNED NOT NULL,
  definition  LONGTEXT     NOT NULL,
  created_by  CHAR(36)     NULL,
  created_at  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (form_id, version),
  CONSTRAINT event_form_versions_form_fk FOREIGN KEY (form_id) REFERENCES event_forms (id) ON DELETE CASCADE,
  CONSTRAINT event_form_versions_by_fk FOREIGN KEY (created_by) REFERENCES admin_users (id) ON DELETE SET NULL,
  CONSTRAINT event_form_versions_def_chk CHECK (JSON_VALID(definition))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------
-- form_responses — jawaban peserta
--
-- answers: JSON berkunci id pertanyaan (bukan label). dedupe_key diisi
-- email_norm HANYA bila "satu respons per email" aktif saat dikirim, sehingga
-- UNIQUE(form_id, dedupe_key) menjadi pengaman tanpa partial index (yang
-- tidak tersedia di MySQL maupun MariaDB). Pemeriksaan utama ada di
-- transaksi terkunci pada lib/actions/formulir-publik.ts.
-- edit_token_hash: sha256 token tautan ubah; token asli tidak pernah disimpan.
-- ----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS form_responses (
  id               CHAR(36)          NOT NULL,
  form_id          CHAR(36)          NOT NULL,
  form_version     INT UNSIGNED      NOT NULL,
  respondent_email VARCHAR(254)      NULL,
  email_norm       VARCHAR(254)      NULL,
  dedupe_key       VARCHAR(254)      NULL,
  answers          LONGTEXT          NOT NULL,
  edit_token_hash  CHAR(64)          NULL,
  edit_count       SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  email_status     ENUM('none','pending','sent','failed') NOT NULL DEFAULT 'none',
  email_sent_at    DATETIME(3)       NULL,
  ip               VARCHAR(64)       NULL,
  user_agent       VARCHAR(255)      NULL,
  submitted_at     DATETIME(3)       NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  edited_at        DATETIME(3)       NULL,
  PRIMARY KEY (id),
  UNIQUE KEY form_responses_dedupe_uq (form_id, dedupe_key),
  UNIQUE KEY form_responses_edit_token_uq (edit_token_hash),
  KEY form_responses_form_submitted_idx (form_id, submitted_at),
  KEY form_responses_form_email_idx (form_id, email_norm),
  CONSTRAINT form_responses_form_fk FOREIGN KEY (form_id) REFERENCES event_forms (id) ON DELETE CASCADE,
  CONSTRAINT form_responses_answers_chk CHECK (JSON_VALID(answers))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------
-- form_response_files — berkas unggahan peserta
--
-- Disimpan di FORM_UPLOAD_DIR (privat, BUKAN folder /uploads publik) dengan
-- kunci "<formId>/<responseId>/<fileId>" tanpa ekstensi. mime berasal dari
-- deteksi isi berkas, bukan dari klaim browser.
-- ----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS form_response_files (
  id            CHAR(36)     NOT NULL,
  response_id   CHAR(36)     NOT NULL,
  question_id   VARCHAR(16)  NOT NULL,
  storage_key   VARCHAR(120) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  mime          VARCHAR(100) NOT NULL,
  size_bytes    INT UNSIGNED NOT NULL,
  created_at    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY form_response_files_response_idx (response_id),
  CONSTRAINT form_response_files_response_fk FOREIGN KEY (response_id) REFERENCES form_responses (id) ON DELETE CASCADE,
  CONSTRAINT form_response_files_size_chk CHECK (size_bytes BETWEEN 1 AND 10485760),
  CONSTRAINT form_response_files_key_chk CHECK (
    (storage_key COLLATE utf8mb4_bin) REGEXP '^[0-9a-f-]{36}/[0-9a-f-]{36}/[0-9a-f-]{36}$')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------
-- form_rate_events — pembatas laju kiriman/ubah/email formulir publik.
-- Dipangkas otomatis oleh aplikasi (baris > 2 hari).
-- ----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS form_rate_events (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  form_id     CHAR(36)        NOT NULL,
  kind        ENUM('submit','edit','email') NOT NULL,
  ip          VARCHAR(64)     NOT NULL,
  email_norm  VARCHAR(254)    NULL,
  created_at  DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY form_rate_events_ip_idx (form_id, kind, ip, created_at),
  KEY form_rate_events_email_idx (kind, email_norm, created_at),
  KEY form_rate_events_created_idx (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
