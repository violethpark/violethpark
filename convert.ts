import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, basename, extname } from "node:path";
import { Marked, type Token, type Tokens } from "marked";
import { applyTheme, enhance } from "./page.ts";

// ─── Configuration ───────────────────────────────────────────────

const SRC_DIR = "."; // CV*.md files are in the project root
const OUT_DIR = "."; // output HTML files alongside the source
const FILE_PATTERN = /^CV.*\.md$/i;
const LANGUAGE_LINK = /^CV(_\w+)?\.md$/i;
const CSS_FILE = "style.css";

// The layout follows violethpark/workspace plan-html (51087a6): contents on
// the left, the current section's panel on the right, both narrowing to a
// drawer and closed blocks on smaller screens (see style.css).

// ─── Page Text ───────────────────────────────────────────────────

interface Ui {
  contents: string;
  close: string;
  skip: string;
  theme: string;
  auto: string;
  light: string;
  dark: string;
  section: string;
  subs: string;
  links: string;
  empty: string;
  languages: string;
}

const UI: Record<string, Ui> = {
  en: {
    contents: "Contents",
    close: "Close",
    skip: "Skip to content",
    theme: "Theme",
    auto: "Theme: Auto",
    light: "Theme: Light",
    dark: "Theme: Dark",
    section: "Section",
    subs: "Subsections",
    links: "Links",
    empty: "No subsections or links",
    languages: "Languages",
  },
  ko: {
    contents: "목차",
    close: "닫기",
    skip: "본문으로 건너뛰기",
    theme: "테마",
    auto: "테마: 자동",
    light: "테마: 라이트",
    dark: "테마: 다크",
    section: "절 정보",
    subs: "하위 항목",
    links: "링크",
    empty: "하위 항목·링크 없음",
    languages: "언어",
  },
  ja: {
    contents: "目次",
    close: "閉じる",
    skip: "本文へスキップ",
    theme: "テーマ",
    auto: "テーマ: 自動",
    light: "テーマ: ライト",
    dark: "テーマ: ダーク",
    section: "このセクション",
    subs: "小見出し",
    links: "リンク",
    empty: "小見出し・リンクなし",
    languages: "言語",
  },
};

// ─── HTML Template ───────────────────────────────────────────────

interface Heading {
  depth: number;
  id: string;
  text: string;
}

// An h2 and what it holds, for the contents and the section panel.
interface Section extends Heading {
  subs: Heading[];
  links: Link[];
}

interface Link {
  href: string;
  text: string;
}

interface Page {
  title: string;
  lang: string;
  body: string;
  sections: Section[];
  languages: Link[];
}

function htmlTemplate(page: Page): string {
  const ui = UI[page.lang] ?? UI.en!;
  const title = escapeHtml(page.title);
  // The page script labels and shows it; without the script the system
  // theme applies and the button stays hidden.
  const themeButton =
    `<button type="button" class="theme-toggle" hidden data-auto="${ui.auto}" ` +
    `data-light="${ui.light}" data-dark="${ui.dark}">${ui.theme}</button>`;
  return `<!DOCTYPE html>
<html lang="${page.lang}" class="has-toc has-panel">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <script>(${String(applyTheme)})();</script>
  <link rel="stylesheet" href="${CSS_FILE}" />
</head>
<body>
  <a class="skip" href="#cv.main">${ui.skip}</a>
  <header class="bar"><button type="button" class="toc-open" popovertarget="cv.toc">${ui.contents}</button><span class="bar-title">${title}</span>${themeButton}</header>
  <div class="layout">
    ${tocHtml(page.sections, ui)}
    <main id="cv.main">
      <div class="main-bar"><span class="bar-title">${title}</span>${themeButton}</div>
      ${page.body}
    </main>
    ${panelHtml(page, ui)}
  </div>
  <script>(${String(enhance)})();</script>
</body>
</html>`;
}

const anchorLink = (h: Heading) =>
  `<a href="#${escapeHtml(h.id)}">${escapeHtml(h.text)}</a>`;

// The contents list the h2 and h3 headings.
function tocHtml(sections: Section[], ui: Ui): string {
  const items = sections.map((s) => {
    const subs = s.subs.filter((h) => h.depth === 3);
    return (
      `<li data-section="${escapeHtml(s.id)}">${anchorLink(s)}` +
      (subs.length
        ? `<ol>${subs.map((h) => `<li>${anchorLink(h)}</li>`).join("")}</ol>`
        : "") +
      "</li>"
    );
  });
  return (
    `<nav id="cv.toc" class="toc" popover aria-label="${ui.contents}">` +
    `<div class="toc-head"><span>${ui.contents}</span><button type="button" ` +
    `class="toc-close" popovertarget="cv.toc" popovertargetaction="hide">` +
    `${ui.close}</button></div><ol>${items.join("")}</ol></nav>`
  );
}

function infoList(head: string, items: string[]): string {
  if (!items.length) return "";
  return (
    `<p class="info-head">${head}</p><ul class="info-list">` +
    items.map((item) => `<li>${item}</li>`).join("") +
    "</ul>"
  );
}

// What a section holds, shown in the panel and, on narrower screens, in a
// closed block under its heading.
function sectionInfo(s: Section, ui: Ui): string {
  return (
    infoList(ui.subs, s.subs.map(anchorLink)) +
    infoList(
      ui.links,
      s.links.map(
        (l) => `<a href="${escapeHtml(l.href)}">${escapeHtml(l.text)}</a>`,
      ),
    )
  );
}

