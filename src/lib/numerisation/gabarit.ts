import katex from "katex";
import type { Bloc, PageExtraite } from "@/lib/numerisation/extraction";

/*
 * The Version reconstituée as one HTML document, printed to PDF by a headless
 * browser. Every paper gets the same layout whatever the sheet looked like: a
 * Campusly cover with what the paper is, then the content in one typeface,
 * questions with their marks aligned, real tables and typeset maths.
 *
 * Maths is rendered here to HTML by KaTeX, so the printer needs no script.
 * Its stylesheet must be the same version as the KaTeX that rendered it: with
 * 0.16's CSS over 0.19's HTML, subscripts sat on the line and fractions ran
 * into their exponents.
 */

export type Meta = {
  matiere: string;
  filiere: string;
  niveau: string;
  annee: string;
  type: string;
  enseignant: string | null;
  duree: string | null;
  session: string | null;
  etablissement: string[];
  corrige: boolean;
  // A Sujet whose answers are in the same file.
  avecCorrige?: boolean;
  langue: "fr" | "en";
};

// Figures cropped from the photographs, as data URIs, in the order they appear.
export type Figures = Map<Bloc, string>;

const echapper = (s: string | null | undefined) =>
  (s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function maths(latex: string, display: boolean) {
  try {
    return katex.renderToString(latex, { displayMode: display, throwOnError: false, output: "html" });
  } catch {
    return `<code>${echapper(latex)}</code>`;
  }
}

// The sheet's own emphasis — bold, underlined (a "define the underlined words" depends on it), italic.
// Written **gras**, __souligné__, or $\textit{…}$ / $\underline{\text{…}}$; drawn in the text's font.
const BALISES: Record<string, string> = { underline: "u", textit: "em", emph: "em", textbf: "strong" };

function emphase(latex: string) {
  const m = latex.trim().match(/^\\(underline|textit|emph|textbf)\{(?:\\text\{)?([^{}$]*)\}?\}$/);
  return m ? `<${BALISES[m[1]]}>${echapper(m[2])}</${BALISES[m[1]]}>` : null;
}

const balisage = (html: string) =>
  html
    .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/__(.+?)__/g, "<u>$1</u>");

// Text with $…$ inline maths and line breaks kept.
function texte(s: string | null | undefined) {
  return (s ?? "")
    .split(/(\$[^$]+\$)/g)
    .map((morceau) =>
      morceau.startsWith("$") && morceau.endsWith("$") && morceau.length > 2
        ? (emphase(morceau.slice(1, -1)) ?? maths(morceau.slice(1, -1), false))
        : balisage(echapper(morceau))
    )
    .join("")
    .replace(/\n{2,}/g, "</p><p>")
    .replace(/\n/g, "<br>");
}

const points = (p: number | null, langue: "fr" | "en") =>
  p === null ? "" : `<span class="pts">${p} ${langue === "en" ? (p > 1 ? "marks" : "mark") : p > 1 ? "pts" : "pt"}</span>`;

