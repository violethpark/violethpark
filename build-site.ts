// Lays out the GitHub Pages site from the converted CV*.html (npm run convert
// first). deploy-cv.yml runs it; run it locally to check the site before a
// merge, e.g. `python3 -m http.server -d _site`.
//
// Usage: node build-site.ts [out-dir]   (default: _site, relative to this file)
// Needs fontTools for subset-fonts.py: PYTHON names a Python that has it
// (pip install --require-hashes -r requirements-fonts.txt), default python3.
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  cpSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";

const NAME = "build-site.ts";

// Every file of fonts.json with its pinned sha256, by path under fonts/.
function fontPins(json: unknown): Map<string, string> {
  const pins = new Map<string, string>();
  const archives = isRecord(json) ? json.archives : undefined;
  if (!Array.isArray(archives))
    throw new Error("fonts/fonts.json: no archives list");
  for (const archive of archives) {
    const files: unknown = isRecord(archive) ? archive.files : undefined;
    if (!isRecord(files))
      throw new Error("fonts/fonts.json: an archive has no files");
    for (const [file, pin] of Object.entries(files)) {
      const sha256 = isRecord(pin) ? pin.sha256 : undefined;
      if (typeof sha256 !== "string")
        throw new Error(`fonts/fonts.json: ${file} has no sha256`);
      pins.set(file, sha256);
    }
  }
  return pins;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// The fonts are copied, not built here: check them against their pins.
function checkFonts(): void {
  const pins = fontPins(JSON.parse(readFileSync("fonts/fonts.json", "utf8")));
  let failed = 0;
  for (const [file, pin] of pins) {
    let actual: string;
    try {
      actual = createHash("sha256")
        .update(readFileSync(`fonts/${file}`))
        .digest("hex");
    } catch {
      console.error(`${NAME}: fonts/${file}: FAILED open or read`);
      failed++;
      continue;
    }
    if (actual !== pin) {
      console.error(`${NAME}: fonts/${file}: FAILED`);
      failed++;
    }
  }
  if (failed)
    throw new Error(`${failed} font file(s) do not match fonts/fonts.json`);
}

// Rewrites a file's text in place.
function edit(path: string, change: (text: string) => string): void {
  writeFileSync(path, change(readFileSync(path, "utf8")));
}

function build(site: string): void {
  checkFonts();

  rmSync(site, { recursive: true, force: true });
  mkdirSync(site, { recursive: true });

  // English at / and /en/, the others under their language.
  const pages = [
    [".", "CV.html"],
    ["en", "CV.html"],
    ["ko", "CV_ko.html"],
    ["jp", "CV_jp.html"],
  ] as const;
  for (const [dir, html] of pages) {
    mkdirSync(`${site}/${dir}/images`, { recursive: true });
    cpSync(html, `${site}/${dir}/index.html`);
    cpSync("images", `${site}/${dir}/images`, { recursive: true });
  }

  // One style sheet and one set of fonts at the root, which the style sheet
  // reaches by a path relative to itself. The text font is cut to the
  // characters of the pages below, once their links are final.
  cpSync("style.css", `${site}/style.css`);
  cpSync("fonts/sarasa-mono-slab", `${site}/fonts/sarasa-mono-slab`, {
    recursive: true,
  });
  for (const dir of ["en", "ko", "jp"]) {
    // The first link of each line, as sed without g.
    edit(`${site}/${dir}/index.html`, (text) =>
      text
        .split("\n")
        .map((line) => line.replace('href="style.css"', 'href="../style.css"'))
        .join("\n"),
    );
  }

  // Cross-language links (.md → clean URLs), in the language switches.
  for (const [dir] of pages) {
    edit(`${site}/${dir}/index.html`, (text) =>
      text
        .replaceAll('href="CV.md"', 'href="/en/"')
        .replaceAll('href="CV_ko.md"', 'href="/ko/"')
        .replaceAll('href="CV_jp.md"', 'href="/jp/"'),
    );
  }

  const python = process.env.PYTHON || "python3";
  const run = spawnSync(python, ["subset-fonts.py", site], {
    stdio: "inherit",
  });
  if (run.error)
    throw new Error(`${python}: ${run.error.message}`, {
      cause: run.error,
    });
  if (run.status !== 0) {
    process.exitCode = run.status ?? 1;
    throw new Error(
      `subset-fonts.py failed (${run.signal ?? `exit ${run.status}`})`,
    );
  }
  // The site's style sheet names the cuts; the one next to CV*.html keeps the
  // originals for npm run convert's pages.
  const style = `${site}/style.css`;
  edit(style, (text) =>
    text.replaceAll("fonts/ibm-plex-sans/IBMPlexSans", "fonts/cv-sans/CVSans"),
  );
  if (readFileSync(style, "utf8").includes("ibm-plex-sans"))
    throw new Error(`${style} still names a Plex original`);

  writeFileSync(`${site}/CNAME`, "about.violethpark.com\n");
}

// Paths are relative to this file, the out-dir too.
process.chdir(import.meta.dirname);
try {
  build(process.argv[2] || "_site");
} catch (error) {
  console.error(
    `${NAME}: ${error instanceof Error ? error.message : String(error)}`,
  );
  if (!process.exitCode) process.exitCode = 1;
}
