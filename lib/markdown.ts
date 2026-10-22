import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeSanitize, { defaultSchema, type Options as SanitizeSchema } from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";

/**
 * Render Markdown milik admin menjadi HTML yang sudah disanitasi.
 *
 * Sanitasi dilakukan pada AST (rehype-sanitize) memakai allowlist, bukan
 * blacklist — tag/atribut yang tidak dikenal otomatis dibuang. Dengan begitu
 * HTML mentah dari input admin tidak pernah sampai ke browser apa adanya
 * (prompt §6: "Hindari merender HTML mentah dari input admin tanpa sanitasi").
 */

const schema: SanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    a: [
      ...(defaultSchema.attributes?.a ?? []),
      // target/rel diperlukan agar tautan eksternal aman dibuka di tab baru.
      ["target", "_blank"],
      ["rel", "noopener", "noreferrer"],
    ],
    img: [...(defaultSchema.attributes?.img ?? []), "loading", "alt", "src"],
  },
  // Hanya protokol aman; `javascript:` otomatis ditolak.
  protocols: {
    ...defaultSchema.protocols,
    href: ["http", "https", "mailto", "tel"],
    src: ["http", "https"],
  },
};

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeSanitize, schema)
  .use(rehypeStringify);

/** Mengembalikan HTML aman untuk dipasang lewat dangerouslySetInnerHTML. */
export async function renderMarkdown(source: string | null | undefined): Promise<string> {
  if (!source || source.trim() === "") return "";
  const file = await processor.process(source);
  return String(file);
}

/**
 * Versi teks polos — untuk meta description dan ringkasan.
 * Menghapus sintaks Markdown yang umum tanpa menyisakan HTML.
 */
export function markdownToPlainText(
  source: string | null | undefined,
  maxLength = 160,
): string {
  if (!source) return "";

  const text = source
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/^[>#\-*+\s]+/gm, " ")
    .replace(/[*_~]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).trimEnd()}…`;
}
