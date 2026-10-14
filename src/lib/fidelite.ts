import { and, count, eq, gte, isNotNull, isNull, ne, or } from "drizzle-orm";
import { db } from "@/db";
import { commandeEvenements } from "@/db/schema";

/*
 * The Campusly loyalty card. Each shop sets its own: how many orders fill a
 * card, and which ones carry a gift. Bronuts, the first, as agreed with the
 * vendor:
 *
 *   3rd and 6th order: one donut offered — 10th order: a pack of 4 offered —
 *   then the card starts again.
 *
 * An order is any order with at least one pack, and it counts once the vendor
 * has marked it delivered from their link. A click on "Commander" proves
 * nothing — the message may never have been sent — so only the vendor's tick
 * moves the card. The gift travels with the order that earns it: the 3rd
 * order's WhatsApp message already says "1 donut offert", so the vendor puts
 * it in the box that day.
 */

export type Palier = {
  rang: number; // 1…cycle
  cle: string; // stored on the order that carries it
  libelle: string; // "1 donut offert", as written in the message
  icone: string; // drawn in the card's box
};

export type Regle = {
  cycle: number;
  paliers: Palier[];
  // Heads the "order delivered" notification.
  icone: string;
};

export const REGLE_BRONUTS: Regle = {
  cycle: 10,
  icone: "🍩",
  paliers: [
    { rang: 3, cle: "donut", libelle: "1 donut offert", icone: "🍩" },
    { rang: 6, cle: "donut", libelle: "1 donut offert", icone: "🍩" },
    { rang: 10, cle: "pack4", libelle: "1 pack de 4 offert", icone: "🎁" },
  ],
};

/*
 * A shop without a rule of its own keeps Bronuts', which is the one every
 * card was drawn with before rules became per shop. A rule read from the
 * database is checked here rather than trusted: a malformed one would
 * otherwise break the shop's page.
 */
export function regleDe(v: { fideliteRegle?: unknown }): Regle {
  const r = v.fideliteRegle as Partial<Regle> | null | undefined;
  if (!r || !Number.isInteger(r.cycle) || (r.cycle ?? 0) < 1 || !Array.isArray(r.paliers)) {
    return REGLE_BRONUTS;
  }
  const paliers = r.paliers.filter(
    (p): p is Palier =>
      !!p && Number.isInteger(p.rang) && p.rang >= 1 && p.rang <= r.cycle! && !!p.cle && !!p.libelle
  );
  if (paliers.length === 0) return REGLE_BRONUTS;
  return { cycle: r.cycle!, paliers, icone: r.icone || "🎁" };
}

/** What a gift stored on an order reads as, for the vendor's list. */
export function libelleRecompense(regle: Regle, cle: string) {
  return regle.paliers.find((p) => p.cle === cle)?.libelle ?? cle;
}

/** Place of an order on the card (1…cycle) from its rank among the person's orders. */
export function position(regle: Regle, rang: number) {
  return ((rang - 1) % regle.cycle) + 1;
}

export function palierPourRang(regle: Regle, rang: number): Palier | null {
  const p = position(regle, rang);
  return regle.paliers.find((x) => x.rang === p) ?? null;
}

/** Deliveries confirmed by the vendor for this person. */
export async function commandesLivrees(userId: string, vendeurId: number) {
  const [row] = await db
    .select({ n: count() })
    .from(commandeEvenements)
    .where(
      and(
        eq(commandeEvenements.userId, userId),
        eq(commandeEvenements.vendeurId, vendeurId),
        eq(commandeEvenements.type, "commander"),
        eq(commandeEvenements.statut, "livree")
      )
    );
  return row?.n ?? 0;
}

export type Carte = {
  regle: Regle;
  livrees: number;
  // Stamps on the current card, 0…cycle-1 (a full card has just started again).
  tampons: number;
  // What the next order will carry, if anything, and how far the next gift is.
  prochaine: Palier | null;
  prochainCadeau: { dans: number; palier: Palier };
  cases: { numero: number; cadeau: Palier | null; faite: boolean }[];
};

