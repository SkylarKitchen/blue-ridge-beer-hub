/** Chunky up-right arrow for CTAs — replaces the skinny ↗ text glyph. */
export function ArrowUpRight({ className = "" }: { className?: string }) {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M3.5 12.5 L12.5 3.5 M5.5 3.5 h7 v7"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
