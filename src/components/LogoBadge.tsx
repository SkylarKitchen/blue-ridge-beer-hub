/**
 * SVG recreation of the real badge (white ring, navy arc text, mountain scene,
 * black BEER HUB band) for large sizes where the tiny Instagram thumbnail
 * would blur. Swap for real logo files when the owners hand them over.
 */
export function LogoBadge({ size = 200 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      role="img"
      aria-label="Blue Ridge Beer Hub badge"
    >
      <circle
        cx="100"
        cy="100"
        r="96"
        fill="#ffffff"
        stroke="#14181f"
        strokeWidth="3"
      />
      <circle
        cx="100"
        cy="100"
        r="73"
        fill="#f3eee1"
        stroke="#14181f"
        strokeWidth="2"
      />
      <defs>
        <path id="badge-arc-top" d="M 22 100 A 78 78 0 0 1 178 100" />
        <clipPath id="badge-scene">
          <circle cx="100" cy="100" r="72" />
        </clipPath>
      </defs>
      <g clipPath="url(#badge-scene)">
        <circle cx="128" cy="72" r="15" fill="var(--color-amber-bright)" />
        <path
          d="M28 116 L58 82 84 106 118 74 150 102 174 88 V150 H28 Z"
          fill="#8fb0d1"
        />
        <path
          d="M28 128 L66 100 100 124 138 98 174 120 V150 H28 Z"
          fill="#33527e"
        />
        <g fill="#2f5d3a">
          <path d="M44 124 l9 -18 9 18 z" />
          <path d="M58 128 l10 -22 10 22 z" />
          <path d="M74 126 l8 -16 8 16 z" />
        </g>
        <rect x="0" y="126" width="200" height="32" fill="#14181f" />
        <text
          x="100"
          y="148"
          textAnchor="middle"
          fill="#ffffff"
          fontSize="18"
          fontWeight="800"
          letterSpacing="2"
          fontFamily="var(--font-archivo)"
        >
          BEER HUB
        </text>
        <rect x="0" y="158" width="200" height="20" fill="#2f5d3a" />
      </g>
      <text
        fill="#14181f"
        fontSize="21"
        fontWeight="800"
        letterSpacing="5"
        fontFamily="var(--font-archivo)"
      >
        <textPath href="#badge-arc-top" startOffset="50%" textAnchor="middle">
          BLUE RIDGE
        </textPath>
      </text>
    </svg>
  );
}
