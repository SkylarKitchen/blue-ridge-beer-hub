import fs from "node:fs";
import path from "node:path";

import { Marked, type Tokens } from "marked";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import figures from "./figures.json";
import { GuideToc } from "./GuideToc";

/**
 * Owners' guide: UPDATING.md rendered as a page so the team can share one
 * link instead of a file. Deliberately outside the (site) route group — that
 * layout awaits draftMode(), which makes its routes render per request; this
 * page has no request-time inputs, so it prerenders at build and the file
 * read below happens once, on the build machine where the repo exists.
 *
 * The markdown stays readable on GitHub as-is. A few conventions get richer
 * treatment here:
 *   - `![caption](public/guide/x.webp)` becomes a captioned figure, sized
 *     from figures.json (written by scripts/guide-figures.mjs).
 *   - A blockquote opening with `**Tip:**` / `**Heads up:**` / `**Note:**`
 *     becomes a callout.
 *   - A list whose items are nothing but links becomes a grid of task cards.
 *   - `##` headings get ids and feed the "On this page" sidebar.
 */

const description =
  "How to keep brbeerhub.com fresh: the editor, drafts and publishing, the monthly flyer, the banner, hours, and photos. Written for the shop owners, with pictures.";

export const metadata: Metadata = {
  title: "Keeping the site fresh — Blue Ridge Beer Hub",
  description,
  // Internal how-to: reachable by link, kept out of search.
  robots: { index: false, follow: false },
  alternates: { canonical: "/guide" },
  openGraph: {
    title: "Keeping the site fresh",
    description,
    url: "/guide",
    siteName: "Blue Ridge Beer Hub",
    type: "article",
  },
};

const GUIDE_PATH = path.join(process.cwd(), "UPDATING.md");

const FIGURES: Record<string, { width: number; height: number }> = figures;

const CALLOUT_LABELS = ["Tip", "Heads up", "Note", "Remember"];

/** Same shape GitHub gives headings, so in-page links work in both places. */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[’'"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function isLinkOnlyItem(item: Tokens.ListItem): boolean {
  const [block, ...rest] = item.tokens;
  if (rest.length || !block || !("tokens" in block) || !block.tokens) {
    return false;
  }
  return block.tokens.length === 1 && block.tokens[0].type === "link";
}

const markdown = new Marked({
  renderer: {
    heading({ tokens, depth, text }: Tokens.Heading) {
      const id = slugify(text);
      return `<h${depth} id="${id}">${this.parser.parseInline(tokens)}</h${depth}>\n`;
    },

    // A paragraph that is only an image renders as a <figure> at block level;
    // wrapping it in <p> would be invalid HTML and browsers split it apart.
    paragraph({ tokens }: Tokens.Paragraph) {
      if (tokens.length === 1 && tokens[0].type === "image") {
        return this.parser.parseInline(tokens);
      }
      return false;
    },

    image({ href, text }: Tokens.Image) {
      // The doc links images relative to the repo root so GitHub shows them;
      // on the site the public/ folder is served at /.
      const src = href.replace(/^public\//, "/");
      const size = FIGURES[path.basename(src)];
      const dims = size ? ` width="${size.width}" height="${size.height}"` : "";
      const caption = markdown.parseInline(text) as string;
      return (
        `<figure class="guide-figure">` +
        `<img src="${escapeHtml(src)}"${dims} alt="" loading="lazy" decoding="async">` +
        `<figcaption>${caption}</figcaption></figure>\n`
      );
    },

    blockquote({ tokens }: Tokens.Blockquote) {
      const body = this.parser.parse(tokens);
      const match = body.match(/^<p><strong>([^<]+?):<\/strong>\s*/);
      if (!match || !CALLOUT_LABELS.includes(match[1])) return false;
      const label = match[1];
      const kind = slugify(label);
      const rest = body.replace(match[0], "<p>");
      return (
        `<aside class="guide-callout is-${kind}" role="note">` +
        `<span class="guide-callout__label">${label}</span>${rest}</aside>\n`
      );
    },

    list({ ordered, start, items }: Tokens.List) {
      if (!ordered && items.every(isLinkOnlyItem)) {
        const cards = items
          .map((item) => `<li>${this.parser.parse(item.tokens).replace(/^<p>|<\/p>\n?$/g, "")}</li>`)
          .join("");
        return `<ul class="guide-tasks">${cards}</ul>\n`;
      }
      if (ordered) {
        // Steps continue across the figures that interrupt them, so the
        // counter has to honour where each list picks up.
        const first = typeof start === "number" ? start : 1;
        const body = items.map((item) => this.parser.parse(item.tokens)).map((html) => `<li>${html}</li>`).join("");
        return `<ol class="guide-steps" style="counter-reset: step ${first - 1}">${body}</ol>\n`;
      }
      return false;
    },

    // The doc names the editor as `/studio`; on the live site that should be
    // a tap away. Everything else falls through to marked's escaping default.
    codespan({ text }: Tokens.Codespan) {
      if (text === "/studio") {
        return '<a href="/studio"><code>/studio</code></a>';
      }
      return false;
    },
  },
});

function tableOfContents(source: string) {
  return markdown
    .lexer(source)
    .filter((token): token is Tokens.Heading => token.type === "heading" && token.depth === 2)
    .map((token) => ({ id: slugify(token.text), text: token.text }));
}

export default function GuidePage() {
  const source = fs.readFileSync(GUIDE_PATH, "utf8");
  const html = markdown.parse(source) as string;
  const toc = tableOfContents(source);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-navy/10 bg-cream/90 backdrop-blur print:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3 sm:px-10">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/logo.jpg"
              alt=""
              width={40}
              height={40}
              className="rounded-full"
            />
            {/* sr-only below sm so the link keeps a name once the wordmark hides. */}
            <span className="sr-only font-display tracking-wide text-navy sm:not-sr-only sm:inline sm:text-lg">
              Blue Ridge Beer Hub
            </span>
          </Link>
          <Link
            href="/studio"
            className="whitespace-nowrap rounded-full bg-navy px-4 py-2 font-display text-sm uppercase tracking-wide text-cream transition-colors hover:bg-navy-deep"
          >
            Open the editor
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-5 pt-12 pb-20 sm:px-10 sm:pt-16 lg:grid lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-14">
          <GuideToc items={toc} />
          <div className="min-w-0 max-w-3xl">
            <p className="font-condensed text-sm font-bold uppercase tracking-[0.2em] text-amber">
              Owners’ guide
            </p>
            {/* Trusted, repo-authored markdown — not user input. */}
            <article
              className="guide-prose mt-4"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </div>
        </div>
      </main>

      <footer className="border-t border-navy/10 print:hidden">
        <p className="mx-auto max-w-6xl px-5 py-6 text-sm text-ink/60 sm:px-10">
          This page isn’t linked from the public site — share the URL directly.{" "}
          <Link
            href="/"
            className="font-semibold text-navy underline decoration-amber/50 underline-offset-4 hover:text-amber"
          >
            Back to the Hub
          </Link>
        </p>
      </footer>
    </>
  );
}
