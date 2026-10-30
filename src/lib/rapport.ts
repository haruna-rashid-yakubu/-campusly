import katex from "katex";
import { markdown } from "@/lib/markdown";
import { LOGO } from "@/lib/numerisation/gabarit";
import { decouper } from "@/lib/tuteur-blocs";
import type { Extraction } from "@/lib/numerisation/extraction";
import type { ResultatQuiz } from "@/lib/rapport-client";

export type { ResultatQuiz };

/*
 * The revision report: everything about one Sujet, written by the tutor for
 * one student and printed as a PDF to keep — what the paper asks, the notions,
 * every exercise with its method, its traps and a worked solution, the
 * formulas, what the student did in the conversation, and a plan.
 *
 * Written in the same Markdown and blocks as the tutor's answers, so the same
 * renderer lays it out; on paper, nothing is hidden behind a button.
 */


/*
 * The report is written in parts, all at once: one for the opening (in brief,
 * the notions), one per exercise (or per few exercises, when a paper has many)
 * and one for the end (formulas, the student's record, the plan). Written in
 * one go, the model reasoned through every exercise before writing a word and
 * a report took a minute, cut off at the end; in parallel, it takes as long as
 * its longest exercise.
 */
export type Partie = { id: string; titre: string; exercices: string[] };

const PARTIES_EXERCICES = 6;

export function partiesRapport(e: Extraction): Partie[] {
  const titres = e.pages.flatMap((p) => p.blocs).flatMap((b) => (b.t === "exercice" && b.titre?.trim() ? [b.titre.trim()] : []));
  const exercices: Partie[] = [];
  if (!titres.length) exercices.push({ id: "ex-0", titre: "Le sujet, question par question", exercices: [] });
  else {
    const parPartie = Math.ceil(titres.length / PARTIES_EXERCICES);
    for (let i = 0; i < titres.length; i += parPartie) {
      const groupe = titres.slice(i, i + parPartie);
      exercices.push({ id: `ex-${i}`, titre: groupe.join(" · "), exercices: groupe });
    }
  }
  return [{ id: "debut", titre: "En bref et notions clés", exercices: [] }, ...exercices, { id: "fin", titre: "Formules, bilan et plan", exercices: [] }];
}

const COMMUN = `Écris en Markdown, sans emoji, sans [[suggestions]] et sans :::quiz. Des phrases courtes, des listes, des formules en LaTeX. N'écris que la partie demandée, sans introduction ni conclusion.`;

export function consignePartie(p: Partie, bilan: boolean) {
  if (p.id === "debut") {
    return `Tu rédiges le début d'un RAPPORT DE RÉVISION de ce sujet, qui sera imprimé en PDF. ${COMMUN}

## En bref
3 à 5 lignes : de quoi parle le sujet, les compétences évaluées, la difficulté, le temps à prévoir.

## Notions clés
Les définitions et formules indispensables pour ce sujet, chacune dans un bloc :::cle court.`;
  }
  if (p.id === "fin") {
    return `Tu rédiges la fin d'un RAPPORT DE RÉVISION de ce sujet, qui sera imprimé en PDF. ${COMMUN}

## Formules à retenir
Un tableau | Notion | Formule | Quand l'utiliser |, pour tout le sujet.
${
  bilan
    ? `
## Ton bilan
À partir de la conversation et des résultats de quiz donnés : ce que l'étudiant a travaillé, ses scores, ses erreurs et les points à renforcer, en t'adressant à lui.
`
    : ""
}
## Plan de révision
Une liste à cocher « - [ ] … » de 5 à 8 actions concrètes, dans l'ordre, avec une durée pour chacune.`;
  }
  const quoi = p.exercices.length ? p.exercices.map((t) => `« ${t} »`).join(", ") : "tout le sujet, question par question";
  return `Tu rédiges, pour un RAPPORT DE RÉVISION imprimé en PDF, la partie qui traite de : ${quoi}. ${COMMUN}

${p.exercices.length ? "Pour chacun, un titre ### avec son nom exact" : "Commence par un titre ## Le sujet, question par question"}, puis :
- **Ce qui est demandé** : en une ou deux phrases.
- La méthode dans un bloc :::etapes.
- **Pièges** : les erreurs classiques à éviter.
- La résolution complète dans un bloc :::solution, avec tous les calculs posés et les résultats. Refais chaque calcul pour qu'il soit juste ; si une donnée est illisible ou manque dans le texte retranscrit, dis-le au lieu d'inventer.`;
}

