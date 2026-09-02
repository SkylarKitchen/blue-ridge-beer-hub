import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center gap-6 px-5 sm:px-10 text-center">
      <p className="font-display text-8xl uppercase leading-none text-navy">
        404
      </p>
      <p className="max-w-md text-lg leading-relaxed text-ink/80">
        That page wandered off the trail. The taproom is right where you left
        it.
      </p>
      <Link
        href="/"
        className="rounded-full bg-navy px-6 py-3 font-display text-base uppercase tracking-wide text-cream transition-colors hover:bg-navy-deep"
      >
        Back to the Hub
      </Link>
    </main>
  );
}