function sectionSummary(s: Section, ui: Ui): string {
  const counts = [
    [ui.subs, s.subs.length],
    [ui.links, s.links.length],
  ] as const;
  return (
    `${ui.section}: ` +
    counts
      .filter(([, n]) => n)
      .map(([name, n]) => `${name} ${n}`)
      .join(" · ")
  );
}

// The other languages on top, then one block per h2 that the page script
// shows while its section is current.
function panelHtml(page: Page, ui: Ui): string {
  const languages = page.languages.length
    ? `<p class="panel-page" aria-label="${ui.languages}">` +
      page.languages
        .map((l) => `<a href="${escapeHtml(l.href)}">${escapeHtml(l.text)}</a>`)
        .join(" · ") +
      "</p>"
    : "";
  const sections = page.sections.map(
    (s) =>
      `<section class="panel-section" data-section="${escapeHtml(s.id)}">` +
      `<p class="panel-title">${anchorLink(s)}</p>` +
      (sectionInfo(s, ui) || `<p class="panel-page">${ui.empty}</p>`) +
      "</section>",
  );
  return (
    `<aside class="panel" aria-label="${ui.section}">` +
    languages +
    sections.join("") +
    "</aside>"
  );
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

// ─── Headings ────────────────────────────────────────────────────

// GitHub's heading anchors (github-slugger), as violethpark/workspace
// plan-html: lower case, punctuation and emoji dropped, spaces to hyphens,
// and -1, -2, ... until the anchor is unused. One slugger names the headings
// of one document in order.
function slugger(): (text: string) => string {
  const slugs = new Set<string>();
  const counts = new Map<string, number>();
  return (text) => {
    const base = text
      .toLowerCase()
      .replace(/[^\p{L}\p{M}\p{N}\p{Pc} -]/gu, "")
      .replaceAll(" ", "-");
    let slug = base;
    while (slugs.has(slug)) {
      counts.set(base, (counts.get(base) || 0) + 1);
      slug = `${base}-${counts.get(base)}`;
    }
    slugs.add(slug);
    return slug;
  };
}

// The text of inline tokens as GitHub reads it for an anchor: text and code
// spans, without the markup around them.
function plainText(tokens: Token[]): string {
  return tokens
    .map((t) => {
      if ("tokens" in t && t.tokens?.length) return plainText(t.tokens);
      if (t.type === "text" || t.type === "codespan" || t.type === "escape")
        return t.text;
      return "";
    })
    .join("");
}

// ─── Conversion Logic ────────────────────────────────────────────

async function findCvFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir);
  return entries.filter((name) => FILE_PATTERN.test(name)).sort();
}

async function convertFile(srcPath: string, outPath: string): Promise<void> {
  const markdown = await readFile(srcPath, "utf-8");
  const lang = getLangCode(basename(srcPath));
  const ui = UI[lang] ?? UI.en!;

  const marked = new Marked();
  const tokens = marked.lexer(markdown);

  // Name every heading and gather each h2's subheadings and links; the
  // links before the first h2 that point at another CV are the languages.
  const slug = slugger();
  const ids = new Map<Tokens.Heading, string>();
  const sections: Section[] = [];
  const languages: Link[] = [];
  const sectionOf = new Map<Tokens.Heading, Section>();
  let section: Section | undefined;
  for (const token of tokens) {
    if (token.type === "heading") {
      const heading = token as Tokens.Heading;
      const text = plainText(heading.tokens);
      const id = slug(text);
      ids.set(heading, id);
      if (heading.depth === 2) {
        section = { depth: 2, id, text, subs: [], links: [] };
        sections.push(section);
        sectionOf.set(heading, section);
      } else if (heading.depth > 2 && heading.depth <= 4) {
        section?.subs.push({ depth: heading.depth, id, text });
      }
      continue;
    }
    const current = section;
    marked.walkTokens([token], (t) => {
      if (t.type !== "link") return;
      const link = { href: t.href, text: plainText(t.tokens ?? []) || t.href };
      if (!current) {
        if (LANGUAGE_LINK.test(link.href)) languages.push(link);
      } else if (!current.links.some((l) => l.href === link.href)) {
        current.links.push(link);
      }
    });
  }

  marked.use({
    renderer: {
      heading(token) {
        const id = ids.get(token);
        const inner = this.parser.parseInline(token.tokens);
        const html = `<h${token.depth}${id === undefined ? "" : ` id="${escapeHtml(id)}"`}>${inner}</h${token.depth}>\n`;
        const s = sectionOf.get(token);
        const info = s ? sectionInfo(s, ui) : "";
        if (!s || !info) return html;
        return (
          html +
          `<details class="section-info"><summary>${sectionSummary(s, ui)}</summary>` +
          `${info}</details>\n`
        );
      },
    },
  });
  const body = marked.parser(tokens);

  const title = extractTitle(markdown) ?? basename(srcPath, extname(srcPath));
  const html = htmlTemplate({ title, lang, body, sections, languages });
  await writeFile(outPath, html, "utf-8");
}

/** Extract the first `# Heading` as the document title. */
function extractTitle(md: string): string | null {
  const match = md.match(/^#\s+(.+)$/m);
  return match?.[1] ? match[1].trim() : null;
}

// ─── Main ────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const srcDir = join(import.meta.dirname, SRC_DIR);
  const outDir = join(import.meta.dirname, OUT_DIR);

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