/** What the student did, for the "Ton bilan" section: the conversation and the quizzes. */
export function contexteRapport(messages: { role: string; content: string }[], quiz: ResultatQuiz[]) {
  const fil = messages
    .slice(-30)
    .map((m) => `${m.role === "user" ? "Étudiant" : "Tuteur"} : ${m.content.replace(/\[\[[^\]]*\]\]/g, "").slice(0, 1200)}`)
    .join("\n\n");
  const scores = quiz
    .map((q, i) => `Quiz ${i + 1} : ${q.score}/${q.total}${q.erreurs.length ? ` — erreurs sur : ${q.erreurs.join(" ; ")}` : ""}`)
    .join("\n");
  return [fil && `Notre conversation jusqu'ici :\n${fil}`, scores && `Résultats de ses quiz :\n${scores}`].filter(Boolean).join("\n\n");
}

const echapper = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** The tutor's Markdown and blocks, drawn for paper: hints and solutions shown, a method numbered. */
export function corpsDocument(source: string) {
  const { blocs } = decouper(source);
  return blocs
    .map((b) => {
      if (b.t === "md") return markdown(b.texte, true);
      if (b.t === "cle") return `<div class="encadre cle"><div class="etiquette">À retenir</div>${markdown(b.texte)}</div>`;
      if (b.t === "indice") return `<div class="encadre indice"><div class="etiquette">Indice</div>${markdown(b.texte)}</div>`;
      if (b.t === "solution") return `<div class="encadre solution"><div class="etiquette">Corrigé</div>${markdown(b.texte)}</div>`;
      if (b.t === "etapes") return `<div class="encadre etapes"><div class="etiquette">Méthode</div><ol>${b.etapes.map((e) => `<li>${markdown(e)}</li>`).join("")}</ol></div>`;
      return "";
    })
    .join("\n");
}

/*
 * A Campusly document to print: the cover (what it is, for which paper, a
 * word of caution) and its body, in the type and the boxes every printed
 * document shares — the revision report, the Corrigé IA.
 */
