/*
 * The season's dress for the top of the home screen: a soft wash of colour and
 * a few motifs drawn faintly behind the greeting. Decoration only — it sits
 * behind the content, takes no taps and says nothing to a screen reader.
 */
import { ChauveSouris } from "@/components/Halloween";

export type Decor = {
  fond: string;
  motif: "ruban" | "halloween";
  couleur: string;
  // A line of its own above the carousel, for a season that has something to say.
  ruban?: { texte: string; fond: string; encre: string };
  // Halloween only: the swarm that opens the app, kept for the day itself.
  essaim?: boolean;
};

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

/* A carved pumpkin lit from inside, its face flickering like a candle. */
function Lanterne({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 100 90" className={className} aria-hidden="true">
      <path d="M50 18c-2-8 2-14 8-16" stroke="#3f6212" strokeWidth="6" strokeLinecap="round" fill="none" />
      <ellipse cx="30" cy="54" rx="24" ry="32" fill="#c2410c" />
      <ellipse cx="70" cy="54" rx="24" ry="32" fill="#c2410c" />
      <ellipse cx="50" cy="54" rx="22" ry="34" fill="#ea580c" />
      <g className="hw-lanterne" fill="#fde047">
        <path d="M24 42l14-2-6 13z" />
        <path d="M76 42l-14-2 6 13z" />
        <path d="M47 55h6l-3 7z" />
        <path d="M20 66c10 10 50 10 60 0l-4 12-6-5-6 7-6-6-6 6-6-7-6 5z" />
      </g>
    </svg>
  );
}

function NuitHalloween({ fond }: { fond: string }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[300px] overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0" style={{ background: fond }} />
      <svg viewBox="0 0 60 60" className="hw-lune absolute right-[16px] top-[112px] w-[54px]">
        <circle cx="30" cy="30" r="28" fill="#fef3c7" />
        <circle cx="22" cy="22" r="5" fill="#fde68a" />
        <circle cx="38" cy="36" r="7" fill="#fde68a" />
        <circle cx="36" cy="18" r="3" fill="#fde68a" />
      </svg>
      <svg viewBox="0 0 120 120" className="absolute left-0 top-0 w-[120px]" fill="none" stroke="rgba(255,255,255,.55)" strokeWidth="1.2">
        <path d="M0 0L120 120M0 0L60 120M0 0L120 60M0 0L20 120M0 0L120 20" />
        <path d="M0 30q14 4 28-2 6 12 2 26 14-2 28 4M0 58q26 6 46-8 10 20 4 42 22-4 40 6M0 88q38 8 64-14 14 28 6 46" />
      </svg>
      <div className="hw-araignee absolute left-[150px] top-0 flex flex-col items-center">
        <div className="h-[46px] w-px bg-white/60" />
        <svg viewBox="0 0 40 30" className="w-[26px]">
          <path d="M14 14L2 6M14 16L1 16M14 18L3 27M26 14L38 6M26 16L39 16M26 18L37 27" stroke="#07040d" strokeWidth="2" fill="none" />
          <ellipse cx="20" cy="16" rx="8" ry="9" fill="#07040d" />
          <circle cx="17" cy="13" r="1.5" fill="#ff3b1f" />
          <circle cx="23" cy="13" r="1.5" fill="#ff3b1f" />
        </svg>
      </div>
      <Lanterne className="hw-lueur absolute right-[82px] top-[118px] w-[48px]" />
      <div className="hw-ronde absolute left-0 top-[70px] w-[64px]" style={{ "--duree": "9s" } as React.CSSProperties}>
        <ChauveSouris batt=".24s" className="w-full" />
      </div>
      <div className="hw-ronde absolute left-0 top-[118px] w-[42px]" style={{ "--duree": "12s", "--d": "-6s" } as React.CSSProperties}>
        <ChauveSouris batt=".2s" className="w-full" />
      </div>
      <div className="hw-ronde-inverse absolute left-0 top-[30px] w-[50px]">
        <ChauveSouris batt=".22s" className="w-full" />
      </div>
      <div
        className="hw-brume absolute bottom-[40px] left-0 h-[60px] w-[200%] opacity-50 blur-[6px]"
        style={{ background: "repeating-radial-gradient(ellipse 120px 26px at 60px 30px, rgba(255,255,255,.35), rgba(255,255,255,0) 70%)", backgroundSize: "240px 60px" }}
      />
    </div>
  );
}

export function DecorSaison({ decor }: { decor: Decor }) {
  if (decor.motif === "halloween") return <NuitHalloween fond={decor.fond} />;
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[230px] overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0" style={{ background: decor.fond }} />
      <Ruban couleur={decor.couleur} className="absolute right-[-6px] top-[58px] h-[78px] w-[50px] rotate-[14deg] opacity-25" />
      <Ruban couleur={decor.couleur} className="absolute right-[64px] top-[128px] h-[44px] w-[28px] -rotate-[10deg] opacity-15" />
      <Ruban couleur={decor.couleur} className="absolute left-[46%] top-[22px] h-[30px] w-[19px] rotate-[22deg] opacity-15" />
    </div>
  );
}
