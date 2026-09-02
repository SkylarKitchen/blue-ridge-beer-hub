import type { CSSProperties } from "react";

/**
 * Headings render in the uniform display grotesque. The *starred* emphasis
 * convention is retired — seed and fallback copy are scrubbed — but the
 * PUBLISHED Sanity dataset still carries starred strings, so this strip
 * stays until those documents are re-published clean. Then it can go, and
 * owner-typed asterisks will render literally (as they should).
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
