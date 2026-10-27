"use client";

import { useEffect, useRef } from "react";
import { Icon, type IconName } from "@/components/icons";

/*
 * An election day for the sports association: the first opening of the day
 * fills the screen with balls bouncing up from the bottom, and a call to go
 * and vote — for no one in particular. It takes no tap, says nothing to a
 * screen reader, and globals.css drops it for reduced motion.
 */
// The app's own line icons, each in its ball's colour, rather than emoji.
const COULEUR: Record<string, string> = {
  soccer: "#ffffff",
  basketball: "#fb923c",
  volleyball: "#fde68a",
  tennis: "#bef264",
  pingpong: "#f87171",
  shuttlecock: "#ffffff",
};

const BALLONS: { e: IconName; x: number; t: number; d: number; h: number }[] = [
  { e: "soccer", x: 8, t: 54, d: 0, h: 72 },
  { e: "basketball", x: 26, t: 64, d: 0.12, h: 84 },
  { e: "volleyball", x: 46, t: 50, d: 0.05, h: 66 },
  { e: "tennis", x: 64, t: 40, d: 0.2, h: 78 },
  { e: "soccer", x: 82, t: 58, d: 0.08, h: 70 },
  { e: "pingpong", x: 16, t: 38, d: 0.3, h: 58 },
  { e: "basketball", x: 74, t: 48, d: 0.34, h: 62 },
  { e: "shuttlecock", x: 36, t: 42, d: 0.26, h: 90 },
  { e: "volleyball", x: 90, t: 44, d: 0.4, h: 52 },
  { e: "tennis", x: 54, t: 36, d: 0.45, h: 74 },
];

const CLE = "campusly_intro";

export function IntroSport({ apercu = false }: { apercu?: boolean }) {
  // In the page from the start but hidden, so a second opening never flashes it.
  const intro = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cle = `sport-${new Date(Date.now() + 36e5).toISOString().slice(0, 10)}`;
    let dejaVu = false;
    try {
      dejaVu = !apercu && localStorage.getItem(CLE) === cle;
      localStorage.setItem(CLE, cle);
    } catch {
      // Without storage it simply plays on every opening.
    }
    if (!dejaVu) intro.current?.classList.add("sp-joue");
  }, [apercu]);

  return (
    <div ref={intro} className="sp-intro pointer-events-none fixed inset-0 z-[45] overflow-hidden" aria-hidden="true">
      {BALLONS.map((b, i) => (
        <span
          key={i}
          className="sp-ballon absolute bottom-0"
          style={
            {
              left: `${b.x}%`,
              fontSize: b.t,
              marginLeft: -b.t / 2,
              "--h": `-${b.h}vh`,
              "--d": `${b.d}s`,
            } as React.CSSProperties
          }
        >
          <span style={{ color: COULEUR[b.e], display: "block" }}>
            <Icon name={b.e} size={b.t} strokeWidth={1.6} />
          </span>
        </span>
      ))}
      <div className="sp-titre absolute inset-x-6 top-[36%] text-center">
        <div className="flex justify-center text-white">
          <Icon name="ballot" size={46} strokeWidth={1.7} />
        </div>
        <div className="mt-3 text-[30px] font-extrabold leading-tight tracking-tight text-white">
          Élections de l&rsquo;Association sportive
        </div>
        <div className="mt-2 text-[17px] font-bold text-[#fde68a]">Fais entendre ta voix !</div>
      </div>
    </div>
  );
}
