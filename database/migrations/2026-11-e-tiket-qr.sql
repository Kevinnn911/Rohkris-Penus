-- =====================================================================
-- Rohkris Pelita Nusantara — Migrasi E-Tiket & Kode QR
-- database/migrations/2026-11-e-tiket-qr.sql
-- =====================================================================

-- 1. Tambah kolom konfigurasi tiket pada event_forms
ALTER TABLE event_forms
  ADD COLUMN ticket_enabled TINYINT(1) NOT NULL DEFAULT 1 AFTER consent_text,
  ADD COLUMN ticket_name_question_id VARCHAR(16) NULL AFTER ticket_enabled,
  ADD COLUMN ticket_redemption_mode ENUM('flexible','all_in_one') NOT NULL DEFAULT 'flexible' AFTER ticket_name_question_id,
  ADD COLUMN ticket_benefits_config TEXT NULL AFTER ticket_redemption_mode;

-- 2. Buat tabel event_tickets (tiket presensi dan induk kupon)
CREATE TABLE IF NOT EXISTS event_tickets (
  id               CHAR(36)          NOT NULL,
  response_id      CHAR(36)          NOT NULL,
  event_id         CHAR(36)          NOT NULL,
  ticket_code      VARCHAR(32)       NOT NULL,
  attendee_name    VARCHAR(120)      NOT NULL,
  attendee_email   VARCHAR(254)      NULL,
  checkin_status   ENUM('unattended','attended') NOT NULL DEFAULT 'unattended',
  checkin_at       DATETIME(3)       NULL,
  checked_in_by    CHAR(36)          NULL,
  created_at       DATETIME(3)       NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at       DATETIME(3)       NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY event_tickets_response_uq (response_id),
  UNIQUE KEY event_tickets_code_uq (ticket_code),
  KEY event_tickets_event_idx (event_id, checkin_status),
  KEY event_tickets_name_idx (event_id, attendee_name),
  CONSTRAINT event_tickets_response_fk FOREIGN KEY (response_id) REFERENCES form_responses (id) ON DELETE CASCADE,
  CONSTRAINT event_tickets_event_fk FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE,
  CONSTRAINT event_tickets_admin_fk FOREIGN KEY (checked_in_by) REFERENCES admin_users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Buat tabel ticket_benefits (kupon konsumsi, photobooth, souvenir, dll.)
CREATE TABLE IF NOT EXISTS ticket_benefits (
  id           CHAR(36)          NOT NULL,
  ticket_id    CHAR(36)          NOT NULL,
  benefit_key  VARCHAR(64)       NOT NULL,
  benefit_name VARCHAR(100)      NOT NULL,
  status       ENUM('unclaimed','claimed') NOT NULL DEFAULT 'unclaimed',
  claimed_at   DATETIME(3)       NULL,
  claimed_by   CHAR(36)          NULL,
  created_at   DATETIME(3)       NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY ticket_benefits_ticket_key_uq (ticket_id, benefit_key),
  KEY ticket_benefits_status_idx (ticket_id, status),
  CONSTRAINT ticket_benefits_ticket_fk FOREIGN KEY (ticket_id) REFERENCES event_tickets (id) ON DELETE CASCADE,
  CONSTRAINT ticket_benefits_admin_fk FOREIGN KEY (claimed_by) REFERENCES admin_users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
