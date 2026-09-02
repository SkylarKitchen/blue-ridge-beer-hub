/**
 * Renders a heading string where *starred* runs become italic accents in the
 * same display grotesque. Owners write e.g. "Your *beer* hub".
 */
export function MixedText({ text }: { text: string }) {
  const parts = text.split(/(\*[^*]+\*)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith("*") && part.endsWith("*") ? (
          <em key={i} className="italic">
            {part.slice(1, -1)}
          </em>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
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
