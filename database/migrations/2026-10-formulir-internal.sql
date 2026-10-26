-- =====================================================================
-- Migrasi: Formulir Internal (pendaftaran kegiatan tanpa Google Form)
--
-- Untuk database yang SUDAH berjalan. Instalasi baru cukup memakai
-- database/schema.sql (sudah memuat seluruh isi berkas ini).
--
-- JALANKAN SEKALI, SEBELUM men-deploy kode versi baru — kode baru membaca
-- kolom events.registration_mode dan tabel event_forms.
-- phpMyAdmin → pilih database → tab Import, atau:
--   mysql -u USER -p NAMA_DB < database/migrations/2026-10-formulir-internal.sql
--
-- Bagian ALTER TABLE tidak aman dijalankan dua kali (MySQL 8 tidak mengenal
-- ADD COLUMN IF NOT EXISTS). Bila muncul "Duplicate column name
-- 'registration_mode'", kolom itu sudah ada: lewati baris ALTER dan jalankan
-- sisanya saja. Seluruh CREATE TABLE aman dijalankan ulang.
--
-- Perintah ini butuh hak ALTER/CREATE — jalankan dengan akun pemilik database
-- di cPanel, bukan akun aplikasi (yang cukup SELECT/INSERT/UPDATE/DELETE).
-- =====================================================================

SET NAMES utf8mb4;

-- ----------------------------------------------------------------------
-- events.registration_mode — sumber formulir pendaftaran:
--   external = tautan luar (Google Form, perilaku lama)
--   internal = formulir buatan panel admin, respons tersimpan di server
-- Buka/tutupnya tetap diatur registration_status + registration_open_at/close_at.
-- ----------------------------------------------------------------------
ALTER TABLE events
  ADD COLUMN registration_mode ENUM('external','internal') NOT NULL DEFAULT 'external'
  AFTER registration_status;

-- (Blok tabel di bawah ini juga disalin ke database/schema.sql.)
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