export function carteDepuis(regle: Regle, livrees: number): Carte {
  const tampons = livrees % regle.cycle;
  let dans = 1;
  while (!palierPourRang(regle, livrees + dans)) dans += 1;
  return {
    regle,
    livrees,
    tampons,
    prochaine: palierPourRang(regle, livrees + 1),
    prochainCadeau: { dans, palier: palierPourRang(regle, livrees + dans)! },
    cases: Array.from({ length: regle.cycle }, (_, i) => ({
      numero: i + 1,
      cadeau: regle.paliers.find((p) => p.rang === i + 1) ?? null,
      faite: i < tampons,
    })),
  };
}

/** The card as a signed-out visitor sees it: the shop's boxes, none done. */
export function carteVide(regle: Regle) {
  return carteDepuis(regle, 0).cases;
}

/** The rule in one sentence, for the signed-out card. */
export function resumeRegle(regle: Regle) {
  const parLibelle = new Map<string, number[]>();
  for (const p of [...regle.paliers].sort((a, b) => a.rang - b.rang)) {
    parLibelle.set(p.libelle, [...(parLibelle.get(p.libelle) ?? []), p.rang]);
  }
  return [...parLibelle.entries()]
    .map(([libelle, rangs]) => `${rangs.map((r) => `${r}ᵉ`).join(" et ")} commande : ${libelle}`)
    .join(" · ");
}

export async function getCarte(userId: string, vendeurId: number, regle: Regle) {
  return carteDepuis(regle, await commandesLivrees(userId, vendeurId));
}

/*
 * A weekly card, for a restaurant: so many dishes delivered between Monday
 * and Saturday earn a gift on the next order, once a week. The count starts
 * again every Monday in Yaoundé. Dishes, not orders — three plates in one
 * order are three — and an ice cream is not a dish.
 */
export type RegleHebdo = { type: "hebdo"; seuil: number; libelle: string; icone: string };

export function regleHebdoDe(v: { fideliteRegle?: unknown }): RegleHebdo | null {
  const r = v.fideliteRegle as Partial<RegleHebdo> | null | undefined;
  if (!r || r.type !== "hebdo" || !Number.isInteger(r.seuil) || (r.seuil ?? 0) < 1 || !r.libelle) return null;
  return { type: "hebdo", seuil: r.seuil!, libelle: r.libelle, icone: r.icone || "🎁" };
}

const WAT_MS = 3600_000;

/** Monday 00:00 in Yaoundé, as a UTC instant. */
export function debutSemaineWAT(maintenant = new Date()) {
  const wat = new Date(maintenant.getTime() + WAT_MS);
  const jour = (wat.getUTCDay() + 6) % 7; // 0 = Monday
  const lundi = Date.UTC(wat.getUTCFullYear(), wat.getUTCMonth(), wat.getUTCDate() - jour);
  return new Date(lundi - WAT_MS);
}

type LigneDetail = { plat?: boolean; quantite?: number };

export type ProgresHebdo = { plats: number; seuil: number; cadeauPret: boolean; dejaOffert: boolean };

export async function progresHebdo(userId: string, vendeurId: number, regle: RegleHebdo, maintenant = new Date()) {
  const depuis = debutSemaineWAT(maintenant);
  const semaine = and(
    eq(commandeEvenements.userId, userId),
    eq(commandeEvenements.vendeurId, vendeurId),
    eq(commandeEvenements.type, "commander"),
    gte(commandeEvenements.createdAt, depuis)
  );
  const livrees = await db
    .select({ detail: commandeEvenements.detail })
    .from(commandeEvenements)
    .where(and(semaine, eq(commandeEvenements.statut, "livree")));
  const plats = livrees
    .flatMap((r) => (Array.isArray(r.detail) ? (r.detail as LigneDetail[]) : []))
    .filter((l) => l.plat)
    .reduce((n, l) => n + (l.quantite ?? 0), 0);
  const [offert] = await db
    .select({ n: count() })
    .from(commandeEvenements)
    .where(
      and(
        semaine,
        isNotNull(commandeEvenements.recompense),
        // A gift on an order still on its way counts too, or two quick orders would both carry one.
        or(isNull(commandeEvenements.statut), ne(commandeEvenements.statut, "non_recue"))
      )
    );
  const dejaOffert = (offert?.n ?? 0) > 0;
  return { plats, seuil: regle.seuil, dejaOffert, cadeauPret: plats >= regle.seuil && !dejaOffert } satisfies ProgresHebdo;
}
