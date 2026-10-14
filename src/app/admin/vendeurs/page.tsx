import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { BackHeader } from "@/components/BackHeader";
import { SignInRequired } from "@/components/SignInRequired";
import { EmptyState, Badge } from "@/components/EmptyState";
import { CopierReleve, LienVendeur, OuvertureVendeur, RuptureToggle } from "@/components/admin/VendeurControles";
import { getReleve, moisDe, type Releve } from "@/lib/facturation";
import { getCatalogue, getStatsVendeur, getVendeurs } from "@/lib/vendeurs";
import { fcfa } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Vendeurs",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const PERIODES = [7, 30, 90] as const;

function pct(a: number, b: number) {
  return b > 0 ? `${Math.round((a / b) * 100)} %` : "—";
}

/*
 * What Campusly sent each shop's way. Every count is of devices, so a
 * student reopening the page is one visitor; "envois" alone counts presses,
 * because two orders from one student are two orders. Nothing here can say
 * whether the message was actually sent or the order delivered — that is
 * read off the references with the vendor.
 */
export default async function VendeursAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ jours?: string }>;
}) {
  const session = await auth();
  if (!session?.user) return <SignInRequired backHref="/admin" title="Vendeurs" />;
  if (session.user.role !== "admin") {
    return (
      <div className="min-h-dvh">
        <BackHeader title="Vendeurs" fallbackHref="/admin" border />
        <EmptyState icon="lock" title="Réservé à l'équipe Campusly" body="Ton compte n'a pas les droits d'administration." />
      </div>
    );
  }

  const { jours: brut } = await searchParams;
  const jours = PERIODES.includes(Number(brut) as (typeof PERIODES)[number]) ? Number(brut) : 7;
  const vendeurs = await getVendeurs({ inclureInactifs: true, inclureInternes: true });
  const ceMois = moisDe(new Date());
  const moisPasse =
    ceMois.mois === 0 ? { annee: ceMois.annee - 1, mois: 11 } : { annee: ceMois.annee, mois: ceMois.mois - 1 };
  const fiches = await Promise.all(
    vendeurs.map(async (v) => ({
      vendeur: v,
      stats: await getStatsVendeur(v.id, jours),
      catalogue: await getCatalogue(v.id),
      releves: v.facturation
        ? await Promise.all(
            [ceMois, moisPasse].map((m) => getReleve(v, m.annee, m.mois))
          )
        : [],
    }))
  );

  return (
    <div className="min-h-dvh pb-12">
      <BackHeader title="Vendeurs" fallbackHref="/admin" border />
      <div className="px-5 pt-4">
        <div className="flex gap-1.5">
          {PERIODES.map((p) => (
            <Link
              key={p}
              href={`/admin/vendeurs?jours=${p}`}
              className={`h-[34px] rounded-full px-3.5 text-[12.5px] font-bold leading-[34px] ${
                p === jours ? "bg-teal text-white" : "border-[1.5px] border-line-4 text-slate"
              }`}
            >
              {p} jours
            </Link>
          ))}
        </div>

        {fiches.length === 0 && (
          <p className="mt-6 text-[14px] text-slate-light">Aucun vendeur pour l&rsquo;instant.</p>
        )}

        {fiches.map(({ vendeur: v, stats: s, catalogue, releves }) => (
          <section key={v.id} className="mt-5 rounded-[20px] border-[1.5px] border-line-4 p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="text-[18px] font-extrabold">{v.nom}</div>
              <Badge tone={v.actif ? "teal" : "warn"}>{v.actif ? "Ouvert" : "Masqué"}</Badge>
            </div>
            <Link href={`/commander/${v.slug}`} className="mt-1 inline-block text-[13px] font-bold text-teal-dark">
              Voir la page {v.actif ? "" : "(aperçu)"} →
            </Link>
            <OuvertureVendeur id={v.id} nom={v.nom} actif={v.actif} />
            {v.tokenEspace && <LienVendeur vendeurId={v.id} token={v.tokenEspace} nom={v.nom} />}
            {releves.map((r, i) =>
              r ? <ReleveMois key={r.mois} releve={r} vendeur={v} enCours={i === 0} /> : null
            )}

            <div className="mt-4 text-[12px] font-bold uppercase tracking-wide text-slate-light">
              Sur {s.jours} jours
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2">
              <Chiffre valeur={s.visiteurs} legende="Visiteurs" />
              <Chiffre valeur={s.paniers} legende={`Ont rempli un panier · ${pct(s.paniers, s.visiteurs)}`} />
              <Chiffre valeur={s.commandes} legende={`Ont cliqué Commander · ${pct(s.commandes, s.visiteurs)}`} />
            </div>

            <div className="mt-4 text-[12px] font-bold uppercase tracking-wide text-slate-light">Clients</div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Chiffre valeur={s.clients.actifs} legende={`Clients sur ${s.jours} jours`} />
              <Chiffre valeur={s.clients.nouveaux} legende="Nouveaux clients sur la période" />
              <Chiffre valeur={s.clients.fideles} legende="Clients revenus (2 commandes ou plus)" />
              <Chiffre valeur={s.clients.total} legende="Clients depuis l'ouverture" />
            </div>
            <p className="mt-1.5 text-[11.5px] leading-snug text-slate-light">
              Un client = un téléphone qui a cliqué « Commander ». La commande elle-même se confirme
              sur WhatsApp, avec les références ci-dessous.
            </p>
            <p className="mt-2.5 text-[13px] text-slate">
              <b>{s.envois}</b> commande{s.envois > 1 ? "s" : ""} envoyée{s.envois > 1 ? "s" : ""} vers WhatsApp,
              {s.totalEnvoye > 0 && (
                <>
                  {" "}pour <b>{fcfa(s.totalEnvoye)}</b> au total, livraison comprise.
                </>
              )}
            </p>
            <p className="mt-1 text-[13px] text-slate">
              Confirmées par {v.nom} : <b>{s.livrees}</b> livrée{s.livrees > 1 ? "s" : ""}
              {s.nonRecues > 0 && <> · {s.nonRecues} jamais reçue{s.nonRecues > 1 ? "s" : ""}</>}
              {" "}· {Math.max(0, s.envois - s.livrees - s.nonRecues)} en attente.
            </p>

            {s.parfums.length > 0 && (
              <Liste titre="Parfums les plus choisis" lignes={s.parfums.map((p) => [p.nom, `${p.quantite}`])} />
            )}
            {s.formules.length > 0 && (
              <Liste titre="Packs" lignes={s.formules.map((f) => [f.nom, `${f.quantite}`])} />
            )}
            {s.parPromo.length > 0 && (
              <Liste
                titre="Commandes par promo"
                lignes={s.parPromo.map((p) => [p.promo ?? "Promo inconnue", `${p.commandes}`])}
              />
            )}

            {s.dernieres.length > 0 && (
              <>
                <div className="mb-1 mt-4 text-[13px] font-bold text-ink-soft">
                  Références à rapprocher avec {v.nom}
                </div>
                {s.dernieres.map((d) => (
                  <div key={d.reference + d.date.toISOString()} className="border-t border-line-3 py-2 text-[12.5px]">
                    <div className="flex justify-between gap-2">
                      <span className="font-extrabold">{d.reference}</span>
                      <span className="tabular-nums text-slate-light">
                        {d.date.toLocaleString("fr-FR", {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                          timeZone: "Africa/Douala",
                        })}{" "}
                        · {fcfa(d.total)}
                      </span>
                    </div>
                    <div className="mt-0.5 leading-snug text-slate">{d.detail}</div>
                  </div>
                ))}
              </>
            )}

            <div className="mb-1 mt-4 text-[13px] font-bold text-ink-soft">Disponibilité</div>
            {catalogue.articles.map((a) => (
              <div key={a.id} className="flex items-center justify-between gap-2 border-t border-line-3 py-2">
                <span className="text-[13.5px]">{a.nom}</span>
                <RuptureToggle id={a.id} nom={a.nom} enRupture={a.enRupture} />
              </div>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}

function Chiffre({ valeur, legende }: { valeur: number; legende: string }) {
  return (
    <div className="rounded-[14px] border border-line p-2.5">
      <div className="text-[22px] font-extrabold leading-none tabular-nums">{valeur}</div>
      <div className="mt-1 text-[11px] leading-snug text-slate-light">{legende}</div>
    </div>
  );
}

function Liste({ titre, lignes }: { titre: string; lignes: [string, string][] }) {
  return (
    <>
      <div className="mb-1 mt-4 text-[13px] font-bold text-ink-soft">{titre}</div>
      {lignes.map(([a, b]) => (
        <div key={a} className="flex justify-between border-t border-line-3 py-1.5 text-[13px]">
          <span>{a}</span>
          <span className="font-extrabold tabular-nums">{b}</span>
        </div>
      ))}
    </>
  );
}

/*
 * The month's bill for a shop on commission or flat fee. The current month
 * is a running count; the previous one is what to ask for at the start of
 * this month, with the new advance.
 */
function ReleveMois({
  releve: r,
  vendeur: v,
  enCours,
}: {
  releve: Releve;
  vendeur: { nom: string; facturation: string | null; commissionParArticle: number | null };
  enCours: boolean;
}) {
  const commission = v.facturation === "commission";
  const texte = [
    `Relevé Campusly · ${v.nom} · ${r.mois}`,
    "",
    ...r.lignes.map(
      (l) =>
        `${l.reference} · ${l.date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", timeZone: "Africa/Douala" })} · ${l.articles} article${l.articles > 1 ? "s" : ""}${
          l.note === "pas_recue" ? " · Pas reçue, non comptée" : l.note === "pas_recue_tardive" ? " · Pas reçue après 48 h, comptée" : ""
        }`
    ),
    "",
    ...(commission
      ? [
          `Articles comptés : ${r.articles} × ${fcfa(v.commissionParArticle ?? 0)} = ${fcfa(r.articles * (v.commissionParArticle ?? 0))}`,
          `Avance payée en début de mois : ${fcfa(r.avance)}`,
          `Reste à payer avec l'avance du mois prochain : ${fcfa(r.reste)}`,
        ]
      : [`Forfait du mois : ${fcfa(r.du)}`]),
  ].join("\n");

  return (
    <div className="mt-4 rounded-[14px] border border-line p-3">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[13px] font-bold text-ink-soft first-letter:uppercase">
          {r.mois} {enCours ? "· en cours" : ""}
        </span>
        <span className="text-[12px] text-slate-light">{commission ? "Commission" : "Forfait"}</span>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2">
        <Chiffre valeur={r.articles} legende="Articles comptés" />
        <Chiffre valeur={r.du} legende="Dû pour le mois (F)" />
        <Chiffre valeur={r.reste} legende="Reste après l'avance (F)" />
      </div>
      {(r.exclues > 0 || r.tardives > 0) && (
        <p className="mt-1.5 text-[11.5px] leading-snug text-slate-light">
          {r.exclues > 0 && <>{r.exclues} « Pas reçue » non comptée{r.exclues > 1 ? "s" : ""}. </>}
          {r.tardives > 0 && (
            <b className="text-warn-ink">
              {r.tardives} « Pas reçue » marquée{r.tardives > 1 ? "s" : ""} après 48 h, comptée{r.tardives > 1 ? "s" : ""}.
            </b>
          )}
        </p>
      )}
      {r.lignes.length > 0 && <CopierReleve texte={texte} />}
    </div>
  );
}
