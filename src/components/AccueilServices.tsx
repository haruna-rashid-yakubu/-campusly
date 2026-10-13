import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "@/components/icons";
import {
  IllustrationCommander,
  IllustrationLogements,
  IllustrationProgramme,
  IllustrationSujets,
} from "@/components/IllustrationsServices";

/*
 * The doors of the home screen. Each service has its own colour so it is
 * found by eye before it is read — four identical pale squares made the
 * screen look like a settings page.
 *
 * Ordering gets the wide card on top, the one place on the screen that pays
 * for everything else: it shows what can be ordered (the shops' own logos)
 * and says in one line why to do it here rather than elsewhere.
 */

type Tuile = { href: string; titre: string; sous: string; illustration: ReactNode; fond: string };

const SUJETS: Tuile = {
  href: "/sujets",
  titre: "Sujets",
  sous: "Annales",
  illustration: <IllustrationSujets size={46} />,
  fond: "#eef0ff",
};
const LOGEMENTS: Tuile = {
  href: "/logements",
  titre: "Logements",
  sous: "Vérifiés",
  illustration: <IllustrationLogements size={46} />,
  fond: "#fff3e8",
};
const PROGRAMME: Tuile = {
  href: "/programme",
  titre: "Programme",
  sous: "De la semaine",
  illustration: <IllustrationProgramme size={46} />,
  fond: "#e8f8f6",
};
const PRESSING: Tuile = {
  href: "/pressing",
  titre: "Pressing",
  sous: "Autour du campus",
  illustration: (
    <Image src="/pressing/logo.png" alt="" width={46} height={46} className="h-[46px] w-[46px] rounded-[13px]" />
  ),
  fond: "#eaf6fd",
};

export function AccueilServices({
  boutiques,
}: {
  // Shops open to students; empty means the pressing keeps its own tile.
  boutiques: { nom: string; logo: string | null }[];
}) {
  const commander = boutiques.length > 0;
  const tuiles = commander ? [SUJETS, LOGEMENTS, PROGRAMME] : [SUJETS, LOGEMENTS, PRESSING, PROGRAMME];

  return (
    <div className="px-5 pt-5">
      {commander && (
        <Link
          href="/commander"
          className="press-scale relative block overflow-hidden rounded-[24px] p-4 !text-white shadow-[0_10px_28px_rgba(229,82,138,.28)]"
          style={{ background: "linear-gradient(135deg, #ff7a59 0%, #e5528a 55%, #b0287a 100%)" }}
        >
          {/* Soft circles, so the card reads as a poster rather than a button. */}
          <span aria-hidden className="absolute -right-8 -top-10 h-36 w-36 rounded-full bg-white/15" />
          <span aria-hidden className="absolute -bottom-12 right-16 h-28 w-28 rounded-full bg-white/10" />

          <div className="relative flex items-center gap-3.5">
            <span className="grid h-[60px] w-[60px] flex-none place-items-center rounded-[18px] bg-white shadow-[0_4px_12px_rgba(0,0,0,.12)]">
              <IllustrationCommander size={54} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[21px] font-extrabold leading-tight tracking-tight">Commander</span>
              <span className="mt-0.5 block text-[13px] font-semibold leading-snug text-white/90">
                Livré sur le campus · offres réservées à Campusly
              </span>
            </span>
          </div>

          <div className="relative mt-3.5 flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              {boutiques.map((b) =>
                b.logo ? (
                  <Image
                    key={b.nom}
                    src={b.logo}
                    alt={b.nom}
                    width={44}
                    height={44}
                    className="h-11 w-11 rounded-[13px] bg-black object-cover ring-2 ring-white/70"
                  />
                ) : (
                  <span
                    key={b.nom}
                    className="grid h-11 place-items-center rounded-[13px] bg-white/20 px-3 text-[13px] font-extrabold ring-2 ring-white/50"
                  >
                    {b.nom}
                  </span>
                )
              )}
              <Image
                src="/pressing/logo.png"
                alt="Pressing"
                width={44}
                height={44}
                className="h-11 w-11 rounded-[13px] ring-2 ring-white/70"
              />
            </span>
            <span className="flex flex-none items-center gap-1 rounded-full bg-white px-3.5 py-2 text-[13.5px] font-extrabold text-[#c2185b]">
              J&rsquo;en profite
              <Icon name="right" size={15} strokeWidth={2.6} />
            </span>
          </div>
        </Link>
      )}

      <div className={`grid gap-3 ${commander ? "mt-3 grid-cols-3" : "grid-cols-2"}`}>
        {tuiles.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className={`press-scale flex flex-col items-start justify-between rounded-[20px] p-3 text-ink active:opacity-80 ${
              commander ? "min-h-[108px]" : "min-h-[100px] p-3.5"
            }`}
            style={{ background: t.fond }}
          >
            <span className="block overflow-hidden rounded-[13px] shadow-[0_4px_10px_rgba(15,23,42,.14)]">
              {t.illustration}
            </span>
            <span>
              <span className="block text-[14.5px] font-extrabold leading-tight tracking-tight">{t.titre}</span>
              <span className="mt-px block text-[12px] leading-snug text-slate-light">{t.sous}</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
