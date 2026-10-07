import type { Metadata } from "next";
import { Icon } from "@/components/icons";
import { Badge } from "@/components/EmptyState";
import { auth } from "@/auth";
import { PressingCommande } from "@/components/PressingCommande";
import { getPressings } from "@/lib/data";
import { pageMetadata } from "@/lib/seo";
import { CAMPUS_NOM } from "@/lib/constants";
import { fcfa } from "@/lib/utils";

/*
 * "Pressings partenaires" described a directory of partner shops with
 * indicative prices. There is one service, Campusly's own, at a fixed price
 * paid after weighing — so the card a student shared promised something the
 * page does not have.
 */
export const metadata: Metadata = pageMetadata({
  title: "Pressing étudiant",
  description: `Le pressing Campusly pour les étudiants de l'${CAMPUS_NOM} : 500 F/kg couleurs, 800 F/kg blancs, lavé et essoré, payé après pesée.`,
  path: "/pressing",
});

export const dynamic = "force-dynamic";

export default async function PressingPage() {
  const [pressings, session] = await Promise.all([getPressings(), auth()]);

  return (
    <div className="min-h-dvh pb-[calc(92px+var(--safe-bottom))]">
      <div className="sticky top-0 z-10 bg-white px-5" style={{ paddingTop: "calc(20px + var(--safe-top))" }}>
        <div className="text-[24px] font-extrabold tracking-tight">Pressing</div>
        <div className="mt-0.5 pb-3 text-[13.5px] text-slate-light">
          Récupération, lavage et livraison sur le campus
        </div>
      </div>

      <div className="px-5 pt-2">
        {/* The service itself leads: it is the one someone can actually order
            from. Partner pressings, when there are any, come after. */}
        <PressingCommande nom={session?.user?.name} />

        {pressings.length > 0 && (
          <div className="mb-3 mt-8 text-base font-extrabold tracking-tight">
            Autres pressings autour du campus
          </div>
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
