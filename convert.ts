import { readdir, readFile, writeFile, copyFile } from "node:fs/promises";
import { join, basename, extname } from "node:path";
import { Marked } from "marked";

// ─── Configuration ───────────────────────────────────────────────

const SRC_DIR = "."; // CV*.md files are in the project root
const OUT_DIR = "."; // output HTML files alongside the source
const FILE_PATTERN = /^CV.*\.md$/i;
const CSS_FILE = "style.css";

// ─── HTML Template ───────────────────────────────────────────────

function htmlTemplate(title: string, body: string, lang: string): string {
  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <link rel="stylesheet" href="${CSS_FILE}" />
</head>
<body>
  <div class="container">
    ${body}
  </div>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getLangCode(filename: string): string {
  if (filename.includes("_ko")) return "ko";
  if (filename.includes("_jp")) return "ja";
  return "en";
}

// ─── Conversion Logic ────────────────────────────────────────────

async function findCvFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir);
  return entries
    .filter((name) => FILE_PATTERN.test(name))
    .sort();
}

async function convertFile(srcPath: string, outPath: string): Promise<void> {
  const markdown = await readFile(srcPath, "utf-8");

  const marked = new Marked();
  const body = await marked.parse(markdown);

  const title = extractTitle(markdown) ?? basename(srcPath, extname(srcPath));
  const lang = getLangCode(basename(srcPath));

  const html = htmlTemplate(title, body, lang);
  await writeFile(outPath, html, "utf-8");
}

/** Extract the first `# Heading` as the document title. */
function extractTitle(md: string): string | null {
  const match = md.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : null;
}

// ─── Main ────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const srcDir = join(import.meta.dirname ?? ".", SRC_DIR);
  const outDir = join(import.meta.dirname ?? ".", OUT_DIR);

  const files = await findCvFiles(srcDir);

  if (files.length === 0) {
    console.log("No CV*.md files found.");
    return;
  }

  console.log(`Found ${files.length} file(s) to convert:\n`);

  for (const file of files) {
    const srcPath = join(srcDir, file);
    const outFile = file.replace(/\.md$/i, ".html");
    const outPath = join(outDir, outFile);

    await convertFile(srcPath, outPath);
    console.log(`  ✔  ${file}  →  ${outFile}`);
  }

  console.log("\nDone.");
}

main().catch((err) => {
  console.error("Conversion failed:", err);
  process.exit(1);
});
