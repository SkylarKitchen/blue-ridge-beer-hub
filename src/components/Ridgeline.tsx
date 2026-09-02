/**
 * Smooth layered Blue Ridge haze — rolling ridgelines fading with distance,
 * echoing the badge's landscape. Skylar-requested return of the mountains
 * (2026-09-02) after the angular-triangle version was cut; keep these soft.
 */
export function Ridgeline({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1440 180"
      preserveAspectRatio="none"
      aria-hidden="true"
      className={`block h-24 w-full sm:h-36 ${className}`}
    >
      <path
        d="M0 92 C 180 58, 320 116, 500 94 C 680 72, 800 122, 980 100 C 1150 80, 1300 112, 1440 90 L 1440 180 L 0 180 Z"
        fill="#b7c8de"
      />
      <path
        d="M0 124 C 200 96, 370 142, 570 122 C 770 102, 910 144, 1110 126 C 1250 113, 1370 132, 1440 122 L 1440 180 L 0 180 Z"
        fill="#6f8cb4"
      />
      <path
        d="M0 150 C 240 128, 430 162, 650 148 C 870 134, 1050 166, 1250 150 C 1340 143, 1410 152, 1440 148 L 1440 180 L 0 180 Z"
        fill="#1b3560"
      />
    </svg>
  );
}
