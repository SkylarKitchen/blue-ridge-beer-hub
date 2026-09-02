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
        fill="#f8f6f0"
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
        <circle cx="132" cy="80" r="16" fill="#e9a23b" />
        <path
          d="M28 114 L64 72 L94 106 L126 64 L156 98 L174 88 V150 H28 Z"
          fill="#9db8d6"
        />
        <path
          d="M28 124 L70 92 L104 118 L142 90 L174 112 V150 H28 Z"
          fill="#5f7ea8"
        />
        <path d="M28 134 L80 108 L126 128 L174 116 V152 H28 Z" fill="#33527e" />
        <path d="M40 132 L52 102 L64 132 Z" fill="#2e5238" />
        <path d="M58 132 L72 94 L86 132 Z" fill="#24422c" />
        <path d="M80 132 L91 108 L102 132 Z" fill="#2e5238" />
        <rect x="0" y="128" width="200" height="30" fill="#14181f" />
        <text
          x="100"
          y="149"
          textAnchor="middle"
          fill="#ffffff"
          fontSize="18"
          fontWeight="800"
          letterSpacing="2"
          fontFamily="var(--font-archivo)"
        >
          BEER HUB
        </text>
        <rect x="0" y="158" width="200" height="20" fill="#35603f" />
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
