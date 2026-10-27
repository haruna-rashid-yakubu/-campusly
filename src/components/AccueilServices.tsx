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
import { CARTE, TitreSection } from "@/components/TitreSection";

/*
 * The doors of the home screen. Each service has its own colour so it is
 * found by eye before it is read — four identical pale squares made the
 * screen look like a settings page.
 *
 * Ordering gets the wide card on top, the one place on the screen that pays
 * for everything else: it shows what can be ordered (the shops' own logos)
 * and says in one line why to do it here rather than elsewhere.
 */

type Tuile = { href: string; titre: string; sous: string; illustration: ReactNode; fond: string; teinte: string };

const SUJETS: Tuile = {
  href: "/sujets",
  titre: "Sujets",
  sous: "Annales",
  illustration: <IllustrationSujets size={44} />,
  fond: "#eef0ff",
  teinte: "#4f46e5",
};
const LOGEMENTS: Tuile = {
  href: "/logements",
  titre: "Logements",
  sous: "Vérifiés",
  illustration: <IllustrationLogements size={44} />,
  fond: "#fff3e8",
  teinte: "#ea580c",
};
const PROGRAMME: Tuile = {
  href: "/programme",
  titre: "Programme",
  sous: "De la semaine",
  illustration: <IllustrationProgramme size={44} />,
  fond: "#e8f8f6",
  teinte: "#0d9488",
};
const PRESSING: Tuile = {
  href: "/pressing",
  titre: "Pressing",
  sous: "Autour du campus",
  illustration: (
    <Image src="/pressing/logo.png" alt="" width={44} height={44} className="h-11 w-11 rounded-[14px]" />
  ),
  fond: "#eaf6fd",
  teinte: "#0284c7",
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
    <section className="mt-7 px-5">
      <TitreSection>Services</TitreSection>
      {commander && (
        <Link
          href="/commander"
          className="press-scale relative block overflow-hidden rounded-[20px] p-4 !text-white shadow-[0_10px_24px_-12px_rgba(229,82,138,.55)]"
          style={{ background: "linear-gradient(135deg, #ff7a59 0%, #e5528a 55%, #b0287a 100%)" }}
        >
          {/* Soft circles, so the card reads as a poster rather than a button. */}
          <span aria-hidden className="absolute -right-8 -top-10 h-36 w-36 rounded-full bg-white/15" />
          <span aria-hidden className="absolute -bottom-12 right-16 h-28 w-28 rounded-full bg-white/10" />

          <div className="relative flex items-center gap-3">
            <span className="grid h-11 w-11 flex-none place-items-center overflow-hidden rounded-[14px] bg-white">
              <IllustrationCommander size={40} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[16px] font-extrabold leading-tight">Commander</span>
              <span className="mt-0.5 block text-[13px] leading-snug text-white/90">
                Livré sur le campus · offres Campusly
              </span>
            </span>
            <span className="flex h-10 flex-none items-center gap-1 rounded-[14px] bg-white px-3.5 text-[14px] font-bold text-[#c2185b]">
              J&rsquo;en profite
              <Icon name="right" size={15} strokeWidth={2.4} />
            </span>
          </div>

          <div className="relative mt-3 flex items-center gap-2">
            {boutiques.map((b) =>
              b.logo ? (
                <Image
                  key={b.nom}
                  src={b.logo}
                  alt={b.nom}
                  width={36}
                  height={36}
                  className="h-9 w-9 rounded-[12px] bg-black object-cover ring-2 ring-white/70"
                />
              ) : (
                <span
                  key={b.nom}
                  className="grid h-9 place-items-center rounded-[12px] bg-white/20 px-2.5 text-[12px] font-extrabold ring-2 ring-white/50"
                >
                  {b.nom}
                </span>
              )
            )}
            <Image
              src="/pressing/logo.png"
              alt="Pressing"
              width={36}
              height={36}
              className="h-9 w-9 rounded-[12px] ring-2 ring-white/70"
            />
          </div>
        </Link>
      )}

      <div className={`grid gap-3 ${commander ? "mt-3 grid-cols-3" : "grid-cols-2"}`}>
        {tuiles.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className={`press-scale flex min-h-[112px] flex-col items-start justify-between p-3.5 text-ink active:opacity-80 ${CARTE}`}
          >
            <span className="block h-11 w-11 overflow-hidden rounded-[14px]">{t.illustration}</span>
            <span>
              <span className="block text-[14px] font-extrabold leading-tight tracking-tight">{t.titre}</span>
              <span className="mt-px block text-[12px] leading-snug text-slate-light">{t.sous}</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
