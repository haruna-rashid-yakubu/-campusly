import { db } from "@/db";
import { classes } from "@/db/schema";
import { CRENEAUX, heuresDe } from "@/lib/constants";
import { getProgrammeForWeek } from "@/lib/data";
import { sendPushToClasse } from "@/lib/push";
import { addDays, jourLabel, jourOf, mondayOf, nowInWAT } from "@/lib/semaine";

/*
 * A long course title does not fit in a push notification. The convention in
 * the bank is that the parentheses hold what you would type to find the
 * subject — "Regional Economic Integration (REI)" — so that is what a
 * notification uses. ICT and Info are family tags rather than abbreviations,
 * though: "Algorithmics and Programming (ICT)" must not become "ICT".
 */
const MAX_PUSH_LABEL = 34;

/*
 * Only an acronym counts: uppercase letters and digits, two to ten of them.
 * Trailing parentheses are used for other things in the bank — "Regional
 * economic integration (sujet B)", "Démographie (sujet A)" — and a
 * notification announcing "sujet B" would name no subject at all. The family
 * tags ICT and Info sit at the front of a title, not the end, so they never
 * reach here.
 */
const ACRONYM = /\(([A-Z0-9][A-Z0-9.&-]{1,9})\)\s*$/;

export function matiereCourte(matiere: string) {
  const tag = matiere.match(ACRONYM)?.[1]?.trim();
  if (tag) return tag;

  const full = matiere.trim();
  if (full.length <= MAX_PUSH_LABEL) return full;
  return `${full.slice(0, MAX_PUSH_LABEL - 1).trimEnd()}…`;
}

type Creneau = {
  jour: number;
  debut: number;
  fin: number;
  matiere: string;
  horaire?: string | null;
  abrege?: string | null;
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
  if (c.cc) return `⚠️ CC ${de(nom)} — ${heuresDe(c.debut, c.fin)}.`;
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
  const duJour = creneaux
    .filter((c) => c.jour === jour)
    .sort((a, b) => a.debut - b.debut);

  // A day with nothing in it is worth saying out loud, not worth four words
  // repeated twice. For someone who pays for transport from Nkolbisson this
  // is the most actionable message the app ever sends.
  if (duJour.length === 0) return "Pas de cours de la journée.";

  const lignes: string[] = [];
  const alertes: string[] = [];

  /*
   * Walked slot by slot rather than half-day by half-day, because a morning
   * can hold one course or two. Consecutive empty slots are merged into a
   * single "pas de cours" so a free afternoon reads as one line, not two.
   */
  let slot = 1;
  let vide: number[] = [];
  const viderLesTrous = () => {
    if (vide.length === 0) return;
    lignes.push(`${heuresDe(vide[0], vide[vide.length - 1])} : pas de cours`);
    vide = [];
  };

  while (slot <= CRENEAUX.length) {
    const c = duJour.find((x) => x.debut === slot);
    if (!c) {
      vide.push(slot);
      slot += 1;
      continue;
    }
    viderLesTrous();
    const nom = c.abrege?.trim() || matiereCourte(c.matiere);
    const salle = c.salle ?? salleDefaut;
    // Same rule as the screen: the hour written on the sheet wins over the
    // slot, so the push never announces a time the noticeboard contradicts.
    const heures = c.horaire ?? heuresDe(c.debut, c.fin);
    lignes.push(`${heures} : ${nom}${salle ? `, ${salle}` : ""}`);
    const alerte = alerteSeance(c, nom);
    if (alerte) alertes.push(alerte);
    slot = c.fin + 1;
  }
  viderLesTrous();

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

    await sendPushToClasse(classe.id, {
      title: `Demain ${jourLabel(jour)} — ${classe.label}`,
      body: messageDuSoir(programme.creneaux, jour, programme.salleDefaut),
      url: "/programme",
    }, "rappel");
    envoyes += 1;
  }

  return { envoyes, raison: null };
}
