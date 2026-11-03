// File: components/tiket/AksiUnduhTiket.tsx

"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { IconCheck, IconDownload, IconPrinter } from "@/components/ui/Icons";

export type AksiUnduhTiketProps = {
  ticketCode: string;
  attendeeName: string;
  attendeeEmail?: string | null;
  attendeePhone?: string | null;
  attendeeOrg?: string | null;
  eventTitle: string;
  eventSummary?: string | null;
  eventDate?: string | null;
  eventLocation?: string | null;
  bannerUrl?: string | null;
  price?: string | null;
  orderId?: string | null;
  qrDataUrl: string;
  benefits?: Array<{ key: string; name: string }>;
};

export function AksiUnduhTiket({
  ticketCode,
  attendeeName,
  attendeeEmail,
  attendeePhone,
  attendeeOrg,
  eventTitle,
  eventSummary,
  eventDate,
  eventLocation,
  bannerUrl,
  price,
  orderId,
  qrDataUrl,
  benefits = [],
}: AksiUnduhTiketProps) {
  const [mengunduh, setMengunduh] = useState(false);
  const [tersimpan, setTersimpan] = useState(false);

  /**
   * Menghasilkan gambar e-tiket beresolusi tinggi menggunakan Canvas API.
   * Format visual identik dengan desain kartu resmi gelap (dark-mode),
   * bebas glitch, dan kompatibel di semua peramban desktop maupun ponsel.
   */
  async function unduhGambarTiket() {
    try {
      setMengunduh(true);

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas context tidak tersedia");

      const width = 1200;
      const height = 2480;
      canvas.width = width;
      canvas.height = height;

      // 1. Background Kartu Gelap (#18181b)
      ctx.fillStyle = "#18181b";
      ctx.fillRect(0, 0, width, height);

      // 2. Banner Atas
      const yOffset = 260;
      let bannerLoaded = false;
      if (bannerUrl) {
        try {
          const bannerImg = new window.Image();
          bannerImg.crossOrigin = "anonymous";
          await new Promise<void>((resolve, reject) => {
            bannerImg.onload = () => resolve();
            bannerImg.onerror = reject;
            bannerImg.src = bannerUrl;
          });
          ctx.drawImage(bannerImg, 0, 0, width, 260);
          bannerLoaded = true;
        } catch {
          bannerLoaded = false;
        }
      }

      if (!bannerLoaded) {
        // Fallback banner bertema Rohkris
        ctx.fillStyle = "#09090b";
        ctx.fillRect(0, 0, width, 260);

        ctx.fillStyle = "#f6f06a";
        ctx.font = "bold 24px sans-serif";
        ctx.fillText("SMK PLUS PELITA NUSANTARA", 80, 110);

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 40px sans-serif";
        ctx.fillText("ROHANI KRISTEN (ROHKRIS)", 80, 165);
      }

      // 3. Header Acara Terpusat
      ctx.textAlign = "center";
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 44px sans-serif";

      // Word-wrap untuk judul acara
      const maxTitleWidth = width - 160;
      const words = eventTitle.split(" ");
      let currentLine = "";
      let yTitle = yOffset + 70;
      for (const word of words) {
        const testLine = currentLine + (currentLine ? " " : "") + word;
        if (ctx.measureText(testLine).width > maxTitleWidth) {
          ctx.fillText(currentLine, width / 2, yTitle);
          currentLine = word;
          yTitle += 54;
        } else {
          currentLine = testLine;
        }
      }
      ctx.fillText(currentLine, width / 2, yTitle);

      if (eventSummary) {
        yTitle += 42;
        ctx.fillStyle = "#a1a1aa";
        ctx.font = "normal 26px sans-serif";
        ctx.fillText(eventSummary, width / 2, yTitle);
      }

      if (eventDate) {
        yTitle += 38;
        ctx.fillStyle = "#a1a1aa";
        ctx.font = "normal 24px sans-serif";
        ctx.fillText(eventDate, width / 2, yTitle);
      }

      // 4. Kotak Kode QR Putih Bersih di Tengah
      const qrBoxSize = 440;
      const qrBoxX = (width - qrBoxSize) / 2;
      const qrBoxY = yTitle + 35;

      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.roundRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 24);
      ctx.fill();

      // Muat Gambar QR Code
      const qrImg = new window.Image();
      qrImg.crossOrigin = "anonymous";
      await new Promise<void>((resolve, reject) => {
        qrImg.onload = () => resolve();
        qrImg.onerror = reject;
        qrImg.src = qrDataUrl;
      });
      ctx.drawImage(qrImg, qrBoxX + 20, qrBoxY + 20, qrBoxSize - 40, qrBoxSize - 40);

      // Kembalikan ke text-align left untuk bagian formulir
      ctx.textAlign = "left";

      const renderContext: CanvasRenderingContext2D = ctx;

      // 5. Garis Pembatas
      let yCursor = qrBoxY + qrBoxSize + 45;
      function drawDivider(y: number) {
        renderContext.strokeStyle = "#27272a";
        renderContext.lineWidth = 2;
        renderContext.beginPath();
        renderContext.moveTo(80, y);
        renderContext.lineTo(width - 80, y);
        renderContext.stroke();
      }

      drawDivider(yCursor);
      yCursor += 40;

      // 6. DETAIL PESERTA
      renderContext.fillStyle = "#d4d4d8";
      renderContext.font = "bold 26px sans-serif";
      renderContext.fillText("DETAIL PESERTA", 80, yCursor);

      yCursor += 38;
      const colLabelX = 80;
      const colValueX = 340;

      function drawRow(label: string, value: string, isBold = false) {
        renderContext.fillStyle = "#a1a1aa";
        renderContext.font = "normal 24px sans-serif";
        renderContext.fillText(label, colLabelX, yCursor);

        renderContext.fillStyle = "#ffffff";
        renderContext.font = isBold ? "bold 24px sans-serif" : "normal 24px sans-serif";
        renderContext.fillText(value, colValueX, yCursor);
        yCursor += 36;
      }

      drawRow("Nama:", attendeeName, true);
      drawRow("Email:", attendeeEmail || "-");
      drawRow("No. WhatsApp:", attendeePhone || "-");
      drawRow("Asal:", attendeeOrg || "SMK PLUS PELITA NUSANTARA");

      yCursor += 15;
      drawDivider(yCursor);
      yCursor += 40;

      // 7. DETAIL TIKET
      ctx.fillStyle = "#d4d4d8";
      ctx.font = "bold 26px sans-serif";
      ctx.fillText("DETAIL TIKET", 80, yCursor);

      yCursor += 38;
      drawRow("Tiket ID:", ticketCode, true);
      drawRow("Harga:", price || "Gratis");
      drawRow("Order ID:", orderId || ticketCode);

      // Status Badge Hijau
      ctx.fillStyle = "#a1a1aa";
      ctx.font = "normal 24px sans-serif";
      ctx.fillText("Status:", colLabelX, yCursor);

      ctx.fillStyle = "#059669";
      ctx.beginPath();
      ctx.roundRect(colValueX, yCursor - 24, 180, 32, 6);
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 20px sans-serif";
      ctx.fillText("Sudah Dibayar", colValueX + 20, yCursor - 1);
      yCursor += 40;

      if (benefits.length > 0) {
        ctx.fillStyle = "#a1a1aa";
        ctx.font = "normal 24px sans-serif";
        ctx.fillText("Kupon:", colLabelX, yCursor);

        ctx.fillStyle = "#34d399";
        const benefitNames = benefits.map((b) => b.name).join("  •  ");
        ctx.fillText(benefitNames, colValueX, yCursor);
        yCursor += 36;
      }

      yCursor += 15;
      drawDivider(yCursor);
      yCursor += 40;

      // 8. LOKASI EVENT
      ctx.fillStyle = "#d4d4d8";
      ctx.font = "bold 26px sans-serif";
      ctx.fillText("LOKASI EVENT", 80, yCursor);

      yCursor += 38;
      ctx.fillStyle = "#ffffff";
      ctx.font = "normal 24px sans-serif";
      ctx.fillText(eventLocation || "SMK Plus Pelita Nusantara, Cibinong, Bogor", 80, yCursor);

      yCursor += 30;

      // 9. Kotak Catatan (Amber / Cokelat)
      const calloutY = yCursor;
      const calloutH = 110;
      ctx.fillStyle = "#3a1d06";
      ctx.beginPath();
      ctx.roundRect(80, calloutY, width - 160, calloutH, 16);
      ctx.fill();

      ctx.strokeStyle = "#b45309";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(80, calloutY, width - 160, calloutH, 16);
      ctx.stroke();

      ctx.fillStyle = "#fef08a";
      ctx.font = "normal 22px sans-serif";
      ctx.fillText(
        "Catatan: Peserta wajib menunjukkan e-tiket saat registrasi ulang. Simpan e-tiket dengan",
        110,
        calloutY + 45,
      );
      ctx.fillText(
        "cara mengunduh atau tangkapan layar, dan pastikan QR code terlihat jelas serta dapat dipindai.",
        110,
        calloutY + 80,
      );

      yCursor += calloutH + 25;
      drawDivider(yCursor);
      yCursor += 40;

      // 10. SYARAT DAN KETENTUAN DAFTAR
      ctx.fillStyle = "#d4d4d8";
      ctx.font = "bold 26px sans-serif";
      ctx.fillText("SYARAT DAN KETENTUAN DAFTAR", 80, yCursor);

      yCursor += 36;
      ctx.fillStyle = "#a1a1aa";
      ctx.font = "normal 21px sans-serif";

      const terms = [
        "1. Acara ini terbuka untuk seluruh peserta terdaftar kegiatan Rohkris SMK Plus Pelita Nusantara.",
        "2. Peserta wajib mendaftar melalui situs resmi Rohkris Pelita Nusantara.",
        "3. Setelah mendaftar, peserta diwajibkan bergabung ke grup WhatsApp panitia untuk informasi teknis.",
        "4. Tunjukkan kode QR e-tiket ini kepada panitia saat registrasi ulang di lokasi kegiatan.",
        "5. Peserta diwajibkan mengikuti akun-akun media sosial resmi Rohkris untuk pembaruan informasi.",
        "6. Peserta diwajibkan mematuhi seluruh arahan dan tata tertib panitia penyelenggara.",
      ];

      for (const t of terms) {
        ctx.fillText(t, 80, yCursor);
        yCursor += 32;
      }

      yCursor += 15;
      drawDivider(yCursor);
      yCursor += 40;

      // 11. PERATURAN KEGIATAN
      ctx.fillStyle = "#d4d4d8";
      ctx.font = "bold 26px sans-serif";
      ctx.fillText("PERATURAN KEGIATAN", 80, yCursor);

      yCursor += 34;
      ctx.fillStyle = "#e4e4e7";
      ctx.font = "bold 22px sans-serif";
      ctx.fillText("Do's (Hal yang dilakukan):", 80, yCursor);

      yCursor += 30;
      ctx.fillStyle = "#a1a1aa";
      ctx.font = "normal 21px sans-serif";
      const dos = [
        "• Menggunakan pakaian yang ditentukan oleh panitia (rapi dan sopan).",
        "• Membuang sampah pada tempat yang telah disediakan.",
        "• Membawa bukti pendaftaran e-tiket dan kartu identitas / kartu pelajar yang valid.",
        "• Hadir di lokasi tepat waktu sesuai jadwal acara.",
        "• Menjaga ketertiban, keamanan, dan kenyamanan seluruh peserta.",
      ];
      for (const d of dos) {
        ctx.fillText(d, 80, yCursor);
        yCursor += 29;
      }

      yCursor += 12;
      ctx.fillStyle = "#e4e4e7";
      ctx.font = "bold 22px sans-serif";
      ctx.fillText("Don'ts (Hal yang dihindari):", 80, yCursor);

      yCursor += 30;
      ctx.fillStyle = "#a1a1aa";
      ctx.font = "normal 21px sans-serif";
      const donts = [
        "• Dilarang membawa hewan peliharaan.",
        "• Dilarang membawa senjata tajam atau benda-benda berbahaya lainnya.",
        "• Dilarang membawa dan mengonsumsi minuman keras atau obat-obatan terlarang.",
        "• Dilarang merokok atau menggunakan vape di seluruh area acara.",
        "• Dilarang membuang sampah sembarangan.",
      ];
      for (const d of donts) {
        ctx.fillText(d, 80, yCursor);
        yCursor += 29;
      }

      // Footer
      yCursor += 25;
      drawDivider(yCursor);
      yCursor += 35;
      ctx.textAlign = "center";
      ctx.fillStyle = "#71717a";
      ctx.font = "normal 20px sans-serif";
      ctx.fillText("E-Tiket Resmi Rohkris SMK Plus Pelita Nusantara", width / 2, yCursor);

      // Konversi ke berkas PNG
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
