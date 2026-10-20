/*
 * The season's dress for the top of the home screen: a soft wash of colour and
 * a few motifs drawn faintly behind the greeting. Decoration only — it sits
 * behind the content, takes no taps and says nothing to a screen reader.
 */
export type Decor = { fond: string; motif: "ruban"; couleur: string };

function Ruban({ className, couleur }: { className: string; couleur: string }) {
  return (
    <svg viewBox="0 0 40 64" className={className} fill="none" aria-hidden="true">
      <path
        d="M20 6c-7 0-11 6-9 13 2 6 6 12 9 17m0-30c7 0 11 6 9 13-2 6-6 12-9 17m0 0L9 58m11-22 11 22"
        stroke={couleur}
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function DecorSaison({ decor }: { decor: Decor }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[230px] overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0" style={{ background: decor.fond }} />
      <Ruban couleur={decor.couleur} className="absolute right-[-6px] top-[58px] h-[78px] w-[50px] rotate-[14deg] opacity-25" />
      <Ruban couleur={decor.couleur} className="absolute right-[64px] top-[128px] h-[44px] w-[28px] -rotate-[10deg] opacity-15" />
      <Ruban couleur={decor.couleur} className="absolute left-[46%] top-[22px] h-[30px] w-[19px] rotate-[22deg] opacity-15" />
    </div>
  );
}
