import { describe, expect, it } from "vitest";

import { GATE_COOKIE_NAME, hashGateKey, isGateKeyValid } from "@/lib/auth/gate-crypto";
import { getAdminSecretKey } from "@/lib/env";

describe("gerbang rahasia panel admin (gate protection)", () => {
  it("nama cookie gerbang terdefinisi dan konsisten", () => {
    expect(GATE_COOKIE_NAME).toBe("rohkris_admin_gate");
  });

  it("menghasilkan hash SHA-256 yang deterministik dan valid", () => {
    const key = "db20a436-c20d-4b5e-8543-57f8dd50277c";
    const hash1 = hashGateKey(key);
    const hash2 = hashGateKey(key);

    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64);
    expect(/^[a-f0-9]{64}$/.test(hash1)).toBe(true);
  });

  it("memvalidasi kunci UUID yang cocok dengan konfigurasi", () => {
    const previous = process.env.ADMIN_SECRET_KEY;
    try {
      process.env.ADMIN_SECRET_KEY = "test-uuid-secret-key-12345";
      const validKey = getAdminSecretKey();
      expect(validKey).toBe("test-uuid-secret-key-12345");
      expect(isGateKeyValid(validKey)).toBe(true);
      expect(isGateKeyValid(` ${validKey} `)).toBe(true);
    } finally {
      process.env.ADMIN_SECRET_KEY = previous;
    }
  });

  it("menolak akses bila ADMIN_SECRET_KEY tidak disetel di environment (fail-closed)", () => {
    const previous = process.env.ADMIN_SECRET_KEY;
    try {
      delete process.env.ADMIN_SECRET_KEY;
      expect(getAdminSecretKey()).toBe("");
      expect(isGateKeyValid("kunci-apapun")).toBe(false);
      expect(isGateKeyValid("")).toBe(false);
    } finally {
      process.env.ADMIN_SECRET_KEY = previous;
    }
  });

  it("menolak kunci yang salah, kosong, atau null", () => {
    const previous = process.env.ADMIN_SECRET_KEY;
    try {
      process.env.ADMIN_SECRET_KEY = "test-uuid-secret-key-12345";
      expect(isGateKeyValid("kunci-salah-123")).toBe(false);
      expect(isGateKeyValid("")).toBe(false);
      expect(isGateKeyValid(undefined)).toBe(false);
      expect(isGateKeyValid(null)).toBe(false);
    } finally {
      process.env.ADMIN_SECRET_KEY = previous;
    }
  });
});

