// Self links of the CV headings: npm test.
import assert from "node:assert/strict";
import { test } from "node:test";
import { Lexer, Parser, type Tokens } from "marked";
import { linkedHeading } from "./heading-link.ts";

const linked = (markdown: string) => {
  const heading = Lexer.lex(markdown)[0] as Tokens.Heading;
  return linkedHeading(heading.tokens, "#h", (inline) =>
    Parser.parseInline(inline),
  );
};
const self = (html: string) => `<a href="#h" class="heading-link">${html}</a>`;

test("a heading without links is one link", () => {
  assert.equal(linked("## Plain *em* text"), self("Plain <em>em</em> text"));
});

test("a heading's own links stay between linked runs", () => {
  assert.equal(
    linked("## More in [the code](code.md) here"),
    self("More in ") + '<a href="code.md">the code</a>' + self(" here"),
  );
  assert.equal(
    linked('## <a href="q.md">raw</a> rest'),
    '<a href="q.md">raw</a>' + self(" rest"),
  );
});

test("emphasis around a link holds runs of its own", () => {
  assert.equal(
    linked("## **[API](https://example.com/)** notes"),
    '<strong><a href="https://example.com/">API</a></strong>' + self(" notes"),
  );
  assert.equal(
    linked("## *a [x](y.md) b* c"),
    `<em>${self("a ")}<a href="y.md">x</a>${self(" b")}</em>${self(" c")}`,
  );
});

test("emphasis around an HTML link holds runs of its own", () => {
  assert.equal(
    linked('## **<a href="https://example.com/">API</a>** 문서'),
    '<strong><a href="https://example.com/">API</a></strong>' + self(" 문서"),
  );
  assert.equal(
    linked('## *<span lang="ko">앞 <a href="y.md">API</a> 뒤</span>* 문서'),
    `<em><span lang="ko">${self("앞 ")}<a href="y.md">API</a>${self(" 뒤")}</span></em>` +
      self(" 문서"),
  );
});

test("an HTML element around a link keeps its tags", () => {
  assert.equal(
    linked(
      '## <span style="color: red">Before [docs](https://example.com/) after</span> tail',
    ),
    '<span style="color: red">' +
      self("Before ") +
      '<a href="https://example.com/">docs</a>' +
      self(" after") +
      "</span>" +
      self(" tail"),
  );
});

test("a heading with an unclosed HTML tag is not linked", () => {
  assert.equal(
    linked("## Bad <span>open [z](z.md)"),
    'Bad <span>open <a href="z.md">z</a>',
  );
});
