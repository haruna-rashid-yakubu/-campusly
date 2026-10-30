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

/* A dead tree, black against the sky, its branches reaching in from the edge. */
function ArbreMort({ className, inverse = false }: { className: string; inverse?: boolean }) {
  return (
    <svg viewBox="0 0 120 180" className={className} style={inverse ? { transform: "scaleX(-1)" } : undefined}>
      <path
        fill="#05030a"
        d="M0 180V0c6 10 8 22 7 34 8-10 18-16 30-17-10 6-17 14-21 25 9-4 19-4 28 0-11 1-21 6-27 14 6 2 11 6 14 12-7-4-14-5-20-3-2 12-1 25 3 37 7-9 17-15 29-17-9 6-16 14-20 24 10-3 21-2 31 4-12 0-23 4-31 12 3 12 3 24 0 35z"
      />
      <path fill="none" stroke="#05030a" strokeWidth="2.2" strokeLinecap="round" d="M37 17c6-3 12-3 18 0M44 42c4 3 9 4 14 3M49 106c5-3 11-3 17 0M56 134c5 2 9 6 11 11" />
    </svg>
  );
}

/* Two eyes in the dark that open now and then. */
function Yeux({ className, delai }: { className: string; delai: string }) {
  return (
    <svg viewBox="0 0 30 10" className={`hw-yeux ${className}`} style={{ animationDelay: delai }}>
      <ellipse cx="7" cy="5" rx="4.2" ry="2.6" fill="#ff2a12" />
      <ellipse cx="23" cy="5" rx="4.2" ry="2.6" fill="#ff2a12" />
      <ellipse cx="7.6" cy="5" rx="1.2" ry="2.2" fill="#2a0500" />
      <ellipse cx="23.6" cy="5" rx="1.2" ry="2.2" fill="#2a0500" />
    </svg>
  );
}

