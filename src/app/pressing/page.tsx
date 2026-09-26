import type { Metadata } from "next";
import { Icon } from "@/components/icons";
import { Badge, EmptyState } from "@/components/EmptyState";
import { getPressings } from "@/lib/data";
import { fcfa } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Pressings partenaires",
  description: "Pressings partenaires autour de l'UCAC Nkolbisson, avec tarifs indicatifs.",
  alternates: { canonical: "/pressing" },
};

export const dynamic = "force-dynamic";

export default async function PressingPage() {
  const pressings = await getPressings();

  return (
    <div className="min-h-dvh pb-[calc(92px+var(--safe-bottom))]">
      <div className="sticky top-0 z-10 bg-white px-5" style={{ paddingTop: "calc(20px + var(--safe-top))" }}>
        <div className="text-[24px] font-extrabold tracking-tight">Pressing</div>
        <div className="mt-0.5 pb-3 text-[13.5px] text-slate-light">
          Tarifs indicatifs · à confirmer sur place
        </div>
      </div>

      <div className="px-5 pt-2">
        {/* Nothing listed is a shelf still being built, not a broken page. The
            demo entries that used to sit here carried invented phone numbers,
            and a student who calls one of those does not come back. */}
        {pressings.length === 0 && (
          <EmptyState
            icon="shirt"
            title="Aucun pressing référencé"
            body="On ajoute les pressings un par un, avec leurs vrais tarifs. Tu en connais un près du campus ?"
          />
        )}
        {pressings.map((p) => (
          <div key={p.id} className="mb-3.5 rounded-[22px] border border-line p-4">
            <div className="flex items-start justify-between gap-2.5">
              <div>
                <div className="text-[17.5px] font-extrabold tracking-tight">{p.nom}</div>
                <div className="mt-1 flex items-center gap-1.5 text-[13px] text-slate-light">
                  <Icon name="pin" size={15} strokeWidth={1.8} />
                  {p.quartier} · {p.distanceLabel}
                </div>
              </div>
              <Badge tone={p.badge === "Partenaire" ? "teal" : "neutral"}>{p.badge}</Badge>
            </div>
            <div className="mt-3.5 border-t border-line-3">
              {p.tarifs.map((t) => (
                <div key={t.id} className="flex justify-between border-b border-surface-3 py-2.5 text-[14px]">
                  <span className="text-slate">{t.article}</span>
                  <span className="font-extrabold tabular-nums">{fcfa(t.prix)}</span>
                </div>
              ))}
            </div>
            <a
              href={`https://wa.me/${p.whatsapp.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="press-scale mt-3.5 flex h-[50px] w-full items-center justify-center gap-2 rounded-2xl bg-teal text-[14.5px] font-bold text-white active:bg-teal-press"
            >
              <Icon name="chat" size={19} strokeWidth={1.9} />
              Contacter sur WhatsApp
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
