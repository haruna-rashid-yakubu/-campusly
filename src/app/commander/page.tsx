import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { auth } from "@/auth";
import { Badge } from "@/components/EmptyState";
import { Icon } from "@/components/icons";
import { PucePanier } from "@/components/commander/PucePanier";
import { getVendeurs } from "@/lib/vendeurs";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Commander",
  description: "Commande à manger et tes services autour de l'UCAC, depuis Campusly.",
  alternates: { canonical: "/commander" },
};

/*
 * One door for every shop, rather than one tile per shop on the home screen.
 * Categories are not shown as such until there are two shops in one: a
 * heading over a single card is a folder with one sheet in it.
 */
const CATEGORIES: Record<string, string> = { manger: "À manger", service: "Services" };

export default async function CommanderPage() {
  const session = await auth();
  const admin = session?.user?.role === "admin";
  const vendeurs = await getVendeurs({ inclureInactifs: admin });

  const parCategorie = new Map<string, typeof vendeurs>();
  for (const v of vendeurs) parCategorie.set(v.categorie, [...(parCategorie.get(v.categorie) ?? []), v]);
  const titres = [...parCategorie.values()].some((liste) => liste.length > 1);

  return (
    <div className="min-h-dvh pb-[calc(92px+var(--safe-bottom))]">
      <div className="px-5" style={{ paddingTop: "calc(20px + var(--safe-top))" }}>
        <div className="text-[24px] font-extrabold tracking-tight">Commander</div>
        <div className="mt-0.5 pb-3 text-[13.5px] text-slate-light">
          Tu choisis ici, tu finalises sur WhatsApp avec le vendeur.
        </div>
      </div>

      <div className="flex flex-col gap-3 px-5">
        {[...parCategorie.entries()].map(([categorie, liste]) => (
          <div key={categorie} className="flex flex-col gap-3">
            {titres && (
              <div className="mt-2 text-base font-extrabold">{CATEGORIES[categorie] ?? categorie}</div>
            )}
            {liste.map((v) => (
              <Link
                key={v.id}
                href={`/commander/${v.slug}`}
                className="press-scale flex items-center gap-3.5 overflow-hidden rounded-[22px] border border-line bg-white p-3 active:bg-surface-3"
              >
                {v.logoCarreUrl ? (
                  <Image
                    src={v.logoCarreUrl}
                    alt=""
                    width={64}
                    height={64}
                    className="h-[64px] w-[64px] flex-none rounded-[16px] bg-black object-cover"
                  />
                ) : (
                  <span
                    className="grid h-[64px] w-[64px] flex-none place-items-center rounded-[16px] text-[#c2185b]"
                    style={{ background: "repeating-linear-gradient(135deg, #f7b6c9 0 9px, #fff4f7 9px 18px)" }}
                  >
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-white">
                      <Icon name="donut" size={24} strokeWidth={1.9} />
                    </span>
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="text-[17px] font-extrabold">{v.nom}</span>
                    {!v.actif && <Badge tone="neutral">Aperçu</Badge>}
                  </span>
                  {v.accroche && (
                    <span className="mt-0.5 block text-[13px] leading-snug text-slate-light">{v.accroche}</span>
                  )}
                  <PucePanier vendeurId={v.id} />
                </span>
                <Icon name="right" size={18} className="flex-none text-slate-light" />
              </Link>
            ))}
          </div>
        ))}

        {titres && <div className="mt-2 text-base font-extrabold">Services</div>}
        <Link
          href="/pressing"
          className="press-scale flex items-center gap-3.5 rounded-[22px] border border-line bg-white p-3 active:bg-surface-3"
        >
          <Image
            src="/pressing/logo.png"
            alt=""
            width={64}
            height={64}
            className="h-[64px] w-[64px] flex-none rounded-[16px]"
          />
          <span className="min-w-0 flex-1">
            <span className="block text-[17px] font-extrabold">Pressing Campusly</span>
            <span className="mt-0.5 block text-[13px] leading-snug text-slate-light">
              Récupération, lavage et livraison sur le campus et aux alentours
            </span>
          </span>
          <Icon name="right" size={18} className="flex-none text-slate-light" />
        </Link>
      </div>
    </div>
  );
}
