import Image from "next/image";

const NAV = [
  { href: "#tap", label: "On Tap" },
  { href: "#events", label: "Events" },
  { href: "#about", label: "About" },
  { href: "#hours", label: "Hours" },
];

export function Header({ name }: { name: string }) {
  return (
    <header className="sticky top-0 z-40 border-b border-navy/10 bg-cream/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
        <a href="#top" className="flex items-center gap-3">
          <Image
            src="/logo.jpg"
            alt=""
            width={44}
            height={44}
            className="rounded-full"
          />

          <span className="hidden font-display tracking-wide text-navy sm:inline sm:text-lg">
            {name}
          </span>
        </a>
        <nav
          aria-label="Sections"
          className="flex flex-wrap items-center justify-end gap-1 sm:gap-2"
        >
          {NAV.map((item) => (
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
