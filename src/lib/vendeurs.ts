import { and, asc, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db";
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
export async function getVendeurs({ inclureInactifs = false } = {}): Promise<Vendeur[]> {
  return db
    .select()
    .from(vendeurs)
    .where(inclureInactifs ? undefined : eq(vendeurs.actif, true))
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
  parfums: { nom: string; quantite: number }[];
  formules: { nom: string; quantite: number }[];
  parPromo: { promo: string | null; commandes: number }[];
  dernieres: { reference: string; total: number; detail: string; date: Date }[];
};

type DetailCommande = { formule: string; parfums: Record<string, number> }[];

export function resumerDetail(detail: DetailCommande): string {
  return detail
    .map(
      (l) =>
        `${l.formule} : ${Object.entries(l.parfums)
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
    })
    .from(commandeEvenements)
    .where(periode);

  const envois = await db
    .select({
      reference: commandeEvenements.reference,
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
    parfums: trier(parfums),
    formules: trier(formules),
    parPromo,
    dernieres: envois.slice(0, 30).map((e) => ({
      reference: e.reference ?? "",
      total: e.total ?? 0,
      detail: resumerDetail((e.detail as DetailCommande | null) ?? []),
      date: e.date,
    })),
  };
}
