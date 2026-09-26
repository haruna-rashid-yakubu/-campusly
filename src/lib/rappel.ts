import { db } from "@/db";
import { classes } from "@/db/schema";
import { heuresDu, MOMENTS } from "@/lib/constants";
import { getProgrammeForWeek } from "@/lib/data";
import { sendPushToClasse } from "@/lib/push";
import { addDays, jourLabel, jourOf, mondayOf } from "@/lib/semaine";

/*
 * Cameroon is UTC+1 all year, with no daylight saving. The cron fires at
 * 19:00 UTC, which is 20h locally, but a server running in UTC would still
 * compute "tomorrow" from its own midnight — and between 23h and midnight
 * UTC+1 that is the wrong day. Everything here works on local Cameroon time.
 */
const WAT_OFFSET_MS = 60 * 60 * 1000;

export function nowInWAT(now = new Date()) {
  return new Date(now.getTime() + WAT_OFFSET_MS);
}

/*
 * A long course title does not fit in a push notification. The convention in
 * the bank is that the parentheses hold what you would type to find the
 * subject — "Regional Economic Integration (REI)" — so that is what a
 * notification uses. ICT and Info are family tags rather than abbreviations,
 * though: "Algorithmics and Programming (ICT)" must not become "ICT".
 */
const FAMILY_TAGS = new Set(["ICT", "INFO"]);
const MAX_PUSH_LABEL = 34;

export function matiereCourte(matiere: string) {
  const match = matiere.match(/\(([^)]{2,12})\)\s*$/);
  const tag = match?.[1]?.trim();
  if (tag && !FAMILY_TAGS.has(tag.toUpperCase())) return tag;

  const full = matiere.trim();
  if (full.length <= MAX_PUSH_LABEL) return full;
  return `${full.slice(0, MAX_PUSH_LABEL - 1).trimEnd()}…`;
}

type Creneau = {
  jour: number;
  moment: string;
  matiere: string;
  salle: string | null;
  seance: number | null;
  seances: number | null;
  cc: boolean;
};

/*
 * Courses here run as intensive blocks — five sessions of one subject inside a
 * single week — so the room to act is measured in days, not weeks. The CC
 * falls on either the last session or the one before it, which means warning
 * at the second-to-last would often mean warning the night before. The alert
 * starts one session earlier.
 *
 * The three messages differ and never repeat, and the app never asserts a date
 * it does not know: the countdown says a CC is coming, the hand-set flag says
 * where it is.
 */
/*
 * Course titles are mostly English here — "Algorithmics", "Introduction to
 * Marketing" — and French elides before a vowel. "de Introduction" in a
 * notification read by a French-speaking promo looks like a machine wrote it.
 */
function de(nom: string) {
  return /^[aeiouàâéèêëïîôöùûüh]/i.test(nom.trim()) ? `d'${nom}` : `de ${nom}`;
}

export function alerteSeance(c: Creneau, nom: string): string | null {
  if (c.cc) return `⚠️ CC ${de(nom)} — ${heuresDu(c.moment)}.`;
  if (!c.seance || !c.seances) return null;
  const restantes = c.seances - c.seance;
  if (restantes === 2) return `⚠️ Plus que 3 séances ${de(nom)}. Le CC arrive.`;
  if (restantes === 1) return `⚠️ Avant-dernière séance ${de(nom)}. Le CC approche.`;
  if (restantes === 0) return `Dernière séance ${de(nom)}.`;
  return null;
}

export function messageDuSoir(
  creneaux: Creneau[],
  jour: number,
  salleDefaut: string | null
) {
  const lignes: string[] = [];
  const alertes: string[] = [];

  for (const moment of MOMENTS) {
    const c = creneaux.find((x) => x.jour === jour && x.moment === moment.id);
    if (!c) {
      lignes.push(`${moment.label} : pas de cours`);
      continue;
    }
    const nom = matiereCourte(c.matiere);
    const salle = c.salle ?? salleDefaut;
    lignes.push(`${moment.label} : ${nom}, ${moment.heures}${salle ? `, ${salle}` : ""}`);
    const alerte = alerteSeance(c, nom);
    if (alerte) alertes.push(alerte);
  }

  return [...lignes, ...alertes].join("\n");
}

/** Returns how many promos were notified, for the cron's response body. */
export async function envoyerRappelsDuSoir(now = new Date()) {
  const localNow = nowInWAT(now);
  const demain = addDays(localNow, 1);
  const jour = jourOf(demain);

  // Sunday has no morning and no afternoon block; nothing to announce.
  if (jour > 6) return { envoyes: 0, raison: "dimanche" as const };

  const semaine = mondayOf(demain);
  const toutes = await db.select().from(classes);
  let envoyes = 0;

  for (const classe of toutes) {
    const programme = await getProgrammeForWeek(classe.id, semaine);
    if (!programme) continue;

    // A promo whose whole day is empty is told nothing rather than told
    // twice that it has nothing — the weekly grid already said so.
    const aCours = programme.creneaux.some((c) => c.jour === jour);
    if (!aCours) continue;

    await sendPushToClasse(classe.id, {
      title: `Demain ${jourLabel(jour)} — ${classe.label}`,
      body: messageDuSoir(programme.creneaux, jour, programme.salleDefaut),
      url: "/programme",
    });
    envoyes += 1;
  }

  return { envoyes, raison: null };
}
