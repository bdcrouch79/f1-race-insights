/**
 * Purely decorative, abstract curved-line motif suggesting a racing
 * line without depicting any real circuit, official F1 graphic, or
 * team livery. No logos, no trademarked shapes -- just gradient
 * strokes on a dark field. Absolutely positioned behind its container's
 * content; safe to layer text over.
 */
export function RacingLineBackdrop() {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 1600 900"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id="riq-line-cyan" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#30D5FF" stopOpacity="0" />
          <stop offset="45%" stopColor="#30D5FF" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#30D5FF" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="riq-line-red" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#FF2B2B" stopOpacity="0" />
          <stop offset="55%" stopColor="#FF2B2B" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#FF2B2B" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="riq-line-orange" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#FF6B00" stopOpacity="0" />
          <stop offset="50%" stopColor="#FF6B00" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#FF6B00" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="riq-vignette" cx="50%" cy="20%" r="75%">
          <stop offset="0%" stopColor="#12151A" stopOpacity="0" />
          <stop offset="100%" stopColor="#08090B" stopOpacity="0.9" />
        </radialGradient>
      </defs>

      <path
        d="M -100 620 C 260 520, 420 700, 760 560 S 1180 300, 1700 380"
        fill="none"
        stroke="url(#riq-line-cyan)"
        strokeWidth="2.5"
        className="riq-racing-line"
      />
      <path
        d="M -100 720 C 300 660, 500 800, 860 700 S 1260 480, 1700 520"
        fill="none"
        stroke="url(#riq-line-red)"
        strokeWidth="1.5"
      />
      <path
        d="M -100 460 C 240 380, 460 520, 820 420 S 1240 220, 1700 260"
        fill="none"
        stroke="url(#riq-line-orange)"
        strokeWidth="1.5"
      />

      <rect width="1600" height="900" fill="url(#riq-vignette)" />
    </svg>
  );
}