function NuitHalloween({ fond }: { fond: string }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[310px] overflow-hidden md:rounded-b-[32px]" aria-hidden="true">
      <div className="absolute inset-0" style={{ background: fond }} />
      {/* Stars, each on its own beat. */}
      {[[8, 40], [22, 18], [35, 64], [48, 26], [58, 52], [70, 14], [12, 92], [64, 88], [88, 40], [44, 104]].map(([x, y], i) => (
        <span
          key={i}
          className="hw-etoile absolute h-[2px] w-[2px] rounded-full bg-white"
          style={{ left: `${x}%`, top: y, animationDelay: `${(i * 0.7) % 4}s` }}
        />
      ))}
      {/* The moon, with a halo, and clouds that drift across it. */}
      <div className="hw-lune absolute right-[10px] top-[96px] h-[74px] w-[74px] rounded-full"
        style={{ background: "radial-gradient(circle at 38% 36%, #fffbe8 0 30%, #f6e7b0 55%, #d9c27e 78%, #b9a060 100%)", boxShadow: "0 0 30px 10px rgba(254,240,138,.28), 0 0 90px 30px rgba(254,240,138,.12)" }}>
        <span className="absolute left-[22%] top-[28%] h-[14%] w-[14%] rounded-full bg-[#c9b06a]/50" />
        <span className="absolute left-[55%] top-[52%] h-[20%] w-[20%] rounded-full bg-[#c9b06a]/45" />
        <span className="absolute left-[60%] top-[22%] h-[9%] w-[9%] rounded-full bg-[#c9b06a]/45" />
      </div>
      <div className="hw-nuage absolute top-[104px] h-[26px] w-[150px] rounded-full bg-[#120a1f]/80 blur-[6px]" />
      <div className="hw-nuage absolute top-[132px] h-[18px] w-[110px] rounded-full bg-[#120a1f]/70 blur-[5px]" style={{ animationDelay: "-11s", animationDuration: "26s" }} />
      {/* A flash of lightning, now and then. */}
      <svg viewBox="0 0 40 120" className="hw-eclair absolute left-[58%] top-0 h-[150px] w-[50px]">
        <path d="M22 0 12 46h10L8 120 32 38H21L30 0z" fill="#f5f3ff" />
      </svg>
      <div className="hw-flash absolute inset-0 bg-[#e9e3ff]" />
      <svg viewBox="0 0 120 120" className="absolute left-0 top-0 w-[110px]" fill="none" stroke="rgba(255,255,255,.5)" strokeWidth="1.1">
        <path d="M0 0L120 120M0 0L60 120M0 0L120 60M0 0L20 120M0 0L120 20" />
        <path d="M0 30q14 4 28-2 6 12 2 26 14-2 28 4M0 58q26 6 46-8 10 20 4 42 22-4 40 6M0 88q38 8 64-14 14 28 6 46" />
      </svg>
      <div className="hw-araignee absolute left-[150px] top-0 flex flex-col items-center">
        <div className="h-[46px] w-px bg-white/60" />
        <svg viewBox="0 0 40 30" className="w-[26px]">
          <path d="M14 14L2 6M14 16L1 16M14 18L3 27M26 14L38 6M26 16L39 16M26 18L37 27" stroke="#05030a" strokeWidth="2" fill="none" />
          <ellipse cx="20" cy="16" rx="8" ry="9" fill="#05030a" />
          <circle cx="17" cy="13" r="1.5" fill="#ff2a12" />
          <circle cx="23" cy="13" r="1.5" fill="#ff2a12" />
        </svg>
      </div>
      {/* Dead trees at both edges, with something watching from them. */}
      <ArbreMort className="absolute -left-[6px] top-[118px] h-[190px] w-[96px] opacity-95" />
      <ArbreMort className="absolute -right-[8px] top-[150px] h-[160px] w-[80px] opacity-90" inverse />
      <Yeux className="absolute left-[22px] top-[226px] w-[24px]" delai="0s" />
      <Yeux className="absolute right-[34px] top-[250px] w-[18px]" delai="-3.4s" />
      <Lanterne className="hw-lueur absolute right-[94px] top-[118px] w-[46px]" />
      <div className="hw-ronde absolute left-0 top-[70px] w-[64px]" style={{ "--duree": "9s" } as React.CSSProperties}>
        <ChauveSouris batt=".24s" className="w-full" />
      </div>
      <div className="hw-ronde absolute left-0 top-[118px] w-[42px]" style={{ "--duree": "12s", "--d": "-6s" } as React.CSSProperties}>
        <ChauveSouris batt=".2s" className="w-full" />
      </div>
      <div className="hw-ronde-inverse absolute left-0 top-[30px] w-[50px]">
        <ChauveSouris batt=".22s" className="w-full" />
      </div>
      {/* Two layers of fog drifting opposite ways, and the edges sunk in shadow. */}
      <div
        className="hw-brume absolute bottom-[34px] left-0 h-[70px] w-[200%] opacity-60 blur-[7px]"
        style={{ background: "repeating-radial-gradient(ellipse 120px 28px at 60px 34px, rgba(220,215,240,.4), rgba(220,215,240,0) 70%)", backgroundSize: "240px 70px" }}
      />
      <div
        className="hw-brume-inverse absolute bottom-[56px] left-[-100%] h-[50px] w-[200%] opacity-40 blur-[9px]"
        style={{ background: "repeating-radial-gradient(ellipse 160px 22px at 80px 25px, rgba(200,190,230,.45), rgba(200,190,230,0) 70%)", backgroundSize: "320px 50px" }}
      />
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 80% 70% at 50% 35%, transparent 55%, rgba(0,0,0,.45) 100%)" }} />
    </div>
  );
}

export function DecorSaison({ decor }: { decor: Decor }) {
  if (decor.motif === "halloween") return <NuitHalloween fond={decor.fond} />;
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[230px] overflow-hidden md:rounded-b-[32px]" aria-hidden="true">
      <div className="absolute inset-0" style={{ background: decor.fond }} />
      <Ruban couleur={decor.couleur} className="absolute right-[-6px] top-[58px] h-[78px] w-[50px] rotate-[14deg] opacity-25" />
      <Ruban couleur={decor.couleur} className="absolute right-[64px] top-[128px] h-[44px] w-[28px] -rotate-[10deg] opacity-15" />
      <Ruban couleur={decor.couleur} className="absolute left-[46%] top-[22px] h-[30px] w-[19px] rotate-[22deg] opacity-15" />
    </div>
  );
}
