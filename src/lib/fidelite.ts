import { and, count, eq } from "drizzle-orm";
import { db } from "@/db";
import { commandeEvenements } from "@/db/schema";

/*
 * The Campusly loyalty card, as agreed with the vendor:
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
export const CYCLE = 10;

export type Recompense = "donut" | "pack4";

const PALIERS: Record<number, Recompense> = { 3: "donut", 6: "donut", 10: "pack4" };

export const LIBELLES: Record<Recompense, string> = {
  donut: "1 donut offert",
  pack4: "1 pack de 4 offert",
};

/** Place of an order on the card (1…10) from its rank among the person's orders. */
export function position(rang: number) {
  return ((rang - 1) % CYCLE) + 1;
}

export function recompensePourRang(rang: number): Recompense | null {
  return PALIERS[position(rang)] ?? null;
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
  livrees: number;
  // Stamps on the current card, 0…9 (a full card has just started again).
  tampons: number;
  // What the next order will carry, if anything, and how far the next gift is.
  prochaine: Recompense | null;
  prochainCadeau: { dans: number; recompense: Recompense };
  cases: { numero: number; cadeau: Recompense | null; faite: boolean }[];
};

export function carteDepuis(livrees: number): Carte {
  const tampons = livrees % CYCLE;
  const rangSuivant = livrees + 1;
  let dans = 1;
  while (!recompensePourRang(livrees + dans)) dans += 1;
  return {
    livrees,
    tampons,
    prochaine: recompensePourRang(rangSuivant),
    prochainCadeau: { dans, recompense: recompensePourRang(livrees + dans)! },
    cases: Array.from({ length: CYCLE }, (_, i) => ({
      numero: i + 1,
      cadeau: PALIERS[i + 1] ?? null,
      faite: i < tampons,
    })),
  };
}

export async function getCarte(userId: string, vendeurId: number) {
  return carteDepuis(await commandesLivrees(userId, vendeurId));
}
