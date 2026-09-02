/**
 * Smooth layered Blue Ridge haze — rolling ridgelines fading with distance,
 * echoing the badge's landscape. Skylar-requested return of the mountains
 * (2026-09-02) after the angular-triangle version was cut; keep these soft.
 * Sized up per Skylar so the peaks read as proper Blue Ridge ridges.
 */
export function Ridgeline({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1440 180"
      preserveAspectRatio="none"
      aria-hidden="true"
      className={`block h-32 w-full sm:h-44 ${className}`}
    >
      <path
        d="M0 70 C 170 24, 330 92, 510 58 C 690 24, 830 98, 1010 62 C 1170 30, 1310 84, 1440 48 L 1440 180 L 0 180 Z"
        fill="#b7c8de"
      />
      <path
        d="M0 108 C 190 62, 370 128, 570 96 C 760 66, 910 134, 1110 102 C 1250 80, 1370 116, 1440 96 L 1440 180 L 0 180 Z"
        fill="#6f8cb4"
      />
      <path
        d="M0 144 C 230 106, 430 160, 650 134 C 860 110, 1050 164, 1250 140 C 1340 129, 1410 150, 1440 138 L 1440 180 L 0 180 Z"
        fill="#1b3560"
      />
    </svg>
  );
}
