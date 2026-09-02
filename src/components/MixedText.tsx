/**
 * Headings render in the uniform display grotesque. Content may contain
 * *starred* runs (a legacy emphasis convention in seeded copy) — the stars
 * are stripped and everything renders identically.
 */
export function MixedText({ text }: { text: string }) {
  return <>{text.replace(/\*/g, "")}</>;
}

/** Multi-line variant: each newline-separated line renders as its own block. */
export function MixedHeading({ text }: { text: string }) {
  return (
    <>
      {text.split("\n").map((line, i) => (
        <span key={i} className="block">
          <MixedText text={line} />
        </span>
      ))}
    </>
  );
}
