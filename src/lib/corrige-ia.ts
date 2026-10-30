import { corpsDocument, documentCampusly } from "@/lib/rapport";

/*
 * The Corrigé IA of a Sujet (GLOSSARY.md): a worked solution for a paper that
 * has no Corrigé, written by Claude from the transcribed text and the
 * photographs with every calculation run rather than done by hand, then
 * checked again by a second, independent reading (scripts/corrige-redaction.md).
 * The PDF and the page say on every view what it is: a proposal, not the
 * lecturer's answers.
 */

export type CorrigeIA = { sujet: number; le: string; texte: string; reserves: string[] };

export function gabaritCorrige(
  m: { matiere: string; type: string; filiere: string; niveau: string; annee: string; enseignant: string | null },
  texte: string
) {
  const date = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  return documentCampusly(
    {
      nature: `Corrigé IA · ${m.type}`,
      titre: m.matiere,
      sous: "Proposition de corrigé rédigée puis revérifiée par l'intelligence artificielle de Campusly",
      fiche: [
        ["Filière", `${m.filiere} · ${m.niveau}`],
        ["Année", m.annee],
        ...(m.enseignant ? ([["Enseignant", m.enseignant]] as [string, string][]) : []),
        ["Rédigé le", date],
      ],
      avis:
        "Ce corrigé n'est pas celui de l'enseignant : il a été rédigé puis revérifié par une intelligence artificielle à partir du sujet retranscrit. Il peut contenir des erreurs. Sers-t'en pour vérifier ta démarche, et en cas de doute, demande à ton enseignant ou au tuteur IA de Campusly.",
    },
    corpsDocument(texte)
  );
}