export function documentCampusly(
  couverture: { nature: string; titre: string; sous: string; fiche: [string, string][]; avis: string },
  corpsHtml: string
) {
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@${katex.version}/dist/katex.min.css">
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
* { box-sizing: border-box; }
body { font-family: Manrope, sans-serif; color: #0f172a; font-size: 10.5pt; line-height: 1.55; margin: 0; }
.garde { height: 255mm; display: flex; flex-direction: column; page-break-after: always; }
.marque { display: flex; align-items: center; gap: 10px; font-weight: 800; font-size: 15pt; }
.nature { margin-top: 34mm; color: #0a7f77; font-weight: 800; font-size: 11pt; text-transform: uppercase; letter-spacing: .08em; }
.titre { margin-top: 3mm; font-size: 30pt; line-height: 1.1; font-weight: 800; letter-spacing: -.02em; }
.sous { margin-top: 4mm; font-size: 12pt; color: #475569; }
.fiche { margin-top: 14mm; border-top: 1px solid #e6ebee; }
.fiche div { display: flex; justify-content: space-between; padding: 3mm 0; border-bottom: 1px solid #e6ebee; }
.fiche dt { color: #64748b; } .fiche dd { margin: 0; font-weight: 700; }
.avis { margin-top: auto; background: #f4fbfa; border: 1px solid #bce9e5; border-radius: 10px; padding: 4mm 5mm; color: #334155; font-size: 9pt; }
main h2 { font-size: 15pt; font-weight: 800; color: #0a7f77; margin: 9mm 0 3mm; padding-bottom: 1.5mm; border-bottom: 1.5px solid #bce9e5; break-after: avoid; }
main h2:first-child { margin-top: 0; }
main h3 { font-size: 12.5pt; font-weight: 800; margin: 7mm 0 2.5mm; break-after: avoid; }
main h4 { font-size: 11pt; font-weight: 800; margin: 5mm 0 2mm; break-after: avoid; }
main h5 { font-size: 9pt; font-weight: 800; text-transform: uppercase; letter-spacing: .06em; color: #475569; margin: 4mm 0 1.5mm; }
main p { margin: 0 0 2.6mm; }
main ul, main ol { margin: 0 0 2.6mm; padding-left: 6mm; }
main li { margin-bottom: 1.2mm; }
main li:has(> .case) { list-style: none; margin-left: -5mm; }
.case { display: inline-block; width: 3.4mm; height: 3.4mm; margin: 0 2mm -.5mm 0; border: 1.3px solid #475569; border-radius: 1mm; }
.case.faite { background: #14b8ac; border-color: #14b8ac; }
main .formule { margin: 2.5mm 0; text-align: center; break-inside: avoid; }
main .katex-display { margin: 0; }
main blockquote { margin: 0 0 3mm; padding: 1mm 0 1mm 4mm; border-left: 3px solid #d7e0e3; color: #475569; }
main hr { border: 0; border-top: 1px solid #d7e0e3; margin: 5mm 0; }
main code { font-size: 9pt; background: #eef2f4; border-radius: 1.2mm; padding: .2mm 1.2mm; }
main pre { background: #0f172a; color: #e2e8f0; border-radius: 2.5mm; padding: 3mm 4mm; font-size: 9pt; white-space: pre-wrap; }
main pre code { background: none; color: inherit; padding: 0; }
main a { color: #0a7f77; }
.tableau { margin: 2mm 0 4mm; break-inside: avoid; }
table { border-collapse: collapse; width: 100%; font-size: 9.5pt; }
th, td { border: 1px solid #d7e0e3; padding: 2mm 2.6mm; text-align: left; vertical-align: middle; }
th { background: #f1f5f6; font-weight: 800; }
.encadre { margin: 3mm 0 4mm; padding: 3mm 4mm; border-radius: 2.5mm; break-inside: avoid; }
.encadre > :last-child, .encadre li > :last-child { margin-bottom: 0; }
.etiquette { font-size: 8pt; font-weight: 800; text-transform: uppercase; letter-spacing: .08em; margin-bottom: 1.5mm; }
.cle { background: #e6f7f5; border-left: 3px solid #14b8ac; } .cle .etiquette { color: #0a7f77; }
.indice { background: #fff7e6; } .indice .etiquette { color: #b45309; }
.solution { background: #fff; border: 1.3px solid #0f172a; break-inside: auto; } .solution .etiquette { color: #0f172a; }
.etapes { border: 1px solid #d7e0e3; } .etapes .etiquette { color: #475569; }
.etapes ol { margin: 0; padding-left: 5mm; }
</style></head><body>
<section class="garde">
  <div class="marque">${LOGO}Campusly</div>
  <div class="nature">${echapper(couverture.nature)}</div>
  <div class="titre">${echapper(couverture.titre)}</div>
  <div class="sous">${echapper(couverture.sous)}</div>
  <dl class="fiche">${couverture.fiche.map(([k, v]) => `<div><dt>${echapper(k)}</dt><dd>${echapper(v)}</dd></div>`).join("")}</dl>
  <div class="avis">${echapper(couverture.avis)}</div>
</section>
<main>${corpsHtml}</main>
</body></html>`;
}

export function gabaritRapport(
  m: { matiere: string; type: string; filiere: string; niveau: string; annee: string; eleve: string; avecCours: boolean },
  parties: { id: string; exercices: string[]; texte: string }[]
) {
  const date = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  // The exercises' parts open under one heading; a paper without named exercises brings its own.
  const premierExercice = parties.findIndex((p) => p.id.startsWith("ex-") && p.exercices.length > 0);
  return documentCampusly(
    {
      nature: `Rapport de révision${m.avecCours ? " · avec ton cours" : ""}`,
      titre: m.matiere,
      sous: `Préparé pour ${m.eleve} par le tuteur IA de Campusly`,
      fiche: [
        ["Sujet", `${m.type} · ${m.annee}`],
        ["Filière", `${m.filiere} · ${m.niveau}`],
        ["Rapport généré le", date],
      ],
      avis: `Ce rapport a été rédigé par une intelligence artificielle à partir du sujet${m.avecCours ? " et de ton cours" : ""}. Elle peut se tromper : vérifie les résultats avec ton cours et ton enseignant.`,
    },
    parties.map((p, i) => (i === premierExercice ? "<h2>Exercice par exercice</h2>" : "") + corpsDocument(p.texte)).join("\n")
  );
}

export const piedRapport = (matiere: string, eleve: string) =>
  `<div style="width:100%;font-family:Manrope,sans-serif;font-size:7.5pt;color:#64748b;padding:0 16mm;display:flex;justify-content:space-between">
<span><b style="color:#0a7f77">Campusly</b> · Rapport de révision · ${echapper(matiere)} · ${echapper(eleve)}</span>
<span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`;
