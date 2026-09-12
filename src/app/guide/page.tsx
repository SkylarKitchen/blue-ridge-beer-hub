import fs from "node:fs";
import path from "node:path";

import { Marked, type Tokens } from "marked";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

/**
 * Owners' guide: UPDATING.md rendered as a page so the team can share one
 * link instead of a file. Deliberately outside the (site) route group — that
 * layout awaits draftMode(), which makes its routes render per request; this
 * page has no request-time inputs, so it prerenders at build and the file
 * read below happens once, on the build machine where the repo exists.
 */

const description =
  "How to keep brbeerhub.com fresh: the monthly flyer, the announcement banner, hours, and photos. Written for the shop owners.";

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

const markdown = new Marked({
  renderer: {
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

export default function GuidePage() {
  const source = fs.readFileSync(GUIDE_PATH, "utf8");
  const html = markdown.parse(source) as string;

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-navy/10 bg-cream/90 backdrop-blur print:hidden">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-5 py-3 sm:px-10">
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
        <div className="mx-auto max-w-3xl px-5 pt-12 pb-20 sm:px-10 sm:pt-16">
          <p className="font-condensed text-sm font-bold uppercase tracking-[0.2em] text-amber">
            Owners’ guide
          </p>
          {/* Trusted, repo-authored markdown — not user input. */}
          <article
            className="guide-prose mt-4"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </main>

      <footer className="border-t border-navy/10 print:hidden">
        <p className="mx-auto max-w-3xl px-5 py-6 text-sm text-ink/60 sm:px-10">
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
