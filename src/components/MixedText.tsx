import type { CSSProperties } from "react";

/**
 * Headings render in the uniform display grotesque. Content may contain
 * *starred* runs (a legacy emphasis convention in seeded copy) — the stars
 * are stripped and everything renders identically.
 */
export function MixedText({ text }: { text: string }) {
  return <>{text.replace(/\*/g, "")}</>;
}

/**
 * Multi-line variant: each newline-separated line renders as its own block.
 * `stagger` cascades the lines in on page load, 70ms apart.
 */
export function MixedHeading({
  text,
  stagger = false,
}: {
  text: string;
  stagger?: boolean;
}) {
  return (
    <>
      {text.split("\n").map((line, i) => (
        <span
          key={i}
          className={stagger ? "animate-rise block" : "block"}
          style={
            stagger ? ({ "--ad": `${i * 70}ms` } as CSSProperties) : undefined
          }
        >
          <MixedText text={line} />
        </span>
      ))}
    </>
  );
}
