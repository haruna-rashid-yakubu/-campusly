import { markdown } from "@/lib/markdown";
import { cles, lire } from "@/lib/numerisation/r2";
import { documentCampusly } from "@/lib/rapport";
import type { Lecture } from "@/lib/numerisation/lecture";

/*
 * The Sujets d'entraînement (GLOSSARY.md): unseen papers written by Claude in
 * a lecturer's manner — the structure, the kinds of question, the marks, the
 * wording of the instructions — never their content, each with its
 * corrigé, both checked again by a second reading
 * (scripts/entrainement-redaction.md). Everything a student sees of them says
 * what they are: practice, not the lecturer's own paper.
 */

export type SujetEntrainement = {
  n: number;
  matiere: string;
  type: string;
  filiere: string;
  niveau: string;
  duree: string;
  langue: string;
};

export type EnseignantEntrainement = {
  slug: string;
  nom: string;
  // The lecturer's manner as profil.md describes it: one [heading, text] per line.
  profil: [string, string][];
  sujets: SujetEntrainement[];
};

export const AVIS_SUJET =
  "Sujet d'entraînement rédigé par l'intelligence artificielle de Campusly dans la manière de l'enseignant, à partir de ses anciens sujets. Il n'a pas été rédigé par l'enseignant et ne sera pas donné à l'examen : il sert à t'entraîner à sa façon d'interroger.";
export const AVIS_CORRIGE =
  "Corrigé rédigé puis revérifié par l'intelligence artificielle de Campusly. Il n'est pas celui de l'enseignant et peut contenir des erreurs : en cas de doute, demande à ton enseignant ou au tuteur IA.";

/** The lecturers with Sujets d'entraînement, from the index scripts/entrainer.ts keeps. */
export async function enseignantsEntrainement(): Promise<EnseignantEntrainement[]> {
  const brut = await lire(cles.indexEntrainement).catch(() => null);
  return brut ? (JSON.parse(Buffer.from(brut).toString()) as EnseignantEntrainement[]) : [];
}

export async function enseignantEntrainement(slug: string) {
  return (await enseignantsEntrainement()).find((e) => e.slug === slug) ?? null;
}

/** A paper and its corrigé as the page reads them. */
export async function lireEntrainement(slug: string, n: number): Promise<{ sujet: Lecture; corrige: Lecture } | null> {
  const brut = await lire(cles.entrainementTextes(slug, n)).catch(() => null);
  if (!brut) return null;
  const { sujet, corrige } = JSON.parse(Buffer.from(brut).toString()) as { sujet: string; corrige: string };
  return {
    sujet: { html: markdown(sujet, true), photos: [], aRelire: false, avertissement: AVIS_SUJET },
    corrige: { html: markdown(corrige, true), photos: [], aRelire: false, avertissement: AVIS_CORRIGE },
  };
}

export const lienEntrainement = (slug: string, n: number, corrige: boolean, jeton?: string) =>
  `/api/entrainement/${slug}/${n}/${corrige ? "corrige" : "sujet"}-entrainement-${n}.pdf${corrige ? "?c=1" : ""}${jeton ? `${corrige ? "&" : "?"}t=${jeton}` : ""}`;

/** profil.md as [heading, text] pairs: "Matières : …" → ["Matières", "…"]. */
export function lireProfil(source: string): [string, string][] {
  return source
    .split("\n")
    .map((l) => /^([^:#]{3,40}?)\s*:\s*(.+)$/.exec(l.trim()))
    .filter((m): m is RegExpExecArray => !!m)
    .map((m) => [m[1], m[2]]);
}

/** The printed paper or its corrigé: the Campusly cover saying what it is, then the text. */
export function gabaritEntrainement(e: { nom: string }, s: SujetEntrainement, texte: string, corrige: boolean) {
  return documentCampusly(
    {
      nature: corrige ? "Corrigé · Sujet d'entraînement" : `Sujet d'entraînement · ${s.type}`,
      titre: s.matiere,
      sous: `Dans la manière de ${e.nom} · non rédigé par l'enseignant`,
      fiche: [
        ["Filière", `${s.filiere} · ${s.niveau}`],
        ["Durée", s.duree],
        ["Sujet", `n° ${s.n} sur 5`],
      ],
      avis: corrige ? AVIS_CORRIGE : AVIS_SUJET,
    },
    markdown(texte, true)
  );
}
