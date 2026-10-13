/*
 * Small coloured illustrations for the home screen's services, drawn inline
 * so they stay sharp at any size and cost no download. Each one tells what
 * the service is at a glance — a stack of exam papers, a residence, a
 * timetable, a shopping bag — rather than a single-stroke pictogram.
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
        <linearGradient id="su-crayon" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ffd34d" />
          <stop offset="1" stopColor="#f5a524" />
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
      {/* note A+ */}
      <circle cx="41" cy="20" r="6.5" fill="#ef4444" />
      <text x="41" y="22.6" textAnchor="middle" fontSize="7.5" fontWeight="800" fill="#fff" fontFamily="Manrope, sans-serif">A+</text>
      {/* crayon */}
      <g transform="rotate(38 44 44)">
        <rect x="40" y="30" width="7" height="22" rx="1.5" fill="url(#su-crayon)" />
        <rect x="40" y="30" width="7" height="4" rx="1.5" fill="#f472b6" />
        <rect x="40" y="33" width="7" height="2" fill="#cbd5e1" />
        <path d="M40 52 h7 l-3.5 6 z" fill="#fde7c4" />
        <path d="M42.6 56.4 h1.8 l-0.9 1.6 z" fill="#334155" />
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
        <linearGradient id="lo-mur" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#ffe9d6" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="18" fill="url(#lo-fond)" />
      <circle cx="49" cy="15" r="5" fill="#ffe08a" />
      {/* sol */}
      <rect x="6" y="50" width="52" height="5" rx="2.5" fill="#c2410c" opacity=".45" />
      {/* immeuble */}
      <rect x="18" y="20" width="26" height="31" rx="2.5" fill="url(#lo-mur)" />
      <path d="M15 21.5 L31 11 L47 21.5 Z" fill="#9a3412" />
      {/* fenêtres éclairées */}
      {[0, 1, 2].map((r) =>
        [0, 1, 2].map((c) => (
          <rect
            key={`${r}-${c}`}
            x={21.5 + c * 7}
            y={24 + r * 7}
            width="5"
            height="4.5"
            rx="1"
            fill={(r + c) % 2 === 0 ? "#fbbf24" : "#7dd3fc"}
          />
        ))
      )}
      {/* porte */}
      <rect x="28" y="44" width="6" height="7" rx="1.2" fill="#9a3412" />
      <circle cx="32.6" cy="47.6" r=".7" fill="#fde68a" />
      {/* arbre */}
      <rect x="49" y="40" width="2.4" height="10" rx="1" fill="#7c2d12" />
      <circle cx="50.2" cy="37" r="6" fill="#22c55e" />
      <circle cx="47.6" cy="39.5" r="3.6" fill="#16a34a" />
      <circle cx="10.5" cy="45" r="4" fill="#22c55e" />
      <rect x="9.7" y="46" width="1.6" height="5" fill="#7c2d12" />
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
      <path d="M12 19 a4 4 0 0 1 4 -4 h28 a4 4 0 0 1 4 4 v6 h-36 z" fill="#ef4444" />
      <rect x="18" y="11" width="3" height="8" rx="1.5" fill="#475569" />
      <rect x="39" y="11" width="3" height="8" rx="1.5" fill="#475569" />
      {/* cours de la semaine */}
      <rect x="16" y="29" width="12" height="4" rx="2" fill="#a78bfa" />
      <rect x="30" y="29" width="14" height="4" rx="2" fill="#fbbf24" />
      <rect x="16" y="36" width="9" height="4" rx="2" fill="#34d399" />
      <rect x="27" y="36" width="12" height="4" rx="2" fill="#60a5fa" />
      <rect x="16" y="43" width="14" height="3" rx="1.5" fill="#e2e8f0" />
      {/* horloge */}
      <circle cx="46" cy="45" r="10" fill="#ffffff" stroke="#0f766e" strokeWidth="2.5" />
      <path d="M46 39.5 V45 L50 47.5" stroke="#0f766e" strokeWidth="2.4" strokeLinecap="round" fill="none" />
      <circle cx="46" cy="45" r="1.4" fill="#ef4444" />
    </svg>
  );
}

export function IllustrationCommander({ size = 48 }: Props) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
      <defs>
        <linearGradient id="co-sac" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#ffe3ec" />
        </linearGradient>
        <radialGradient id="co-pate" cx=".4" cy=".35" r=".7">
          <stop offset="0" stopColor="#f8c27a" />
          <stop offset="1" stopColor="#d48a3a" />
        </radialGradient>
      </defs>
      {/* anse, derrière le donut */}
      <path d="M23 29 v-5 a9 9 0 0 1 18 0 v5" stroke="#b0287a" strokeWidth="3" strokeLinecap="round" fill="none" />
      {/* donut qui dépasse */}
      <g transform="rotate(-14 38 18)">
        <circle cx="38" cy="19" r="12" fill="url(#co-pate)" />
        <path d="M27 17 a11 11 0 0 1 22 0 q-2 4 -5 2 q-3 3 -6 0 q-3 3 -6 0 q-3 2 -5 -2z" fill="#ff5c9a" />
        <circle cx="38" cy="19" r="4" fill="#b0287a" />
        <circle cx="38" cy="19" r="3" fill="#fff0f5" />
        <rect x="31" y="12" width="3" height="1.2" rx=".6" fill="#facc15" transform="rotate(30 32 12)" />
        <rect x="42" y="11" width="3" height="1.2" rx=".6" fill="#60a5fa" transform="rotate(-20 43 11)" />
        <rect x="44" y="16" width="3" height="1.2" rx=".6" fill="#fff" transform="rotate(50 45 16)" />
        <rect x="30" y="17" width="3" height="1.2" rx=".6" fill="#34d399" transform="rotate(-40 31 17)" />
      </g>
      {/* sac */}
      <path d="M13 26 h38 l-3.5 30 a3 3 0 0 1 -3 2.6 h-25 a3 3 0 0 1 -3 -2.6 z" fill="url(#co-sac)" />
      <path d="M13 26 h38 l-.6 5 h-36.8 z" fill="#e5528a" />
      <circle cx="23" cy="30" r="1.8" fill="#b0287a" />
      <circle cx="41" cy="30" r="1.8" fill="#b0287a" />
      <path d="M26 44 q6 5 12 0" stroke="#e5528a" strokeWidth="2.6" strokeLinecap="round" fill="none" />
    </svg>
  );
}
