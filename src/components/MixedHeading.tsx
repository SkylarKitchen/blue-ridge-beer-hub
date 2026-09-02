import type { CSSProperties } from "react";

/**
 * Multi-line display heading: each newline-separated line renders as its
 * own block. `stagger` cascades the lines in on page load, 70ms apart.
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
          {line}
        </span>
      ))}
    </>
  );
}