function bloc(b: Bloc, figures: Figures, langue: "fr" | "en") {
  switch (b.t) {
    case "titre":
      return `<h2>${texte(b.texte)}</h2>`;
    case "exercice":
      return `<h3 class="exercice"><span>${texte(b.titre)}</span>${points(b.points, langue)}</h3>`;
    case "paragraphe":
      return `<p>${texte(b.texte)}</p>`;
    case "question":
      // Without a number on the sheet, the question sits at the paragraph's margin.
      return b.numero?.trim()
        ? `<div class="question"><span class="num">${echapper(b.numero)}</span><div class="q">${texte(b.texte)}</div>${points(b.points, langue)}</div>`
        : `<div class="question sans-num"><div class="q">${texte(b.texte)}</div>${points(b.points, langue)}</div>`;
    case "formule":
      return `<div class="formule">${maths(b.latex, true)}</div>`;
    case "liste":
      return `<ul>${(b.elements ?? []).map((e) => `<li>${texte(e)}</li>`).join("")}</ul>`;
    case "tableau": {
      const tout = (b.lignes ?? []).map((l) => (Array.isArray(l) ? l : [String(l)]));
      const [premiere, ...reste] = tout;
      const ligne = (l: string[], tag: "td" | "th") => `<tr>${l.map((c) => `<${tag}>${texte(c)}</${tag}>`).join("")}</tr>`;
      return `<table>${b.entete && premiere ? `<thead>${ligne(premiere, "th")}</thead><tbody>${reste.map((l) => ligne(l, "td")).join("")}` : `<tbody>${tout.map((l) => ligne(l, "td")).join("")}`}</tbody></table>`;
    }
    case "figure": {
      const src = figures.get(b);
      if (!src) return "";
      return `<figure><img src="${src}" alt="">${b.legende ? `<figcaption>${texte(b.legende)}</figcaption>` : ""}</figure>`;
    }
  }
}

const LOGO = `<svg viewBox="0 0 64 64" width="44" height="44"><rect width="64" height="64" rx="16" fill="#14B8AC"/><path d="M32 9.5c-9 0-16.3 7.2-16.3 16.1 0 11.4 13.3 24.6 15.3 26.5a1.4 1.4 0 0 0 1.9 0c2-1.9 15.3-15.1 15.3-26.5C48.3 16.7 41 9.5 32 9.5z" fill="#fff"/><path d="M37.4 22.6a7.6 7.6 0 1 0 0 10.4" stroke="#14B8AC" stroke-width="4.4" stroke-linecap="round" fill="none"/><path d="M32 12.4 19 17.5 32 22.6l13-5.1z" fill="#0A7F77"/><path d="M43.4 18.1v4.6" stroke="#0A7F77" stroke-width="1.7" stroke-linecap="round"/><circle cx="43.4" cy="24.2" r="1.9" fill="#0A7F77"/></svg>`;

// When the sheet's own header was cut off or unreadable.
const ETABLISSEMENT = ["Université Catholique d'Afrique Centrale", "Institut Catholique de Yaoundé · Nkolbisson"];

/** The paper's content alone, as HTML: printed in the PDF, and read on the site's Sujet page. */
export function contenu(pages: PageExtraite[], figures: Figures, langue: "fr" | "en") {
  return pages.flatMap((p) => p.blocs.map((b) => bloc(b, figures, langue))).join("\n");
}

