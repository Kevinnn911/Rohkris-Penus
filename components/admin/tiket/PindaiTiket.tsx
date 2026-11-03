// File: components/admin/tiket/PindaiTiket.tsx

"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";

import { Button } from "@/components/ui/Button";
import {
  IconAlert,
  IconCheck,
  IconChevronRight,
  IconEye,
  IconFilter,
  IconList,
  IconSearch,
} from "@/components/ui/Icons";
import {
  konfirmasiKehadiran,
  konfirmasiKupon,
  konfirmasiSemua,
  periksaKodeTiket,
  type TicketScanResult,
} from "@/lib/actions/scan-admin";
import { cn } from "@/lib/cn";

function playAudioTone(type: "success" | "warning" | "error") {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === "success") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } else if (type === "warning") {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      osc.frequency.setValueAtTime(240, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } else {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    }
  } catch {
    // Abaikan jika browser membatasi autoplay audio
  }
}

type ScanHistoryItem = {
  id: string;
  ticketCode: string;
  name: string;
  status: "valid" | "already_checked_in";
  scannedAt: string;
};

export function PindaiTiket({
  eventId,
  eventTitle,
}: {
  eventId: string;
  eventTitle: string;
}) {
  const [manualInput, setManualInput] = useState("");
  const [kameraAktif, setKameraAktif] = useState(false);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [galatKamera, setGalatKamera] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [scanResult, setScanResult] = useState<TicketScanResult | null>(null);
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  const [pending, startTransition] = useTransition();
  const [feedbackAksi, setFeedbackAksi] = useState<{ ok: boolean; message: string } | null>(null);

  // Auto-focus manual input field saat tidak ada tiket aktif
  useEffect(() => {
    if (!scanResult && inputRef.current) {
      inputRef.current.focus();
    }
  }, [scanResult]);

  // Hentikan stream kamera saat unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  async function toggleKamera() {
    if (kameraAktif) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      setKameraAktif(false);
      return;
    }

    setGalatKamera(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facingMode },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setKameraAktif(true);
    } catch {
      setGalatKamera("Tidak dapat mengakses kamera. Pastikan izin kamera aktif pada peramban Anda.");
    }
  }

  function gantiKamera() {
    const modeBaru = facingMode === "environment" ? "user" : "environment";
    setFacingMode(modeBaru);
    if (kameraAktif) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: modeBaru } })
        .then((stream) => {
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
          }
        })
        .catch(() => {
          setGalatKamera("Gagal beralih kamera.");
        });
    }
  }

  const prosesScan = useCallback((rawText: string) => {
    if (!rawText.trim() || pending) return;
    setFeedbackAksi(null);

    startTransition(async () => {
      const res = await periksaKodeTiket(rawText);
      setScanResult(res);

      if (res.ok) {
        if (res.status === "already_checked_in") {
          playAudioTone("warning");
        } else {
          playAudioTone("success");
        }

        setHistory((prev) => [
          {
            id: res.ticket.id,
            ticketCode: res.ticket.ticketCode,
            name: res.ticket.attendeeName,
            status: res.status,
            scannedAt: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
          },
          ...prev.slice(0, 19),
        ]);
      } else {
        playAudioTone("error");
      }
    });

    setManualInput("");
  }, [pending]);

  const prosesScanRef = useRef(prosesScan);
  useEffect(() => {
    prosesScanRef.current = prosesScan;
  }, [prosesScan]);

  // Loop deteksi frame QR dari kamera (BarcodeDetector API bila didukung)
  useEffect(() => {
    if (!kameraAktif || !videoRef.current) return;
    let animId: number;
    let detector: { detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue: string }>> } | null = null;

    if (typeof window !== "undefined" && "BarcodeDetector" in window) {
      try {
        const BD = (window as unknown as { BarcodeDetector: new (opts: { formats: string[] }) => typeof detector }).BarcodeDetector;
        detector = new BD({ formats: ["qr_code", "code_128"] });
      } catch {
        detector = null;
      }
    }

    let isScanning = true;
    const checkFrame = async () => {
      if (
        isScanning &&
        videoRef.current &&
        videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA &&
        detector &&
        !scanResult
      ) {
        try {
          const barcodes = await detector.detect(videoRef.current);
          if (barcodes.length > 0 && barcodes[0]?.rawValue) {
            prosesScanRef.current(barcodes[0].rawValue);
          }
        } catch {
          // Abaikan kesalahan deteksi per frame
        }
      }
      if (isScanning) {
        animId = requestAnimationFrame(checkFrame);
      }
    };

    animId = requestAnimationFrame(checkFrame);
    return () => {
      isScanning = false;
      cancelAnimationFrame(animId);
    };
  }, [kameraAktif, scanResult]);

  function handleCheckin() {
    if (!scanResult || !scanResult.ok) return;
    const ticketId = scanResult.ticket.id;
    startTransition(async () => {
      const res = await konfirmasiKehadiran(ticketId);
      setFeedbackAksi(res);
      if (res.ok) {
        playAudioTone("success");
        setScanResult((prev) => {
          if (!prev || !prev.ok) return prev;
          return {
            ...prev,
            status: "already_checked_in",
            ticket: {
              ...prev.ticket,
              checkinStatus: "attended",
              checkinAt: new Date().toISOString(),
            },
          };
        });
      }
    });
  }

  function handleClaimBenefit(benefitKey: string) {
    if (!scanResult || !scanResult.ok) return;
    const ticketId = scanResult.ticket.id;
    startTransition(async () => {
      const res = await konfirmasiKupon(ticketId, benefitKey);
      setFeedbackAksi(res);
      if (res.ok) {
        playAudioTone("success");
        setScanResult((prev) => {
          if (!prev || !prev.ok) return prev;
          return {
            ...prev,
            ticket: {
              ...prev.ticket,
              benefits: prev.ticket.benefits.map((b) =>
                b.key === benefitKey
                  ? { ...b, status: "claimed", claimedAt: new Date().toISOString() }
                  : b,
              ),
            },
          };
        });
      }
    });
  }

  function handleClaimAll() {
    if (!scanResult || !scanResult.ok) return;
    const ticketId = scanResult.ticket.id;
    startTransition(async () => {
      const res = await konfirmasiSemua(ticketId);
      setFeedbackAksi(res);
      if (res.ok) {
        playAudioTone("success");
        setScanResult((prev) => {
          if (!prev || !prev.ok) return prev;
          return {
            ...prev,
            status: "already_checked_in",
            ticket: {
              ...prev.ticket,
              checkinStatus: "attended",
              checkinAt: new Date().toISOString(),
              benefits: prev.ticket.benefits.map((b) => ({
                ...b,
                status: "claimed",
                claimedAt: new Date().toISOString(),
              })),
            },
          };
        });
      }
    });
  }

  function resetPemindai() {
    setScanResult(null);
    setFeedbackAksi(null);
    setManualInput("");
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      {/* Kolom Kiri: Kamera Scanner & Input Manual */}
      <div className="space-y-6 lg:col-span-5">
        <div className="rounded-3xl border border-navy-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-navy-950">Kamera Pemindai</h3>
              <p className="text-xs text-navy-500">Kegiatan: {eventTitle}</p>
            </div>
            <div className="flex items-center gap-2">
              {kameraAktif ? (
                <button
                  type="button"
                  onClick={gantiKamera}
                  className="rounded-full px-2.5 py-1 text-xs font-medium text-navy-700 ring-1 ring-inset ring-navy-200 hover:bg-navy-50"
                >
                  Balik Kamera
                </button>
              ) : null}
              <button
                type="button"
                onClick={toggleKamera}
                className={cn(
                  "pressable rounded-full px-3 py-1 text-xs font-semibold shadow-sm transition-colors",
                  kameraAktif
                    ? "bg-danger-600 text-white hover:bg-danger-700"
                    : "bg-navy-950 text-white hover:bg-navy-900",
                )}
              >
                {kameraAktif ? "Matikan Kamera" : "Nyalakan Kamera"}
              </button>
            </div>
          </div>

          {galatKamera ? (
            <p className="mt-3 text-xs font-medium text-danger-700">{galatKamera}</p>
          ) : null}

          {/* Video Preview */}
          <div className="relative mt-4 aspect-square w-full overflow-hidden rounded-2xl bg-navy-950">
            <video
              ref={videoRef}
              playsInline
              muted
              className={cn("h-full w-full object-cover", !kameraAktif && "hidden")}
            />
            {kameraAktif ? (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="size-48 rounded-2xl border-2 border-gold-400/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]" />
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center p-6 text-center text-navy-300">
                <IconFilter className="size-10 text-navy-500" />
                <p className="mt-2 text-sm font-medium text-white">Kamera tidak aktif</p>
                <p className="mt-1 text-xs text-navy-400">
                  Nyalakan kamera atau gunakan pemindai barcode eksternal / ketik manual di bawah.
                </p>
              </div>
            )}
          </div>

          {/* Form Input Manual atau Scanner Gun */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              prosesScan(manualInput);
            }}
            className="mt-4 space-y-2"
          >
            <label htmlFor="input-scan-manual" className="block text-xs font-medium text-navy-700">
              Input Kode Tiket Manual / Barcode Scanner Gun
            </label>
            <div className="flex gap-2">
              <input
                ref={inputRef}
                id="input-scan-manual"
                type="text"
                value={manualInput}
                placeholder="Misal: ROH-NATAL-7X9B2C atau tempel payload"
                onChange={(e) => setManualInput(e.target.value)}
                className="w-full min-h-11 rounded-2xl border border-navy-200 px-4 font-mono text-sm uppercase placeholder:font-sans placeholder:normal-case focus:border-navy-950 focus:outline-none focus:ring-2 focus:ring-gold-200"
              />
              <Button type="submit" disabled={!manualInput.trim() || pending} className="shrink-0 px-4">
                <IconSearch className="size-4" />
                Cek
              </Button>
            </div>
            <p className="text-[11px] text-navy-500">
              Tips: Jika panitia menggunakan Barcode Scanner USB, cukup arahkan scanner ke layar peserta (input otomatis terisi).
            </p>
          </form>
        </div>

        {/* Riwayat Pindaian Terkini */}
        <div className="rounded-3xl border border-navy-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-navy-100 pb-3">
            <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-navy-600">
              <IconList className="size-4" />
              Riwayat Pindaian Sesi Ini ({history.length})
            </h4>
            {history.length > 0 ? (
              <button
                type="button"
                onClick={() => setHistory([])}
                className="text-[11px] font-medium text-navy-500 hover:text-navy-950"
              >
                Hapus
              </button>
            ) : null}
          </div>

          {history.length === 0 ? (
            <p className="mt-4 text-center text-xs text-navy-400">Belum ada tiket yang dipindai pada sesi ini.</p>
          ) : (
            <ul className="mt-3 divide-y divide-navy-50 text-xs">
              {history.map((h, i) => (
                <li key={`${h.id}-${i}`} className="flex items-center justify-between py-2">
                  <div className="min-w-0 pr-2">
                    <p className="font-semibold text-navy-950 truncate">{h.name}</p>
                    <p className="font-mono text-[11px] text-navy-500">{h.ticketCode}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.5 text-[10px] font-semibold",
                        h.status === "valid" ? "bg-sage-100 text-sage-800" : "bg-amber-100 text-amber-800",
                      )}
                    >
                      {h.status === "valid" ? "Valid" : "Sudah Check-in"}
                    </span>
                    <p className="mt-0.5 text-[10px] text-navy-400">{h.scannedAt}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Kolom Kanan: Hasil Pindaian & Aksi Konfirmasi */}
      <div className="space-y-6 lg:col-span-7">
        {feedbackAksi ? (
          <div
            role={feedbackAksi.ok ? "status" : "alert"}
            className={cn(
              "flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium",
              feedbackAksi.ok ? "border-sage-300 bg-sage-100 text-sage-800" : "border-danger-600/20 bg-danger-50 text-danger-700",
            )}
          >
            {feedbackAksi.ok ? <IconCheck className="size-4 shrink-0 text-sage-700" /> : <IconAlert className="size-4 shrink-0" />}
            <span>{feedbackAksi.message}</span>
          </div>
        ) : null}

        {!scanResult ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-navy-300 bg-white p-12 text-center shadow-sm">
            <div className="rounded-full bg-navy-50 p-4">
              <IconFilter className="size-12 text-navy-400" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-navy-950">Menunggu Pemindaian Tiket</h3>
            <p className="mt-1 max-w-sm text-sm text-navy-600">
              Arahkan kamera ke kode QR peserta atau masukkan kode tiket secara manual untuk memeriksa keaslian dan status presensi.
            </p>
          </div>
        ) : !scanResult.ok ? (
          <div className="rounded-3xl border-2 border-danger-500 bg-white p-6 shadow-md">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-danger-100 p-3 text-danger-700">
                <IconAlert className="size-8" />
              </div>
              <div className="flex-1">
                <span className="inline-block rounded-md bg-danger-100 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-danger-700">
                  Tiket Tidak Valid
                </span>
                <h3 className="mt-2 text-xl font-bold text-navy-950">Pemeriksaan Gagal</h3>
                <p className="mt-1 text-sm text-danger-800 leading-relaxed">{scanResult.message}</p>
                <div className="mt-6">
                  <Button type="button" variant="secondary" onClick={resetPemindai}>
                    Pindai Tiket Berikutnya
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div
            className={cn(
              "overflow-hidden rounded-3xl border-2 bg-white shadow-lg transition-all",
              scanResult.status === "already_checked_in"
                ? "border-amber-400 ring-4 ring-amber-100"
                : "border-sage-500 ring-4 ring-sage-100",
            )}
          >
            {/* Banner Status Besar */}
            <div
              className={cn(
                "px-6 py-4 font-bold text-white flex items-center justify-between",
                scanResult.status === "already_checked_in" ? "bg-amber-600" : "bg-sage-600",
              )}
            >
              <div className="flex items-center gap-2">
                <IconCheck className="size-5" />
                <span className="text-base uppercase tracking-wider">
                  {scanResult.status === "already_checked_in" ? "Tiket Sudah Pernah Digunakan" : "Tiket Valid & Terdaftar"}
                </span>
              </div>
              <span className="font-mono text-sm bg-white/20 rounded-md px-2.5 py-0.5">
                {scanResult.ticket.ticketCode}
              </span>
            </div>

            <div className="p-6 space-y-6">
              {/* Detail Peserta */}
              <div className="border-b border-navy-100 pb-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-navy-400">Nama Peserta</p>
                <h2 className="mt-1 text-2xl font-black text-navy-950">{scanResult.ticket.attendeeName}</h2>
                <div className="mt-2 flex flex-wrap gap-4 text-xs text-navy-600">
                  {scanResult.ticket.attendeeEmail ? (
                    <span>Email: <strong>{scanResult.ticket.attendeeEmail}</strong></span>
                  ) : null}
                  <span>Kegiatan: <strong>{scanResult.ticket.eventTitle}</strong></span>
                </div>
              </div>

              {/* Status Kehadiran & Checkin */}
              <div className="rounded-2xl border border-navy-100 bg-navy-50/70 p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-navy-500">Status Kehadiran</p>
                    {scanResult.ticket.checkinStatus === "attended" ? (
                      <div className="mt-1 flex items-center gap-2 text-sage-800">
                        <span className="inline-flex items-center gap-1 font-bold text-sm">
                          <IconCheck className="size-4 text-sage-600" />
                          Sudah Hadir
                        </span>
                        {scanResult.ticket.checkinAt ? (
                          <span className="text-xs text-navy-500">
                            pada {new Date(scanResult.ticket.checkinAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                            {scanResult.ticket.checkedInByName ? ` (${scanResult.ticket.checkedInByName})` : ""}
                          </span>
                        ) : null}
                      </div>
                    ) : (
                      <p className="mt-1 text-sm font-semibold text-amber-700">Belum Terdaftar Hadir</p>
                    )}
                  </div>

                  {scanResult.ticket.checkinStatus === "unattended" ? (
                    <Button
                      type="button"
                      onClick={handleCheckin}
                      disabled={pending}
                      className="shrink-0"
                    >
                      <IconCheck className="size-4" />
                      Konfirmasi Hadir (Presensi)
                    </Button>
                  ) : (
                    <span className="rounded-full bg-sage-200/80 px-3 py-1 text-xs font-bold text-sage-800">
                      Telah Dikonfirmasi
                    </span>
                  )}
                </div>
              </div>

              {/* Penukaran Kupon / Manfaat */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-navy-950">Kupon & Manfaat Tiket</h4>
                  {scanResult.ticket.benefits.some((b) => b.status === "unclaimed") ? (
                    <button
                      type="button"
                      onClick={handleClaimAll}
                      disabled={pending}
                      className="text-xs font-bold text-navy-950 underline underline-offset-4 hover:text-navy-700 disabled:opacity-50"
                    >
                      Konfirmasi Semua Sekaligus
                    </button>
                  ) : null}
                </div>

                {scanResult.ticket.benefits.length === 0 ? (
                  <p className="text-xs text-navy-500">Tidak ada kupon yang dikonfigurasikan pada tiket ini.</p>
                ) : (
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    {scanResult.ticket.benefits.map((b) => {
                      const isClaimed = b.status === "claimed";
                      return (
                        <div
                          key={b.id}
                          className={cn(
                            "flex items-center justify-between rounded-2xl border p-3.5 transition-colors",
                            isClaimed
                              ? "border-sage-200 bg-sage-50/70"
                              : "border-navy-200 bg-white shadow-sm",
                          )}
                        >
                          <div>
                            <p className="font-semibold text-sm text-navy-950">{b.name}</p>
                            <p className="text-[11px] text-navy-500">
                              {isClaimed ? (
                                <span className="text-sage-700 font-medium">Sudah Ditukar</span>
                              ) : (
                                "Belum Ditukar"
                              )}
                              {b.claimedAt ? ` (${new Date(b.claimedAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })})` : ""}
                            </p>
                          </div>

                          <Button
                            type="button"
                            size="sm"
                            variant={isClaimed ? "ghost" : "primary"}
                            disabled={isClaimed || pending}
                            onClick={() => handleClaimBenefit(b.key)}
                            className="shrink-0 text-xs"
                          >
                            {isClaimed ? "Selesai" : "Tukar Kupon"}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Tombol Pindai Berikutnya */}
              <div className="pt-4 border-t border-navy-100 flex items-center justify-between">
                <Link
                  href={`/admin/kegiatan/${eventId}/tiket`}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-navy-600 hover:text-navy-950"
                >
                  <IconEye className="size-3.5" />
                  Lihat Seluruh Tiket
                </Link>

                <Button type="button" onClick={resetPemindai} className="px-6">
                  Pindai Tiket Berikutnya
                  <IconChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
