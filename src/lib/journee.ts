import { getProgrammeForWeek } from "@/lib/data";
import { JOURS, heuresDe } from "@/lib/constants";
import { addDays, jourOf, mondayOf, nowInWAT, startOfDay } from "@/lib/semaine";

/*
 * "What's my next class, and where?" — the first thing a student opens the app
 * for, answered on Home by the web and the app from this one place.
 *
 * Today while it still has a course ahead; otherwise the next day of the week
 * that has one. Only the published week is read: on Saturday evening, or when
 * next week's sheet is not up yet, there is honestly nothing to show, and the
 * card says so rather than guessing.
 */

// The hour each slot ends, to drop the courses already over today.
const FIN_SLOT: Record<number, number> = { 1: 10, 2: 12, 3: 16, 4: 18 };

export type CoursJournee = {
  heures: string; // "8h–12h"
  matiere: string;
  enseignant: string | null;
  salle: string | null;
  seance: number | null;
  seances: number | null;
  cc: boolean;
  enCours: boolean;
};

export type Journee = {
  quand: "aujourdhui" | "demain" | "plus-tard";
  jour: number; // 1 = lundi … 6 = samedi
  libelle: string; // "Aujourd'hui", "Demain", "Lundi"
  cours: CoursJournee[];
} | null;

type Creneau = {
  jour: number;
  debut: number;
  fin: number;
  matiere: string;
  enseignant: string | null;
  salle: string | null;
  seance: number | null;
  seances: number | null;
  cc: boolean;
};

export function calculerJournee(
  programme: { semaine: Date; salleDefaut: string | null; creneaux: Creneau[] } | null | undefined,
  maintenant = new Date()
): Journee {
  if (!programme) return null;
  const wat = nowInWAT(maintenant);
  const lundi = mondayOf(wat);
  const semaine = startOfDay(programme.semaine).getTime();
  // Next week's sheet, already up at the weekend: read it from its Monday.
  const suivante = semaine === addDays(lundi, 7).getTime();
  // Any other week says nothing about today.
  if (semaine !== lundi.getTime() && !suivante) return null;

  const aujourdhui = suivante ? 1 : jourOf(wat);
  // Sunday reads Monday as tomorrow; Saturday evening reads it as later.
  const demainEst = suivante && jourOf(wat) === 7 ? 1 : aujourdhui + 1;
  const heure = wat.getHours() + wat.getMinutes() / 60;

  for (let jour = aujourdhui; jour <= JOURS.length; jour++) {
    const duJour = programme.creneaux
      .filter((c) => c.jour === jour)
      .filter((c) => suivante || jour !== aujourdhui || FIN_SLOT[c.fin] > heure)
      .sort((a, b) => a.debut - b.debut);
    if (duJour.length === 0) continue;

    const quand = !suivante && jour === aujourdhui ? "aujourdhui" : jour === demainEst ? "demain" : "plus-tard";
    return {
      quand,
      jour,
      libelle: quand === "aujourdhui" ? "Aujourd'hui" : quand === "demain" ? "Demain" : JOURS[jour - 1],
      cours: duJour.map((c) => ({
        heures: heuresDe(c.debut, c.fin),
        matiere: c.matiere,
        enseignant: c.enseignant,
        salle: c.salle ?? programme.salleDefaut,
        seance: c.seance,
        seances: c.seances,
        cc: c.cc,
        enCours: quand === "aujourdhui" && FIN_SLOT[c.debut] - 2 <= heure,
      })),
    };
  }
  return null;
}

/*
 * This week's sheet first, then next week's: a sheet published early for next
 * week must not hide today's classes, and at the weekend it is the one to read.
 */
export async function getJourneeEtudiant(classeId: number, maintenant = new Date()) {
  const lundi = mondayOf(nowInWAT(maintenant));
  const cetteSemaine = calculerJournee(await getProgrammeForWeek(classeId, lundi), maintenant);
  if (cetteSemaine) return cetteSemaine;
  return calculerJournee(await getProgrammeForWeek(classeId, addDays(lundi, 7)), maintenant);
}

