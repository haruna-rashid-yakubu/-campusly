import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { PhotoCarousel } from "@/components/PhotoCarousel";
import { ShareSheet } from "@/components/ShareSheet";
import { WhatsAppContactButton } from "@/components/WhatsAppContactButton";
import { Icon } from "@/components/icons";
import { getCiteById } from "@/lib/data";
import { distanceLabel, fcfa, roomStockLabel } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const citeId = Number(id);
  if (Number.isNaN(citeId)) return { title: "Logement introuvable" };
  const cite = await getCiteById(citeId);
  if (!cite) return { title: "Logement introuvable" };
  return {
    title: cite.nom,
    description: `${cite.nom} — ${cite.quartier}, à ${distanceLabel(cite.distanceM)} de l'UCAC Nkolbisson. ${cite.description}`.trim(),
  };
}

const EQUIPMENTS = [
  { label: "Eau · forage", icon: "drop" as const },
  { label: "Électricité", icon: "bolt" as const },
  { label: "Gardien", icon: "lock" as const },
  { label: "Wi-Fi", icon: "wifi" as const },
];

export default async function CiteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const citeId = Number(id);
  if (Number.isNaN(citeId)) notFound();

  const [cite, session] = await Promise.all([getCiteById(citeId), auth()]);
  if (!cite) notFound();

  return (
    <div className="min-h-dvh pb-[calc(92px+var(--safe-bottom))]">
      <PhotoCarousel
        photos={cite.photos}
        alt={cite.nom}
        backHref="/logements"
        shareButton={
          <ShareSheet>
            <button
              className="press-scale grid h-[42px] w-[42px] place-items-center rounded-full bg-white/95 shadow-md"
              aria-label="Partager"
            >
              <Icon name="share" size={19} strokeWidth={1.9} />
            </button>
          </ShareSheet>
        }
      />

      <div className="px-5 pt-[18px]">
        <div className="flex items-start justify-between gap-2.5">
          <div>
            <div className="text-[24px] font-extrabold leading-tight tracking-tight">{cite.nom}</div>
            <div className="mt-1.5 flex items-center gap-1.5 text-[13.5px] text-slate-light">
              <Icon name="pin" size={15} strokeWidth={1.8} />
              {cite.quartier} · {distanceLabel(cite.distanceM)} de l&rsquo;UCAC
            </div>
          </div>
          <span className="flex h-7 flex-none items-center gap-1.5 rounded-[9px] bg-teal-tint px-2.5 text-[11.5px] font-extrabold text-teal-dark">
            <Icon name="shield" size={15} strokeWidth={1.9} />
            Vérifié
          </span>
        </div>

        <div className="mt-3.5 flex flex-wrap gap-2">
          {EQUIPMENTS.map((e) => (
            <span
              key={e.label}
              className="flex h-9 items-center gap-1.5 rounded-xl bg-surface-2 px-3 text-[13px] font-semibold text-ink-soft"
            >
              <Icon name={e.icon} size={16} strokeWidth={1.9} />
              {e.label}
            </span>
          ))}
        </div>

        <p className="mt-4 text-[14.5px] leading-relaxed text-slate">{cite.description}</p>

        <WhatsAppContactButton authed={!!session?.user} whatsapp={cite.whatsapp} />

        <div className="mt-2.5 flex items-start gap-2 text-[12.5px] leading-snug text-slate-light">
          <span className="mt-0.5 flex-none text-danger">
            <Icon name="warn" size={15} strokeWidth={1.9} />
          </span>
          Ne paie jamais avant d&rsquo;avoir visité la chambre.
        </div>

        <div className="mb-3 mt-6 text-lg font-extrabold tracking-tight">Types de chambres</div>
        {cite.roomTypes.map((r) => (
          <div key={r.id} className="mb-3 flex gap-3 rounded-[20px] border border-line p-3">
            <span className="grid h-[92px] w-[88px] flex-none place-items-center rounded-[14px] bg-line-3 text-[11px] font-semibold text-slate-light">
              photo
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <div className="text-[16px] font-extrabold">{r.type}</div>
                <div className="text-[12.5px] text-slate-light">{r.surface}</div>
              </div>
              <div className="mt-1.5 text-[16.5px] font-extrabold text-teal-dark">
                {fcfa(r.prixMensuel)}
                <span className="text-[12.5px] font-semibold text-slate-light"> / mois</span>
              </div>
              <div className="mt-2">
                <span
                  className="inline-flex h-[26px] items-center rounded-[9px] px-2.5 text-[11.5px] font-extrabold"
                  style={{
                    background: r.stock === 0 ? "#FDECEC" : r.stock === 1 ? "#FFF6E0" : "#F1F5F6",
                    color: r.stock === 0 ? "#B4322F" : r.stock === 1 ? "#8A6100" : "#475569",
                  }}
                >
                  {roomStockLabel(r.stock)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
