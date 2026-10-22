import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

/**
 * Konfigurasi ESLint (flat config).
 *
 * Mengimpor entrypoint flat milik eslint-config-next secara langsung —
 * jembatan FlatCompat tidak dipakai karena tidak kompatibel dengan ESLint 10.
 */
const eslintConfig = [
  ...(Array.isArray(nextCoreWebVitals) ? nextCoreWebVitals : [nextCoreWebVitals]),
  ...(Array.isArray(nextTypescript) ? nextTypescript : [nextTypescript]),
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "Rohkris_Pelita_Nusantara_Docs/**",
      "next-env.d.ts",
    ],
  },
];

export default eslintConfig;
