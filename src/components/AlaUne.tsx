"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/icons";

/*
 * The shops, shown big on the home screen, one card at a time: its own photo,
 * what it sells and for how much, and one button. A line in "Nouveautés" is
 * read by those who scroll; this is seen by everyone who opens the app.
 *
 * The cards turn by themselves every few seconds and can be swiped. A touch
 * stops the turning for a while: someone reading a card should not have it
 * taken away under their thumb.
 */
export type CarteUne = {
  href: string;
  nom: string;
  image: string;
  ligne: string; // "Fraise · Menthe · Cacao"
  prix: string; // "500 F la bouteille"
  offre: string | null; // "Livraison gratuite"
  badge: string; // "Nouveau sur Campusly"
  bouton: string; // "Commander"
  // A poster that carries its own title: shown as it is, the name moves under it.
  affiche?: boolean;
};

const INTERVALLE_MS = 3000;
const PAUSE_APRES_TOUCHER_MS = 12000;

export function AlaUne({ cartes }: { cartes: CarteUne[] }) {
  const rail = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const reprise = useRef(0);

  // Which card is showing, read from the scroll position: swipes and the timer move it the same way.
  const surDefilement = () => {
    const el = rail.current;
    if (!el) return;
    setActive(Math.round(el.scrollLeft / el.clientWidth));
  };

  useEffect(() => {
    if (cartes.length < 2) return;
    const id = window.setInterval(() => {
      const el = rail.current;
      if (!el || Date.now() < reprise.current || document.hidden) return;
      const suivante = (Math.round(el.scrollLeft / el.clientWidth) + 1) % cartes.length;
      el.scrollTo({ left: suivante * el.clientWidth, behavior: "smooth" });
    }, INTERVALLE_MS);
    return () => window.clearInterval(id);
  }, [cartes.length]);

  const toucher = () => {
    reprise.current = Date.now() + PAUSE_APRES_TOUCHER_MS;
  };

  return (
    <div className="pt-5">
      <div
        ref={rail}
        onScroll={surDefilement}
        onPointerDown={toucher}
        onTouchStart={toucher}
        className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {cartes.map((c, i) => (
          <div key={c.href} className="w-full flex-none snap-center px-5">
            <Link
              href={c.href}
              className="press-scale relative block overflow-hidden rounded-[24px] bg-ink !text-white shadow-[0_10px_28px_rgba(15,23,42,.22)]"
            >
              <div className="relative aspect-[16/9] w-full">
                <Image
                  src={c.image}
                  alt={c.nom}
                  fill
                  priority={i === 0}
                  sizes="(max-width: 480px) 100vw, 440px"
                  className="object-cover"
                />
                {!c.affiche && (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <span className="absolute left-3 top-3 rounded-full bg-white px-2.5 py-1 text-[11.5px] font-extrabold uppercase tracking-wide text-[#c2185b] shadow">
                      {c.badge}
                    </span>
                    <div className="absolute inset-x-0 bottom-0 p-4">
                      <div className="text-[24px] font-extrabold leading-none tracking-tight">{c.nom}</div>
                      <div className="mt-1 truncate text-[13.5px] font-semibold text-white/90">{c.ligne}</div>
                    </div>
                  </>
                )}
              </div>
              <div className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  {c.affiche && <div className="truncate text-[12px] font-bold uppercase tracking-wide text-[#5eead4]">{c.badge}</div>}
                  <div className="truncate text-[15px] font-extrabold">{c.prix}</div>
                  {c.offre && <div className="mt-0.5 truncate text-[12.5px] font-semibold text-[#5eead4]">🚚 {c.offre}</div>}
                </div>
                <span className="flex flex-none items-center gap-1 rounded-full bg-white px-4 py-2.5 text-[14px] font-extrabold text-ink">
                  {c.bouton}
                  <Icon name="right" size={15} strokeWidth={2.6} />
                </span>
              </div>
            </Link>
          </div>
        ))}
      </div>
      {cartes.length > 1 && (
        <div className="mt-2.5 flex justify-center gap-1.5" aria-hidden="true">
          {cartes.map((c, i) => (
            <span
              key={c.href}
              className={`h-1.5 rounded-full transition-all ${i === active ? "w-5 bg-ink" : "w-1.5 bg-line-4"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
