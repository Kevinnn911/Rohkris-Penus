// File: lib/tickets/qr.ts

import QRCode from "qrcode";

import { signTicketCode } from "@/lib/tickets/ticket-code";

/**
 * Payload resmi yang dikodekan ke dalam QR:
 * ROHKRIS:TICKET:<KODE_TIKET>:<SIGNATURE>
 */
export function buildQrPayload(ticketCode: string): string {
  const sig = signTicketCode(ticketCode);
  return `ROHKRIS:TICKET:${ticketCode}:${sig}`;
}

/**
 * Menghasilkan QR Code dalam bentuk Data URL (PNG base64).
 * Sangat cocok untuk <img src={dataUrl} />, download gambar, maupun lampiran email CID.
 */
export async function generateQrDataUrl(ticketCode: string, size = 320): Promise<string> {
  const payload = buildQrPayload(ticketCode);
  return QRCode.toDataURL(payload, {
    width: size,
    margin: 2,
    color: {
      dark: "#0d0d0f", // navy-950
      light: "#ffffff",
    },
    errorCorrectionLevel: "H", // High error correction agar tahan gores / sudut kamera miring
  });
}

/**
 * Menghasilkan QR Code dalam bentuk string SVG murni untuk rendering tajam di web.
 */
export async function generateQrSvg(ticketCode: string): Promise<string> {
  const payload = buildQrPayload(ticketCode);
  return QRCode.toString(payload, {
    type: "svg",
    margin: 2,
    color: {
      dark: "#0d0d0f",
      light: "#ffffff",
    },
    errorCorrectionLevel: "H",
  });
}
