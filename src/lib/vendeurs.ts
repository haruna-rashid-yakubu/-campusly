import type { CarteUne } from "@/components/AlaUne";
import { and, asc, desc, eq, gte, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { fcfa } from "@/lib/utils";
import {
  classes,
  commandeEvenements,
  vendeurArticles,
  vendeurFormules,
  vendeurs,
} from "@/db/schema";

export type Vendeur = typeof vendeurs.$inferSelect;
export type Formule = typeof vendeurFormules.$inferSelect;
export type Article = typeof vendeurArticles.$inferSelect;

/* One pack in the basket: which formule, and how many of each flavour. */
export type LignePanier = { formuleId: number; parfums: Record<number, number> };

/* Shops a student can see, or every shop for an admin checking one before it opens. */
/*
 * Shops a student can see, or every shop for an admin checking one before it
 * opens. Campusly's own services (category "interne", the pressing) live in
 * the same table so their orders are counted and confirmed the same way, but
 * they have their own pages and are not listed as shops — except on the
 * admin's stats page, which asks for them.
 */
export async function getVendeurs({ inclureInactifs = false, inclureInternes = false } = {}): Promise<Vendeur[]> {
  const conditions = [
    inclureInactifs ? undefined : eq(vendeurs.actif, true),
    inclureInternes ? undefined : ne(vendeurs.categorie, "interne"),
  ].filter(Boolean);
  return db
    .select()
    .from(vendeurs)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(asc(vendeurs.ordre), asc(vendeurs.id));
}

export async function getVendeurParSlug(slug: string): Promise<Vendeur | null> {
  const [row] = await db.select().from(vendeurs).where(eq(vendeurs.slug, slug)).limit(1);
  return row ?? null;
}

export async function getCatalogue(vendeurId: number) {
  const [formules, articles] = await Promise.all([
    db
      .select()
      .from(vendeurFormules)
      .where(and(eq(vendeurFormules.vendeurId, vendeurId), eq(vendeurFormules.actif, true)))
      .orderBy(asc(vendeurFormules.ordre), asc(vendeurFormules.id)),
    db
      .select()
      .from(vendeurArticles)
      .where(eq(vendeurArticles.vendeurId, vendeurId))
      .orderBy(asc(vendeurArticles.ordre), asc(vendeurArticles.id)),
  ]);
  return { formules, articles };
}

export type StatsVendeur = {
  jours: number;
  // Distinct devices at each step, so one student reopening the page five
  // times is one visitor, not five.
  visiteurs: number;
  paniers: number;
  commandes: number;
  // Every press of the button, including someone sending a second order.
  envois: number;
  totalEnvoye: number;
  // Marked by the vendor from their link.
  livrees: number;
  nonRecues: number;
  clients: {
    // Since the shop opened, whatever the period on screen.
    total: number;
    // Ordered during the period.
    actifs: number;
    // Whose first order falls inside the period.
    nouveaux: number;
    // Two orders or more, ever — the ones who came back.
    fideles: number;
  };
  parfums: { nom: string; quantite: number }[];
  formules: { nom: string; quantite: number }[];
  parPromo: { promo: string | null; commandes: number }[];
  dernieres: { id: number; reference: string; total: number; detail: string; date: Date; statut: string | null }[];
};

// Menu lines also carry quantite (and plat); pack lines only formule and parfums.
type DetailCommande = { formule: string; parfums: Record<string, number>; quantite?: number; plat?: boolean }[];

export function resumerDetail(detail: DetailCommande): string {
  return detail
    .map((l) =>
      // A menu line already names its choice: "2 × Poulet pané (Grand) · Frites de plantain".
      typeof l.quantite === "number"
        ? `${l.quantite} × ${l.formule}`
        : `${l.formule} : ${Object.entries(l.parfums)
            .map(([nom, q]) => `${q} ${nom}`)
            .join(", ")}`
    )
    .join(" · ");
}

export async function getStatsVendeur(vendeurId: number, jours: number): Promise<StatsVendeur> {
  const depuis = new Date(Date.now() - jours * 24 * 3600_000);
  const periode = and(
    eq(commandeEvenements.vendeurId, vendeurId),
    gte(commandeEvenements.createdAt, depuis)
  );

  const [compteurs] = await db
    .select({
      visiteurs: sql<number>`count(distinct ${commandeEvenements.deviceId}) filter (where ${commandeEvenements.type} = 'vue')::int`,
      paniers: sql<number>`count(distinct ${commandeEvenements.deviceId}) filter (where ${commandeEvenements.type} = 'ajout')::int`,
      commandes: sql<number>`count(distinct ${commandeEvenements.deviceId}) filter (where ${commandeEvenements.type} = 'commander')::int`,
      envois: sql<number>`count(*) filter (where ${commandeEvenements.type} = 'commander')::int`,
      totalEnvoye: sql<number>`coalesce(sum(${commandeEvenements.total}) filter (where ${commandeEvenements.type} = 'commander'), 0)::int`,
      livrees: sql<number>`count(*) filter (where ${commandeEvenements.type} = 'commander' and ${commandeEvenements.statut} = 'livree')::int`,
      nonRecues: sql<number>`count(*) filter (where ${commandeEvenements.type} = 'commander' and ${commandeEvenements.statut} = 'non_recue')::int`,
    })
    .from(commandeEvenements)
    .where(periode);

  /*
   * A client is a device that pressed "Commander" at least once. It counts
   * phones, not people — two students sharing one phone are one client, and
   * one student on two phones is two — but it is the closest honest measure
   * without asking anyone to sign in to order.
   */
  const clientsResult = await db.execute<{
    total: number;
    actifs: number;
    nouveaux: number;
    fideles: number;
  }>(sql`
    with c as (
      select device_id, min(created_at) as premier, max(created_at) as dernier, count(*) as n
      from commande_evenement
      where vendeur_id = ${vendeurId} and type = 'commander'
      group by device_id
    )
    select
      count(*)::int as total,
      (count(*) filter (where dernier >= ${depuis}))::int as actifs,
      (count(*) filter (where premier >= ${depuis}))::int as nouveaux,
      (count(*) filter (where n >= 2))::int as fideles
    from c
  `);
  const clients = clientsResult.rows[0] ?? { total: 0, actifs: 0, nouveaux: 0, fideles: 0 };

  const envois = await db
    .select({
      id: commandeEvenements.id,
      reference: commandeEvenements.reference,
      statut: commandeEvenements.statut,
      total: commandeEvenements.total,
      detail: commandeEvenements.detail,
      date: commandeEvenements.createdAt,
    })
    .from(commandeEvenements)
    .where(and(periode, eq(commandeEvenements.type, "commander")))
    .orderBy(desc(commandeEvenements.createdAt));

  const parfums = new Map<string, number>();
  const formules = new Map<string, number>();
  for (const e of envois) {
    for (const ligne of (e.detail as DetailCommande | null) ?? []) {
      formules.set(ligne.formule, (formules.get(ligne.formule) ?? 0) + 1);
      for (const [nom, q] of Object.entries(ligne.parfums)) {
        parfums.set(nom, (parfums.get(nom) ?? 0) + q);
      }
    }
  }
  const trier = (m: Map<string, number>) =>
    [...m.entries()].map(([nom, quantite]) => ({ nom, quantite })).sort((a, b) => b.quantite - a.quantite);

  const parPromo = await db
    .select({
      promo: classes.label,
      commandes: sql<number>`count(*)::int`,
    })
    .from(commandeEvenements)
    .leftJoin(classes, eq(classes.id, commandeEvenements.classeId))
    .where(and(periode, eq(commandeEvenements.type, "commander")))
    .groupBy(classes.label)
    .orderBy(desc(sql`count(*)`));

  return {
    jours,
    visiteurs: compteurs?.visiteurs ?? 0,
    paniers: compteurs?.paniers ?? 0,
    commandes: compteurs?.commandes ?? 0,
    envois: compteurs?.envois ?? 0,
    totalEnvoye: compteurs?.totalEnvoye ?? 0,
    livrees: compteurs?.livrees ?? 0,
    nonRecues: compteurs?.nonRecues ?? 0,
    clients: {
      total: Number(clients.total),
      actifs: Number(clients.actifs),
      nouveaux: Number(clients.nouveaux),
      fideles: Number(clients.fideles),
    },
    parfums: trier(parfums),
    formules: trier(formules),
    parPromo,
    dernieres: envois.slice(0, 30).map((e) => ({
      id: e.id,
      statut: e.statut,
      reference: e.reference ?? "",
      total: e.total ?? 0,
      detail: resumerDetail((e.detail as DetailCommande | null) ?? []),
      date: e.date,
    })),
  };
}

/* Orders sent from Campusly over the last days, newest first, for the vendor's page. */
export async function getCommandesRecentes(vendeurId: number, jours: number) {
  const depuis = new Date(Date.now() - jours * 24 * 3600_000);
  return db
    .select()
    .from(commandeEvenements)
    .where(
      and(
        eq(commandeEvenements.vendeurId, vendeurId),
        eq(commandeEvenements.type, "commander"),
        gte(commandeEvenements.createdAt, depuis)
      )
    )
    .orderBy(desc(commandeEvenements.createdAt));
}

/*
 * The shops the home screen announces under "Nouveautés": the open ones
 * added in the last month, newest first, two at most. After a month a shop
 * is no longer news, and the latest paper takes the line back.
 */
export function boutiquesRecentes(ouvertes: Vendeur[], jours = 30, max = 2) {
  const depuis = Date.now() - jours * 24 * 3600_000;
  return [...ouvertes]
    .filter((v) => v.createdAt.getTime() >= depuis)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, max);
}