export function gabarit(meta: Meta, pages: PageExtraite[], figures: Figures) {
  const en = meta.langue === "en";
  const etablissement = meta.etablissement.length ? meta.etablissement : ETABLISSEMENT;
  const lignes: [string, string | null][] = [
    [en ? "Programme" : "Filière", `${meta.filiere} · ${meta.niveau}`],
    [en ? "Year" : "Année", meta.annee],
    [en ? "Type" : "Épreuve", meta.type],
    [en ? "Lecturer" : "Enseignant", meta.enseignant],
    [en ? "Duration" : "Durée", meta.duree],
    ["Session", meta.session],
  ];

  return `<!doctype html><html lang="${meta.langue}"><head><meta charset="utf-8">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@${katex.version}/dist/katex.min.css">
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
@page { size: A4; margin: 20mm 18mm 22mm; }
* { box-sizing: border-box; }
body { font-family: Manrope, sans-serif; color: #0f172a; font-size: 10.5pt; line-height: 1.55; margin: 0; }
.garde { height: 247mm; display: flex; flex-direction: column; page-break-after: always; }
.marque { display: flex; align-items: center; gap: 10px; font-weight: 800; font-size: 15pt; color: #0f172a; }
.etab { margin-top: 26mm; color: #475569; font-size: 9.5pt; line-height: 1.5; text-transform: uppercase; letter-spacing: .02em; }
.nature { margin-top: 18mm; color: #0a7f77; font-weight: 800; font-size: 11pt; text-transform: uppercase; letter-spacing: .08em; }
.matiere { margin-top: 3mm; font-size: 28pt; line-height: 1.12; font-weight: 800; letter-spacing: -.02em; }
.fiche { margin-top: 14mm; border-top: 1px solid #e6ebee; }
.fiche div { display: flex; justify-content: space-between; padding: 3.2mm 0; border-bottom: 1px solid #e6ebee; }
.fiche dt { color: #64748b; } .fiche dd { margin: 0; font-weight: 700; }
.avis { margin-top: auto; background: #f4fbfa; border: 1px solid #bce9e5; border-radius: 10px; padding: 4mm 5mm; color: #334155; font-size: 9pt; }
h2 { font-size: 13pt; font-weight: 800; margin: 7mm 0 3mm; }
h3.exercice { display: flex; justify-content: space-between; align-items: baseline; font-size: 12pt; font-weight: 800; color: #0a7f77; margin: 8mm 0 3mm; padding-bottom: 1.5mm; border-bottom: 1.5px solid #bce9e5; break-after: avoid; }
p { margin: 0 0 3mm; text-align: justify; }
.question { display: grid; grid-template-columns: 9mm 1fr auto; gap: 2mm; margin: 0 0 2.6mm; break-inside: avoid; }
.question.sans-num { grid-template-columns: 1fr auto; }
.num { font-weight: 800; color: #0a7f77; }
.pts { white-space: nowrap; font-weight: 700; font-size: 9pt; color: #0a7f77; background: #e6f7f5; border-radius: 6px; padding: .4mm 2mm; height: fit-content; }
.formule { margin: 3mm 0; text-align: center; }
ul { margin: 0 0 3mm; padding-left: 6mm; }
table { border-collapse: collapse; margin: 3mm 0 4mm; width: 100%; font-size: 9.5pt; break-inside: avoid; }
th, td { border: 1px solid #d7e0e3; padding: 1.6mm 2.4mm; text-align: left; vertical-align: top; }
th { background: #f1f5f6; font-weight: 700; }
figure { margin: 4mm 0; text-align: center; break-inside: avoid; }
figure img { max-width: 100%; max-height: 110mm; border: 1px solid #e6ebee; border-radius: 6px; }
figcaption { font-size: 9pt; color: #64748b; margin-top: 1.5mm; }
</style></head><body>
<section class="garde">
  <div class="marque">${LOGO}Campusly</div>
  <div class="etab">${etablissement.map(echapper).join("<br>")}</div>
  <div class="nature">${meta.corrige ? (en ? "Answers" : "Corrigé") : en ? "Past paper" : "Sujet"} · ${echapper(meta.type)}${meta.avecCorrige ? (en ? " · with answers" : " · avec corrigé") : ""}</div>
  <div class="matiere">${echapper(meta.matiere)}</div>
  <dl class="fiche">${lignes
    .filter(([, v]) => v)
    .map(([k, v]) => `<div><dt>${k}</dt><dd>${echapper(v!)}</dd></div>`)
    .join("")}</dl>
  <div class="avis">${
    en
      ? "Version rebuilt automatically from the original sheet. If in doubt about a word or a figure, check the original on Campusly."
      : "Version reconstituée automatiquement à partir de la feuille d'origine. En cas de doute sur un mot ou un chiffre, compare avec l'original sur Campusly."
  }</div>
</section>
<main><p></p>${contenu(pages, figures, meta.langue)}</main>
</body></html>`;
}

// The footer the printer repeats on every page.
export const piedDePage = (meta: Meta) =>
  `<div style="width:100%;font-family:Manrope,sans-serif;font-size:7.5pt;color:#64748b;padding:0 18mm;display:flex;justify-content:space-between">
<span><b style="color:#0a7f77">Campusly</b> · ${echapper(meta.matiere)} · ${echapper(`${meta.filiere} ${meta.niveau} · ${meta.annee}`)}</span>
<span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`;
