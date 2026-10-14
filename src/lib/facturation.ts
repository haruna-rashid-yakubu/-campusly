import { and, asc, eq, gte, lt } from "drizzle-orm";
import { db } from "@/db";
import { commandeEvenements } from "@/db/schema";
import type { Vendeur } from "@/lib/vendeurs";

/*
 * What a shop owes Campusly for a month, from the orders the app itself sent.
 *
 * On commission, every item ordered counts, except orders the vendor marked
 * "Pas reçue" — the message never reached them — within 48 hours of the
 * order. Marked later, the order still counts: that is the rule agreed with
 * the vendor, and the statement says which ones, so the vendor can check.
 *
 * The minimum is paid in advance at the start of the month, so what remains
 * is only what the items exceed it by; it is settled with the next advance.
 */

const DELAI_PAS_RECUE_MS = 48 * 3600_000;
const WAT_OFFSET_MS = 3600_000;

/** First instant of the month in Yaoundé, as a UTC date. annee/mois as in Date (mois 0…11). */
function debutMois(annee: number, mois: number) {
  return new Date(Date.UTC(annee, mois, 1) - WAT_OFFSET_MS);
}

export function moisDe(date: Date) {
  const wat = new Date(date.getTime() + WAT_OFFSET_MS);
  return { annee: wat.getUTCFullYear(), mois: wat.getUTCMonth() };
}

export function libelleMois(annee: number, mois: number) {
  return new Date(Date.UTC(annee, mois, 15)).toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export type LigneReleve = {
  reference: string;
  date: Date;
  articles: number;
  compte: boolean;
  // Why it is shown apart: excluded in time, or marked too late to be.
  note: "pas_recue" | "pas_recue_tardive" | null;
};

export type Releve = {
  mois: string;
  lignes: LigneReleve[];
  articles: number;
  exclues: number;
  tardives: number;
  du: number; // what the month costs
  avance: number; // paid at the start of the month
  reste: number; // to pay with the next advance
};

export async function getReleve(vendeur: Vendeur, annee: number, mois: number): Promise<Releve | null> {
  if (!vendeur.facturation) return null;

  const rows = await db
    .select({
      reference: commandeEvenements.reference,
      createdAt: commandeEvenements.createdAt,
      nbArticles: commandeEvenements.nbArticles,
      statut: commandeEvenements.statut,
      statutLe: commandeEvenements.statutLe,
    })
    .from(commandeEvenements)
    .where(
      and(
        eq(commandeEvenements.vendeurId, vendeur.id),
        eq(commandeEvenements.type, "commander"),
        gte(commandeEvenements.createdAt, debutMois(annee, mois)),
        lt(commandeEvenements.createdAt, debutMois(annee, mois + 1))
      )
    )
    .orderBy(asc(commandeEvenements.createdAt));

  const lignes: LigneReleve[] = rows.map((r) => {
    const pasRecue = r.statut === "non_recue";
    const aTemps =
      pasRecue && r.statutLe !== null && r.statutLe.getTime() - r.createdAt.getTime() <= DELAI_PAS_RECUE_MS;
    return {
      reference: r.reference ?? "—",
      date: r.createdAt,
      articles: r.nbArticles ?? 0,
      compte: !aTemps,
      note: pasRecue ? (aTemps ? "pas_recue" : "pas_recue_tardive") : null,
    };
  });

  const articles = lignes.filter((l) => l.compte).reduce((s, l) => s + l.articles, 0);
  const base = {
    mois: libelleMois(annee, mois),
    lignes,
    articles,
    exclues: lignes.filter((l) => l.note === "pas_recue").length,
    tardives: lignes.filter((l) => l.note === "pas_recue_tardive").length,
  };

  if (vendeur.facturation === "forfait") {
    const forfait = vendeur.forfaitMensuel ?? 0;
    return { ...base, du: forfait, avance: forfait, reste: 0 };
  }

  const commission = articles * (vendeur.commissionParArticle ?? 0);
  const minimum = vendeur.minimumMensuel ?? 0;
  return {
    ...base,
    du: Math.max(commission, minimum),
    avance: minimum,
    reste: Math.max(0, commission - minimum),
  };
}
