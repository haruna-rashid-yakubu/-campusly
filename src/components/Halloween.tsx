"use client";

import { useEffect, useRef } from "react";
import { Icon } from "@/components/icons";

/*
 * Halloween's moving parts. A bat with ears, red eyes and two wings that beat
 * separately; the swarm that bursts out of a black screen the first time the
 * app is opened that day; and the odd bat crossing the whole screen, over the
 * tab bar too, long after. None of it takes a tap or says anything to a
 * screen reader, and globals.css stops all of it for reduced motion.
 */
export function ChauveSouris({ className = "", batt }: { className?: string; batt?: string }) {
  return (
    <svg
      viewBox="0 0 120 60"
      className={`hw-bat ${className}`}
      style={batt ? ({ "--batt": batt } as React.CSSProperties) : undefined}
      aria-hidden="true"
    >
      <path className="hw-aile-g" fill="#07040d" d="M56 24C46 10 26 4 2 10c8 4 12 10 12 18 5-4 11-4 15 1 3-4 9-5 13-1 2-4 8-5 14-4z" />
      <path className="hw-aile-d" fill="#07040d" d="M64 24c10-14 30-20 54-14-8 4-12 10-12 18-5-4-11-4-15 1-3-4-9-5-13-1-2-4-8-5-14-4z" />
      <path fill="#07040d" d="M53 16l2-8 4 6h2l4-6 2 8c3 3 4 8 3 13-2 8-6 13-8 15-2-2-6-7-8-15-1-5 0-10 3-13z" />
      <circle cx="57" cy="20" r="1.4" fill="#ff3b1f" />
      <circle cx="63" cy="20" r="1.4" fill="#ff3b1f" />
    </svg>
  );
}

const ESSAIM = [
  { x: -170, y: -380, r: -18, t: 119, d: 0 }, { x: 160, y: -420, r: 14, t: 153, d: 0.05 },
  { x: -210, y: -120, r: -30, t: 102, d: 0.1 }, { x: 220, y: -160, r: 24, t: 125, d: 0.08 },
  { x: -60, y: -470, r: -6, t: 187, d: 0.15 }, { x: 70, y: -300, r: 10, t: 91, d: 0.2 },
  { x: -230, y: 140, r: -40, t: 108, d: 0.12 }, { x: 230, y: 120, r: 36, t: 142, d: 0.18 },
  { x: 20, y: -520, r: 4, t: 238, d: 0.25 }, { x: -120, y: 320, r: -50, t: 98, d: 0.22 },
  { x: 140, y: 340, r: 46, t: 112, d: 0.28 }, { x: -260, y: -300, r: -22, t: 136, d: 0.32 },
  { x: 260, y: -340, r: 20, t: 105, d: 0.35 }, { x: -300, y: -40, r: -60, t: 90, d: 0.4 },
  { x: 300, y: -60, r: 60, t: 100, d: 0.42 }, { x: -90, y: -560, r: -10, t: 120, d: 0.45 },
  { x: 110, y: -600, r: 12, t: 96, d: 0.5 }, { x: -180, y: 500, r: -140, t: 86, d: 0.38 },
  { x: 190, y: 480, r: 140, t: 104, d: 0.48 }, { x: -20, y: 420, r: 180, t: 85, d: 0.3 },
];

export function Halloween({ apercu = false, essaim = true }: { apercu?: boolean; essaim?: boolean }) {
  // The swarm is in the page from the start but hidden, and plays once the
  // class goes on. On the day itself it plays on every opening: students
  // open the app again to film it. The days before have no swarm at all.
  const intro = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Shown ahead of the day, the whole app takes the day's orange too.
    if (apercu) document.documentElement.setAttribute("data-couleur", "halloween");
    if (essaim) intro.current?.classList.add("hw-joue");
    if (apercu) return () => document.documentElement.removeAttribute("data-couleur");
  }, [apercu, essaim]);

  return (
    <div className="pointer-events-none fixed inset-0 z-[45] overflow-hidden" aria-hidden="true">
      <div className="hw-traverse absolute left-0 top-0 w-[86px]">
        <ChauveSouris batt=".2s" className="w-full" />
      </div>
      <div className="hw-retour absolute left-0 top-0 w-[64px]">
        <ChauveSouris batt=".24s" className="w-full" />
      </div>
      <div ref={intro} className="hw-intro absolute inset-0" hidden={!essaim}>
          <div className="hw-intro-titre absolute inset-x-0 top-[46%] text-center text-[30px] font-extrabold tracking-tight text-[#f97316]">
            <span className="inline-flex items-center gap-2.5">
              Joyeux Halloween
              <Icon name="pumpkin" size={30} strokeWidth={2} />
            </span>
          </div>
          {ESSAIM.map((b, i) => (
            <div
              key={i}
              className="hw-essaim absolute left-1/2 top-[58%]"
              style={
                {
                  width: b.t,
                  marginLeft: -b.t / 2,
                  "--x": `${b.x}px`,
                  "--y": `${b.y}px`,
                  "--r": `${b.r}deg`,
                  "--d": `${b.d}s`,
                } as React.CSSProperties
              }
            >
              <ChauveSouris batt={`${0.16 + (i % 4) * 0.03}s`} className="w-full" />
            </div>
          ))}
      </div>
    </div>
  );
}
