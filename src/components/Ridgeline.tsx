/**
 * Static layered mountain-ridge silhouette, echoing the badge logo.
 * Used as a section divider; `flip` mirrors it vertically.
 */
export function Ridgeline({
  className = "",
  flip = false,
}: {
  className?: string;
  flip?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 1440 160"
      preserveAspectRatio="none"
      aria-hidden="true"
      className={`block w-full ${flip ? "rotate-180" : ""} ${className}`}
    >
      <path
        d="M0 128 L110 84 210 118 330 60 470 112 610 44 760 104 900 72 1040 120 1180 82 1320 112 1440 88 V160 H0 Z"
        fill="#8fb0d1"
      />
      <path
        d="M0 144 L150 106 300 136 450 92 600 128 750 80 900 126 1050 100 1200 134 1330 112 1440 128 V160 H0 Z"
        fill="#33527e"
      />
      <path
        d="M0 152 L180 124 360 148 540 116 720 144 900 112 1080 142 1260 124 1440 144 V160 H0 Z"
        fill="currentColor"
      />
    </svg>
  );
}
