import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { LogementsFilterBar } from "@/components/LogementsFilterBar";
import { EmptyState } from "@/components/EmptyState";
import { Icon } from "@/components/icons";
import { getCitesWithAvailability } from "@/lib/data";
import { citeAvailabilityLabel, distanceLabel, fcfa } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Logements étudiants vérifiés",
  description: "Cités et logements étudiants vérifiés autour de l'UCAC Nkolbisson, à Yaoundé.",
  alternates: { canonical: "/logements" },
};

export const dynamic = "force-dynamic";

export default async function LogementsPage({
  searchParams,
}: {
  searchParams: Promise<{ dist?: string; prix?: string; quartier?: string; tri?: string }>;
}) {
  const params = await searchParams;
  const cites = await getCitesWithAvailability({
    maxDistanceM: params.dist ? Number(params.dist) : undefined,
    maxPrice: params.prix ? Number(params.prix) : undefined,
    quartier: params.quartier,
    sort: params.tri === "prix" ? "prix" : "distance",
  });
  const hasFilters = Boolean(params.dist || params.prix || params.quartier);

  return (
    <div className="min-h-dvh pb-[calc(92px+var(--safe-bottom))]">
      <div className="sticky top-0 z-10 bg-white px-5" style={{ paddingTop: "calc(20px + var(--safe-top))" }}>
        <div className="text-[24px] font-extrabold tracking-tight">Logements</div>
        <div className="mt-0.5 text-[13.5px] text-slate-light">
          {cites.length} cité{cites.length > 1 ? "s" : ""} autour de l&rsquo;UCAC Nkolbisson
        </div>
        <LogementsFilterBar />
      </div>

      <div className="px-5 pt-2.5">
        {cites.length === 0 ? (
          <EmptyState icon="bed" title="Rien avec ces filtres" body="Élargis la distance ou le budget pour voir plus de cités.">
            {hasFilters && (
              <Link
                href="/logements"
                className="press-scale mt-5 inline-flex h-[50px] items-center rounded-2xl border-[1.5px] border-teal px-5 text-[15px] font-bold text-teal-dark"
              >
                Effacer les filtres
              </Link>
            )}
          </EmptyState>
        ) : (
          <>
            {cites.map((c) => (
              <Link
                key={c.id}
                href={`/logements/${c.id}`}
                prefetch={false}
                className="press-scale mb-3.5 block overflow-hidden rounded-[22px] border border-line bg-white"
              >
                <div className="relative grid h-[154px] place-items-center bg-line-3 text-[12.5px] font-semibold text-slate-light">
                  {c.photos[0] ? (
                    <Image src={c.photos[0]} alt={c.nom} fill className="object-cover" />
                  ) : (
                    "photo de la cité"
                  )}
                  {c.verified && (
                    <span className="absolute left-3 top-3 flex h-7 items-center gap-1.5 rounded-[9px] bg-white px-2.5 text-[11.5px] font-extrabold text-teal-dark">
                      <Icon name="shield" size={14} strokeWidth={1.9} />
                      Vérifié par Campusly
                    </span>
                  )}
                  <span
                    className="absolute bottom-3 left-3 flex h-7 items-center rounded-[9px] px-2.5 text-[11.5px] font-extrabold text-white"
                    style={{ background: c.stock === 0 ? "#B4322F" : "rgba(15,23,42,.8)" }}
                  >
                    {citeAvailabilityLabel(c.stock)}
                  </span>
                </div>
                <div className="p-3.5">
                  <div className="flex items-baseline justify-between gap-2.5">
                    <span className="text-[17.5px] font-extrabold tracking-tight">{c.nom}</span>
                    <span className="whitespace-nowrap text-[12.5px] font-bold text-teal-dark">
                      {distanceLabel(c.distanceM)}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 text-[13px] text-slate-light">
                    <Icon name="pin" size={15} strokeWidth={1.8} />
                    {c.quartier}
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-line-3 pt-3">
                    <span>
                      <span className="block text-[12px] text-slate-light">à partir de</span>
                      <span className="block text-[16.5px] font-extrabold">{fcfa(c.minPrice)}</span>
                    </span>
                    <span className="grid h-[42px] items-center rounded-[13px] bg-teal-tint px-4 text-[14px] font-bold text-teal-dark">
                      Voir les chambres
                    </span>
                  </div>
                </div>
              </Link>
            ))}
            <div className="pb-2.5 pt-1 text-center text-[12.5px] text-slate-light">
              Annonces ajoutées et vérifiées par l&rsquo;équipe Campusly
            </div>
          </>
        )}
      </div>
    </div>
  );
}
