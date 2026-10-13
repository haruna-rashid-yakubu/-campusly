import { nowInWAT } from "@/lib/semaine";

/*
 * A weekly delivery with a cut-off: order before Thursday 17h, delivered on
 * Friday. Days are 1 = Monday … 7 = Sunday, hours in Cameroon time.
 *
 * Ordering after the cut-off is never refused — that order is simply for the
 * following week, and both the student and the vendor are told which Friday.
 *
 * Works on the WAT-shifted clock read through its UTC fields, so the answer
 * is the same whatever timezone the server runs in.
 */
export type Calendrier = { livraisonJour: number; limiteJour: number; limiteHeure: number };

export type ProchaineLivraison = {
  date: Date; // midnight of the delivery day, on the shifted clock
  label: string; // "vendredi 16 octobre"
  // True when the order makes this week's delivery; false once the cut-off has passed.
  cetteSemaine: boolean;
  // Hours left before the cut-off, when it falls today; null otherwise.
  heuresRestantes: number | null;
  limiteLabel: string; // "jeudi 17h"
};

const JOURS_LONGS = ["", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];
const DAY_MS = 24 * 3600_000;

export function prochaineLivraison(cal: Calendrier, maintenant = new Date()): ProchaineLivraison {
  const wat = nowInWAT(maintenant);
  const jour = wat.getUTCDay() === 0 ? 7 : wat.getUTCDay();
  const minuit = Date.UTC(wat.getUTCFullYear(), wat.getUTCMonth(), wat.getUTCDate());
  const lundi = minuit - (jour - 1) * DAY_MS;

  const limite = lundi + (cal.limiteJour - 1) * DAY_MS + cal.limiteHeure * 3600_000;
  const cetteSemaine = wat.getTime() < limite;
  const livraison = new Date(lundi + (cal.livraisonJour - 1 + (cetteSemaine ? 0 : 7)) * DAY_MS);

  const heures = (limite - wat.getTime()) / 3600_000;
  const heuresRestantes = cetteSemaine && jour === cal.limiteJour ? Math.max(1, Math.ceil(heures)) : null;

  return {
    date: livraison,
    label: livraison.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      timeZone: "UTC",
    }),
    cetteSemaine,
    heuresRestantes,
    limiteLabel: `${JOURS_LONGS[cal.limiteJour]} ${cal.limiteHeure}h`,
  };
}

export function calendrierDe(v: {
  livraisonJour: number | null;
  limiteJour: number | null;
  limiteHeure: number | null;
}): Calendrier | null {
  if (!v.livraisonJour || !v.limiteJour || v.limiteHeure === null) return null;
  return { livraisonJour: v.livraisonJour, limiteJour: v.limiteJour, limiteHeure: v.limiteHeure };
}
