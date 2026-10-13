/*
 * Small illustrations for the home screen's services, drawn inline so they
 * stay sharp at any size and cost no download. Each is drawn in one colour
 * only — its tile's, in a few shades, plus white — so the screen reads as
 * four services rather than a box of crayons.
 *
 * Gradient ids are prefixed per illustration: the four sit on one page, and
 * SVG ids are global to the document.
 */

type Props = { size?: number };

export function IllustrationSujets({ size = 48 }: Props) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
      <defs>
        <linearGradient id="su-fond" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8b93ff" />
          <stop offset="1" stopColor="#4f46e5" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="18" fill="url(#su-fond)" />
      {/* pile de copies */}
      <rect x="17" y="15" width="28" height="36" rx="3" fill="#c7cbff" transform="rotate(-8 31 33)" />
      <rect x="19" y="13" width="28" height="36" rx="3" fill="#ffffff" />
      <rect x="23" y="18" width="14" height="3" rx="1.5" fill="#4f46e5" />
      <rect x="23" y="25" width="20" height="2" rx="1" fill="#c7cbff" />
      <rect x="23" y="30" width="18" height="2" rx="1" fill="#c7cbff" />
      <rect x="23" y="35" width="20" height="2" rx="1" fill="#c7cbff" />
      <rect x="23" y="40" width="12" height="2" rx="1" fill="#c7cbff" />
      {/* note */}
      <circle cx="41" cy="20" r="6.5" fill="#3730a3" />
      <text x="41" y="22.6" textAnchor="middle" fontSize="7.5" fontWeight="800" fill="#fff" fontFamily="Manrope, sans-serif">A+</text>
      {/* crayon */}
      <g transform="rotate(38 44 44)">
        <rect x="40" y="30" width="7" height="22" rx="1.5" fill="#e0e3ff" />
        <rect x="40" y="30" width="7" height="4" rx="1.5" fill="#a5abff" />
        <path d="M40 52 h7 l-3.5 6 z" fill="#ffffff" />
        <path d="M42.6 56.4 h1.8 l-0.9 1.6 z" fill="#3730a3" />
      </g>
    </svg>
  );
}

export function IllustrationLogements({ size = 48 }: Props) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
      <defs>
        <linearGradient id="lo-fond" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffb36b" />
          <stop offset="1" stopColor="#ea580c" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="18" fill="url(#lo-fond)" />
      <circle cx="49" cy="15" r="5" fill="#ffffff" opacity=".45" />
      {/* sol */}
      <rect x="8" y="50" width="48" height="4" rx="2" fill="#9a3412" opacity=".35" />
      {/* immeuble */}
      <rect x="18" y="20" width="26" height="31" rx="2.5" fill="#ffffff" />
      <path d="M15 21.5 L31 11 L47 21.5 Z" fill="#9a3412" />
      {/* fenêtres */}
      {[0, 1, 2].map((r) =>
        [0, 1, 2].map((c) => (
          <rect
            key={`${r}-${c}`}
            x={21.5 + c * 7}
            y={24 + r * 7}
            width="5"
            height="4.5"
            rx="1"
            fill={(r + c) % 2 === 0 ? "#fdba74" : "#fed7aa"}
          />
        ))
      )}
      {/* porte */}
      <rect x="28" y="44" width="6" height="7" rx="1.2" fill="#c2410c" />
      {/* buissons */}
      <circle cx="50" cy="46" r="4.5" fill="#ffffff" opacity=".55" />
      <circle cx="12" cy="47" r="3.5" fill="#ffffff" opacity=".55" />
    </svg>
  );
}

export function IllustrationProgramme({ size = 48 }: Props) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
      <defs>
        <linearGradient id="pr-fond" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3ee0cf" />
          <stop offset="1" stopColor="#0d9488" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="18" fill="url(#pr-fond)" />
      {/* calendrier */}
      <rect x="12" y="15" width="36" height="34" rx="4" fill="#ffffff" />
      <path d="M12 19 a4 4 0 0 1 4 -4 h28 a4 4 0 0 1 4 4 v6 h-36 z" fill="#0f766e" />
      <rect x="18" y="11" width="3" height="8" rx="1.5" fill="#134e4a" />
      <rect x="39" y="11" width="3" height="8" rx="1.5" fill="#134e4a" />
      {/* cours de la semaine */}
      <rect x="16" y="29" width="12" height="4" rx="2" fill="#14b8a6" />
      <rect x="30" y="29" width="14" height="4" rx="2" fill="#99f6e4" />
      <rect x="16" y="36" width="9" height="4" rx="2" fill="#99f6e4" />
      <rect x="27" y="36" width="12" height="4" rx="2" fill="#14b8a6" />
      <rect x="16" y="43" width="14" height="3" rx="1.5" fill="#ccfbf1" />
      {/* horloge */}
      <circle cx="46" cy="45" r="10" fill="#ffffff" stroke="#0f766e" strokeWidth="2.5" />
      <path d="M46 39.5 V45 L50 47.5" stroke="#0f766e" strokeWidth="2.4" strokeLinecap="round" fill="none" />
    </svg>
  );
}

// No product inside: ordering covers every shop, not one of them.
export function IllustrationCommander({ size = 48 }: Props) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
      <defs>
        <linearGradient id="co-sac" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ff7aa8" />
          <stop offset="1" stopColor="#e5528a" />
        </linearGradient>
      </defs>
      {/* anse */}
      <path d="M22 22 v-4 a10 10 0 0 1 20 0 v4" stroke="#b0287a" strokeWidth="3.4" strokeLinecap="round" fill="none" />
      {/* sac */}
      <path d="M12 21 h40 l-3.5 33 a3.5 3.5 0 0 1 -3.5 3 h-26 a3.5 3.5 0 0 1 -3.5 -3 z" fill="url(#co-sac)" />
      <path d="M12 21 h40 l-.6 5 h-38.8 z" fill="#b0287a" opacity=".35" />
      <circle cx="22" cy="27" r="2" fill="#b0287a" />
      <circle cx="42" cy="27" r="2" fill="#b0287a" />
      <path d="M25 37 q7 6 14 0" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" fill="none" />
      {/* étiquette offre */}
      <g transform="rotate(-18 47 46)">
        <path d="M40 40 h12 a2 2 0 0 1 2 2 v8 a2 2 0 0 1 -2 2 h-12 l-5 -6 z" fill="#ffffff" />
        <circle cx="39" cy="46" r="1.4" fill="#e5528a" />
        <text x="47" y="49.2" textAnchor="middle" fontSize="8" fontWeight="800" fill="#b0287a" fontFamily="Manrope, sans-serif">%</text>
      </g>
    </svg>
  );
}
