import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { IconeService, type Service } from "@/components/IconeService";
import { TitreSection } from "@/components/TitreSection";

/*
 * The doors of the home screen.
 *
 * Ordering is the wide card on top: the shops' own logos say what can be
 * ordered before a word is read. Under it, the four services in two columns,
 * each with its colour and an icon drawn for it (IconeService) — the glossy
 * illustrations beside photographed logos made four different styles on one
 * screen — and a line that says something true today: how many papers, which
 * week, rather than a generic word.
 */

type Tuile = { href: string; titre: string; sous: string; icone: Service; teinte: string; fond: string; badge?: string };

export function AccueilServices({
  boutiques,
  nombreSujets,
  classe,
}: {
  // Shops open to students; none hides the ordering card.
  boutiques: { nom: string; logo: string | null }[];
  nombreSujets: number;
  classe: string | null;
}) {
  const tuiles: Tuile[] = [
    {
      href: "/sujets",
      titre: "Anciens sujets",
      sous: nombreSujets > 0 ? `${nombreSujets} annales, avec un tuteur IA` : "Annales et tuteur IA",
      icone: "sujets",
      teinte: "#4f46e5",
      fond: "#eef0ff",
      badge: "IA",
    },
    {
      href: "/programme",
      titre: "Programme",
      sous: classe ? `Ta semaine en ${classe}` : "L'emploi du temps de ta promo",
      icone: "programme",
      teinte: "#0d9488",
      fond: "#e6f7f5",
    },
    { href: "/logements", titre: "Logements", sous: "Cités vérifiées autour du campus", icone: "logements", teinte: "#ea580c", fond: "#fff1e6" },
    { href: "/pressing", titre: "Pressing", sous: "Lavage et repassage, retrait au campus", icone: "pressing", teinte: "#0284c7", fond: "#e8f4fd" },
  ];
  const visibles = boutiques.slice(0, 4);

  return (
    <section className="mt-7 px-5">
      <TitreSection>Services</TitreSection>

      {boutiques.length > 0 && (
        <Link
          href="/commander"
          className="press-scale relative mb-3 block overflow-hidden rounded-[22px] p-4 !text-white shadow-[0_12px_28px_-14px_rgba(229,82,138,.7)]"
          style={{ background: "linear-gradient(135deg, #ff7a59 0%, #e5528a 58%, #b0287a 100%)" }}
        >
          <span aria-hidden className="absolute -right-10 -top-12 h-40 w-40 rounded-full bg-white/12" />
          <span aria-hidden className="absolute -bottom-14 right-20 h-28 w-28 rounded-full bg-white/10" />

          <div className="relative flex items-start gap-3">
            <span className="grid h-12 w-12 flex-none place-items-center rounded-2xl bg-white/20 ring-1 ring-white/30">
              <IconeService service="commander" couleur="#ffffff" taille={28} />
            </span>
            <span className="min-w-0 flex-1 pt-0.5">
              <span className="block text-[17px] font-extrabold leading-tight tracking-tight">Commander</span>
              <span className="mt-0.5 block text-[13px] leading-snug text-white/90">Repas, desserts et pressing, livrés sur le campus</span>
            </span>
            <span className="grid h-10 w-10 flex-none place-items-center rounded-full bg-white text-[#c2185b]">
              <Icon name="right" size={18} strokeWidth={2.6} />
            </span>
          </div>

          {/* The shops themselves, their square logos overlapping. */}
          <div className="relative mt-3.5 flex items-center gap-2.5">
            <span className="flex -space-x-2">
              {visibles.map((b) =>
                b.logo ? (
                  <Image key={b.nom} src={b.logo} alt={b.nom} width={34} height={34} className="h-[34px] w-[34px] rounded-[11px] bg-white object-cover ring-2 ring-white" />
                ) : (
                  <span key={b.nom} className="grid h-[34px] w-[34px] place-items-center rounded-[11px] bg-white text-[12px] font-black text-[#c2185b] ring-2 ring-white">
                    {b.nom.charAt(0)}
                  </span>
                )
              )}
            </span>
            <span className="min-w-0 truncate text-[12.5px] font-semibold text-white/90">
              {visibles.map((b) => b.nom).slice(0, 2).join(", ")}
              {boutiques.length > 2 ? ` et ${boutiques.length - 2} autre${boutiques.length - 2 > 1 ? "s" : ""}` : ""}
            </span>
          </div>
        </Link>
      )}

      <div className="grid grid-cols-2 gap-3">
        {tuiles.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="press-scale group relative flex flex-col rounded-[20px] border border-line bg-white p-3.5 text-ink shadow-[0_1px_2px_rgba(15,23,42,.04),0_10px_24px_-16px_rgba(15,23,42,.22)] active:bg-surface-3"
          >
            <span className="flex items-start justify-between">
              <span className="grid h-12 w-12 place-items-center rounded-[15px]" style={{ background: t.fond }}>
                <IconeService service={t.icone} couleur={t.teinte} />
              </span>
              {t.badge ? (
                <span className="flex h-6 items-center gap-1 rounded-full px-2 text-[11px] font-black text-white" style={{ background: t.teinte }}>
                  <Icon name="spark" size={12} strokeWidth={2.4} />
                  {t.badge}
                </span>
              ) : (
                <Icon name="right" size={16} className="mt-1 text-slate-light" />
              )}
            </span>
            {/* Two lines kept for every subtitle, so the four titles sit on the same line. */}
            <span className="mt-3 block text-[15px] font-extrabold leading-tight tracking-tight">{t.titre}</span>
            <span className="mt-1 line-clamp-2 block min-h-[2lh] text-[12.5px] leading-snug text-slate">{t.sous}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