/*
 * The home screen's big cards: every open shop that has a photo for it, the
 * newest first. Priced from its own catalogue; the pressing, a Campusly
 * service with no catalogue, says where it goes instead of a price.
 */
export async function cartesALaUne(ouvertes: Vendeur[]): Promise<CarteUne[]> {
  const avecPhoto = [...ouvertes]
    .filter((v) => v.uneImage)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  const plusRecente = boutiquesRecentes(ouvertes, 30, 1)[0]?.id;
  const f = (n: number) => fcfa(n).replace(" FCFA", " F");

  const cartes = await Promise.all(
    avecPhoto.map(async (v): Promise<CarteUne | null> => {
      if (v.categorie === "interne") {
        return {
          href: `/${v.slug}`,
          nom: v.nom,
          image: v.uneImage!,
          ligne: v.accroche ?? "",
          prix: "Campus et alentours",
          offre: null,
          badge: "Service Campusly",
          bouton: "Réserver",
        };
      }
      const { formules, articles } = await getCatalogue(v.id);
      if (formules.length === 0) return null;
      const min = Math.min(...formules.map((x) => x.prix));
      const unite = v.unite && formules.length === 1 && formules[0].taille === 1;
      const noms = articles.map((a) => a.nom);
      return {
        href: `/commander/${v.slug}`,
        nom: v.nom,
        image: v.uneImage!,
        ligne: noms.length > 3 ? `${noms.slice(0, 3).join(" · ")}…` : noms.join(" · "),
        prix: unite ? `${f(min)} ${v.unite === "bouteille" ? "la" : "le"} ${v.unite}` : `À partir de ${f(min)}`,
        offre: v.fraisLivraison === 0 ? "Livraison gratuite" : null,
        badge: v.id === plusRecente ? "Nouveau sur Campusly" : "Coup de cœur",
        bouton: "Commander",
      };
    })
  );
  return cartes.filter((c): c is CarteUne => c !== null);
}
