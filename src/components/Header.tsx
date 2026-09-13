import Image from "next/image";

import type { NavItem } from "@/lib/sections";

import { Editable } from "./Editable";

export function Header({ name, nav }: { name: string; nav: NavItem[] }) {
  return (
    <header className="sticky top-0 z-40 border-b border-navy/10 bg-cream/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 sm:px-10 py-3">
        <a href="#top" className="flex items-center gap-3">
          <Image
            src="/logo.jpg"
            alt=""
            width={44}
            height={44}
            className="rounded-full"
          />

          {/* sr-only (not hidden) so the link still has a name on phones. */}
          <span className="sr-only font-display tracking-wide text-navy sm:not-sr-only sm:inline sm:text-lg">
            <Editable value={name} path="name" label="Business name" />
          </span>
        </a>
        <nav
          aria-label="Sections"
          className="flex flex-wrap items-center justify-end gap-1 sm:gap-2"
        >
          {nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-full px-2.5 py-1 text-xs font-semibold text-navy transition-colors hover:bg-navy hover:text-cream sm:px-3 sm:py-1.5 sm:text-sm"
            >
              {item.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
