// File: components/tiket/AksiUnduhTiket.tsx

"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { IconCheck, IconDownload, IconPrinter } from "@/components/ui/Icons";

export type AksiUnduhTiketProps = {
  ticketCode: string;
  attendeeName: string;
  eventTitle: string;
  eventDate?: string | null;
  eventLocation?: string | null;
  qrDataUrl: string;
  benefits?: Array<{ key: string; name: string }>;
};

export function AksiUnduhTiket({
  ticketCode,
  attendeeName,
  eventTitle,
  eventDate,
  eventLocation,
  qrDataUrl,
  benefits = [],
}: AksiUnduhTiketProps) {
  const [mengunduh, setMengunduh] = useState(false);
  const [tersimpan, setTersimpan] = useState(false);

  /**
   * Menghasilkan gambar tiket beresolusi tinggi menggunakan Canvas API.
   * Tidak memerlukan dependensi eksternal, sangat cepat, dan kompatibel di semua ponsel.
   */
  async function unduhGambarTiket() {
    try {
      setMengunduh(true);

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas context tidak tersedia");

      const width = 1200;
      const height = 1500;
      canvas.width = width;
      canvas.height = height;

      // 1. Background putih dengan sudut melengkung
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);

      // 2. Header Navy
      ctx.fillStyle = "#0d0d0f"; // navy-950
      ctx.fillRect(0, 0, width, 420);

      // Aksen Garis Emas
      ctx.fillStyle = "#f6f06a"; // gold-300
      ctx.fillRect(0, 412, width, 8);

      // 3. Teks Header
      ctx.fillStyle = "#f6f06a";
      ctx.font = "bold 28px sans-serif";
      ctx.fillText("E-TIKET RESMI", 80, 80);

      ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
      ctx.font = "normal 26px sans-serif";
      ctx.fillText("SMK PLUS PELITA NUSANTARA · ROHANI KRISTEN", 80, 125);

      // Judul Acara (Word wrap)
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 48px sans-serif";
      const maxTitleWidth = width - 160;
      const kata = eventTitle.split(" ");
      let baris = "";
      let yJudul = 200;
      for (const k of kata) {
        const testBaris = baris + (baris ? " " : "") + k;
        if (ctx.measureText(testBaris).width > maxTitleWidth) {
          ctx.fillText(baris, 80, yJudul);
          baris = k;
          yJudul += 60;
        } else {
          baris = testBaris;
        }
      }
      ctx.fillText(baris, 80, yJudul);

      // Waktu & Lokasi
      ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
      ctx.font = "normal 28px sans-serif";
      let metaText = "";
      if (eventDate) metaText += eventDate;
      if (eventLocation) metaText += (metaText ? "  |  " : "") + eventLocation;
      if (metaText) {
        ctx.fillText(metaText, 80, yJudul + 65);
      }

      // 4. Data Peserta
      ctx.fillStyle = "#6f6f78";
      ctx.font = "600 24px sans-serif";
      ctx.fillText("NAMA PESERTA", 80, 520);

      ctx.fillStyle = "#0d0d0f";
      ctx.font = "bold 44px sans-serif";
      ctx.fillText(attendeeName, 80, 580);

      ctx.fillStyle = "#6f6f78";
      ctx.font = "600 24px sans-serif";
      ctx.fillText("NOMOR TIKET", 80, 680);

      // Kotak Nomor Tiket
      ctx.fillStyle = "#f6f6f7";
      ctx.fillRect(80, 710, 480, 70);
      ctx.strokeStyle = "#dedee2";
      ctx.lineWidth = 2;
      ctx.strokeRect(80, 710, 480, 70);

      ctx.fillStyle = "#0d0d0f";
      ctx.font = "bold 36px monospace";
      ctx.fillText(ticketCode, 110, 758);

      // Fasilitas / Kupon
      if (benefits.length > 0) {
        ctx.fillStyle = "#6f6f78";
        ctx.font = "600 24px sans-serif";
        ctx.fillText("KUPON & FASILITAS TERSEDIA", 80, 850);

        ctx.fillStyle = "#175c41";
        ctx.font = "bold 26px sans-serif";
        ctx.fillText("• Presensi Kehadiran", 80, 900);

        let yBenefit = 945;
        for (const b of benefits) {
          ctx.fillStyle = "#75680a";
          ctx.fillText(`• ${b.name}`, 80, yBenefit);
          yBenefit += 45;
        }
      }

      // 5. Muat Gambar QR Code
      const qrImg = new window.Image();
      qrImg.crossOrigin = "anonymous";
      await new Promise<void>((resolve, reject) => {
        qrImg.onload = () => resolve();
        qrImg.onerror = reject;
        qrImg.src = qrDataUrl;
      });

      // Kotak QR Code di Kanan
      const qrBoxX = 720;
      const qrBoxY = 500;
      const qrBoxSize = 400;

      ctx.fillStyle = "#f9f9fb";
      ctx.fillRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize + 60);
      ctx.strokeStyle = "#dedee2";
      ctx.lineWidth = 2;
      ctx.strokeRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize + 60);

      ctx.drawImage(qrImg, qrBoxX + 25, qrBoxY + 25, 350, 350);

      ctx.fillStyle = "#55555d";
      ctx.font = "500 22px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Pindai saat tiba di lokasi", qrBoxX + qrBoxSize / 2, qrBoxY + 420);
      ctx.textAlign = "left";

      // 6. Garis Pembatas Bawah & Footer
      ctx.strokeStyle = "#e5e7eb";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(80, 1340);
      ctx.lineTo(width - 80, 1340);
      ctx.stroke();

      ctx.fillStyle = "#6f6f78";
      ctx.font = "normal 22px sans-serif";
      ctx.fillText(
        "Tunjukkan QR Code ini kepada panitia saat registrasi di lokasi acara.",
        80,
        1390,
      );
      ctx.fillText(
        "© Rohkris SMK Plus Pelita Nusantara · Harap bawa kartu identitas siswa jika diminta.",
        80,
        1430,
      );

      // Download file PNG
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), "image/png"),
      );
      if (!blob) throw new Error("Gagal mengonversi gambar tiket");

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `E-Tiket-${ticketCode}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setTersimpan(true);
      setTimeout(() => setTersimpan(false), 3000);
    } catch (err) {
      console.error("Gagal mengunduh gambar tiket:", err);
      alert("Gagal mengunduh tiket sebagai gambar. Silakan gunakan tombol Cetak / PDF.");
    } finally {
      setMengunduh(false);
    }
  }

  function cetakTiket() {
    window.print();
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <Button
        type="button"
        variant="primary"
        size="md"
        onClick={unduhGambarTiket}
        disabled={mengunduh}
        className="font-semibold shadow-button"
      >
        {tersimpan ? (
          <>
            <IconCheck className="size-4" />
            Tiket Tersimpan
          </>
        ) : (
          <>
            <IconDownload className="size-4" />
            {mengunduh ? "Menyiapkan Gambar…" : "Download Tiket (Gambar)"}
          </>
        )}
      </Button>

      <Button
        type="button"
        variant="secondary"
        size="md"
        onClick={cetakTiket}
        className="font-medium"
      >
        <IconPrinter className="size-4" />
        Cetak / Simpan PDF
      </Button>
    </div>
  );
}
