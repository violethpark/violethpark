// Self links for the CV headings, kept apart from convert.ts so a test can
// run them on their own (heading-link.test.ts).
import type { Token } from "marked";

// A heading's inline tokens as elements: Markdown emphasis with its own
// tokens, and an HTML open tag with what follows up to its close tag. null
// when an HTML tag has no partner, as cutting such a heading into runs
// could cross tags.
type InlineNode = Token | { open: Token; children: InlineNode[]; close: Token };
const HTML_TAG = /^<(\/?)([a-z][\w-]*)\b[^>]*?(\/?)>$/i;
const VOID_TAG =
  /^(?:area|base|br|col|embed|hr|img|input|link|meta|source|track|wbr)$/i;
const EMPHASIS: Partial<Record<string, string>> = {
  strong: "strong",
  em: "em",
  del: "del",
};

function inlineTree(tokens: Token[]): InlineNode[] | null {
  type Frame = { open: Token; name: string; children: InlineNode[] };
  const root: InlineNode[] = [];
  const stack: Frame[] = [];
  for (const t of tokens) {
    const tag = t.type === "html" ? HTML_TAG.exec(t.raw.trim()) : null;
    const name = (tag?.[2] ?? "").toLowerCase();
    if (tag && !tag[1] && !tag[3] && !VOID_TAG.test(name)) {
      stack.push({ open: t, name, children: [] });
    } else if (tag?.[1]) {
      const frame = stack.pop();
      if (frame?.name !== name) return null;
      (stack.at(-1)?.children ?? root).push({ ...frame, close: t });
    } else {
      (stack.at(-1)?.children ?? root).push(t);
    }
  }
  return stack.length ? null : root;
}

// An emphasis's own tokens are not grouped yet, so an HTML <a> there is
// still a bare open tag.
const isLink = (n: InlineNode) =>
  /^<a[\s>]/i.test(
    "open" in n ? n.open.raw.trim() : n.type === "html" ? n.raw.trim() : "",
  ) ||
  (!("open" in n) && n.type === "link");
const hasLink = (n: InlineNode): boolean =>
  isLink(n) ||
  ("open" in n
    ? n.children.some(hasLink)
    : "tokens" in n && !!n.tokens?.some(hasLink));
const flatten = (nodes: InlineNode[]): Token[] =>
  nodes.flatMap((n) =>
    "open" in n ? [n.open, ...flatten(n.children), n.close] : [n],
  );

// The headings the contents and the panel list link to themselves, as their
// entries there do (after violethpark/workspace plan-html). A heading's own
// links stay as they are, between the linked runs of its text: links may
// not nest. A run ends only between whole elements: an element around a
// link keeps its tags and holds linked runs of its own. href is the
// heading's "#id", escaped for an attribute.
export function linkedHeading(
  tokens: Token[],
  href: string,
  render: (inline: Token[]) => string,
): string {
  const linked = (nodes: InlineNode[]): string => {
    const parts: string[] = [];
    let run: InlineNode[] = [];
    const flush = () => {
      const inline = flatten(run);
      if (!inline.length) return;
      const html = render(inline);
      parts.push(
        inline.some((t) => t.type !== "text" || t.raw.trim())
          ? `<a href="${href}" class="heading-link">${html}</a>`
          : html,
      );
      run = [];
    };
    for (const n of nodes) {
      if (!hasLink(n)) {
        run.push(n);
        continue;
      }
      flush();
      if ("open" in n && !isLink(n)) {
        parts.push(render([n.open]) + linked(n.children) + render([n.close]));
        continue;
      }
      const tag = "open" in n ? undefined : EMPHASIS[n.type];
      const inner = "open" in n || !tag ? null : tree(n);
      parts.push(
        tag && inner
          ? `<${tag}>${linked(inner)}</${tag}>`
          : render(flatten([n])),
      );
    }
    flush();
    return parts.join("");
  };
  const tree = (t: Token) =>
    "tokens" in t && t.tokens ? inlineTree(t.tokens) : null;
  const top = inlineTree(tokens);
  return top ? linked(top) : render(tokens);
}
