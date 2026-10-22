import { describe, expect, it } from "vitest";

import { markdownToPlainText, renderMarkdown } from "@/lib/markdown";

describe("renderMarkdown — sanitasi", () => {
  it("membuang tag <script>", async () => {
    const html = await renderMarkdown('Halo\n\n<script>alert("xss")</script>\n');
    expect(html).not.toContain("<script");
    expect(html).not.toContain("alert(");
  });

  it("membuang atribut event handler seperti onerror", async () => {
    const html = await renderMarkdown('\n<img src=x onerror="alert(1)">\n');
    expect(html).not.toContain("onerror");
  });

  it("membuang href berisi javascript:", async () => {
    const html = await renderMarkdown("[klik](javascript:alert(1))");
    expect(html).not.toContain("javascript:");
  });

  it("membuang iframe", async () => {
    const html = await renderMarkdown('\n<iframe src="https://jahat.example"></iframe>\n');
    expect(html).not.toContain("<iframe");
  });

  it("mempertahankan format yang sah", async () => {
    const html = await renderMarkdown(
      ["# Judul", "", "Teks **tebal** dan *miring*.", "", "- satu", "- dua", "", "[tautan](https://example.com)"].join("\n"),
    );
    expect(html).toContain("<h1>");
    expect(html).toContain("<strong>");
    expect(html).toContain("<em>");
    expect(html).toContain("<li>");
    expect(html).toContain('href="https://example.com"');
  });

  it("mendukung tabel GFM", async () => {
    const html = await renderMarkdown(["| A | B |", "| - | - |", "| 1 | 2 |"].join("\n"));
    expect(html).toContain("<table>");
  });

  it("mengembalikan string kosong untuk input kosong", async () => {
    expect(await renderMarkdown(null)).toBe("");
    expect(await renderMarkdown("   ")).toBe("");
  });
});

describe("markdownToPlainText", () => {
  it("menghapus sintaks markdown", () => {
    expect(markdownToPlainText("# Judul\n\nTeks **tebal**")).toBe("Judul Teks tebal");
  });

  it("menghapus tautan tetapi menyisakan teksnya", () => {
    expect(markdownToPlainText("Lihat [situs](https://a.id) ini")).toBe("Lihat situs ini");
  });

  it("memotong sesuai panjang maksimal", () => {
    const hasil = markdownToPlainText("a".repeat(300), 50);
    expect(hasil.length).toBeLessThanOrEqual(50);
    expect(hasil.endsWith("…")).toBe(true);
  });

  it("aman untuk input kosong", () => {
    expect(markdownToPlainText(null)).toBe("");
  });
});
