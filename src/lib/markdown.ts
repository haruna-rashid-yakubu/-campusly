import katex from "katex";

/*
 * The tutor's answers, from the Markdown it writes to HTML: headings, lists,
 * tables, quotes, rules, **bold**, *italic*, `code`, and maths in $…$, $$…$$,
 * \(…\), \[…\] or a bare \begin{…}…\end{…}, typeset by KaTeX. Everything else
 * is escaped.
 *
 * Maths is set aside first and put back last, so **$x$** is bold maths and an
 * underscore or a star inside a formula never turns into emphasis. In running
 * text, \dfrac becomes \frac: a full-size fraction is taller than the line and
 * ran into the one above.
 *
 * Run again on every streamed chunk: an unfinished "$x" stays text until its
 * closing dollar arrives.
 */
const echapper = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const maths = (latex: string, display: boolean) =>
  katex.renderToString(display ? latex : latex.replace(/\\dfrac/g, "\\frac"), {
    displayMode: display,
    throwOnError: false,
    strict: "ignore",
    output: "html",
  });

// Characters that never occur in text: placeholders for what is set aside.
const MATHS = "\u0001";
const BLOC = "\u0000";

function enLigne(s: string, grandesFractions = false) {
  const formules: string[] = [];
  const texte = s
    .replace(/\\\$/g, "\u0002")
    .replace(/\$\$([^$]+)\$\$|\$([^$\n]+?)\$/g, (_, d: string | undefined, m: string | undefined) => {
      // Inline $$…$$ inside a sentence or a cell: typeset at text size.
      formules.push(grandesFractions ? katex.renderToString(d ?? m!, { throwOnError: false, strict: "ignore", output: "html" }) : maths(d ?? m!, false));
      return `${MATHS}${formules.length - 1}${MATHS}`;
    });
  return echapper(texte)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/__(.+?)__/g, "<strong>$1</strong>")
    // A star between words or numbers is a multiplication, not emphasis.
    .replace(/(^|[\s(«"'])\*(?=\S)([^*\n]*?\S)\*(?=$|[\s).,;:!?»"'])/g, "$1<em>$2</em>")
    .replace(/(^|[\s(«"'])_(?=\S)([^_\n]*?\S)_(?=$|[\s).,;:!?»"'])/g, "$1<em>$2</em>")
    .replace(/\u0002/g, "$")
    .replace(new RegExp(`${MATHS}(\\d+)${MATHS}`, "g"), (_, i: string) => formules[Number(i)]);
}

const cellules = (ligne: string) =>
  ligne
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split(/(?<!\\)\|/)
    .map((c) => c.trim());

const estSeparation = (ligne: string) => /^\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?$/.test(ligne.trim());

function tableau(lignes: string[]) {
  const sep = lignes.findIndex(estSeparation);
  const tete = sep === 1 ? cellules(lignes[0]) : null;
  const corps = lignes.filter((_, i) => i !== sep && !(tete && i === 0)).map(cellules);
  const n = Math.max(tete?.length ?? 0, ...corps.map((l) => l.length));
  const ligne = (l: string[], balise: "th" | "td") =>
    `<tr>${Array.from({ length: n }, (_, i) => `<${balise}>${enLigne(l[i] ?? "", true)}</${balise}>`).join("")}</tr>`;
  return `<div class="tableau"><table>${tete ? `<thead>${ligne(tete, "th")}</thead>` : ""}<tbody>${corps.map((l) => ligne(l, "td")).join("")}</tbody></table></div>`;
}

export function markdown(source: string) {
  const blocs: string[] = [];
  const aPart = (html: string) => `\n${BLOC}${blocs.push(html) - 1}${BLOC}\n`;
  const texte = source
    .replace(/\r\n?/g, "\n")
    .replace(/\\\[([\s\S]+?)\\\]/g, (_, m: string) => aPart(`<div class="formule">${maths(m, true)}</div>`))
    .replace(/\$\$\s*\n([\s\S]+?)\n\s*\$\$/g, (_, m: string) => aPart(`<div class="formule">${maths(m, true)}</div>`))
    .replace(/^\s*\$\$([^\n]+?)\$\$\s*$/gm, (_, m: string) => aPart(`<div class="formule">${maths(m, true)}</div>`))
    // An environment written without dollars around it.
    .replace(/^\s*(\\begin\{([a-z*]+)\}[\s\S]+?\\end\{\2\})\s*$/gm, (_, m: string) => aPart(`<div class="formule">${maths(m, true)}</div>`))
    .replace(/\\\(([\s\S]+?)\\\)/g, (_, m: string) => `$${m.replace(/\n/g, " ")}$`);

  const sortie: string[] = [];
  let paragraphe: string[] = [];
  let liste: { balise: "ul" | "ol"; elements: string[] } | null = null;
  let table: string[] = [];
  let citation: string[] = [];
  const fermer = () => {
    if (paragraphe.length) sortie.push(`<p>${paragraphe.join("<br>")}</p>`);
    paragraphe = [];
    if (liste) sortie.push(`<${liste.balise}>${liste.elements.map((e) => `<li>${e}</li>`).join("")}</${liste.balise}>`);
    liste = null;
    if (table.length) sortie.push(tableau(table));
    table = [];
    if (citation.length) sortie.push(`<blockquote>${citation.join("<br>")}</blockquote>`);
    citation = [];
  };

  for (const brute of texte.split("\n")) {
    const ligne = brute.trim();
    const bloc = ligne.match(new RegExp(`^${BLOC}(\\d+)${BLOC}$`));
    const titre = ligne.match(/^#{1,6}\s+(.*?)\s*#*$/);
    const puce = ligne.match(/^[-*•+]\s+(.*)$/);
    const numero = ligne.match(/^\d+[.)]\s+(.*)$/);
    const cite = ligne.match(/^>\s?(.*)$/);
    if (!ligne) fermer();
    else if (bloc) {
      fermer();
      sortie.push(blocs[Number(bloc[1])]);
    } else if (ligne.startsWith("|") && (table.length || ligne.indexOf("|", 1) > 0)) {
      if (!table.length) fermer();
      table.push(ligne);
    } else if (/^(-{3,}|\*{3,}|_{3,})$/.test(ligne)) {
      fermer();
      sortie.push("<hr>");
    } else if (titre) {
      fermer();
      sortie.push(`<h4>${enLigne(titre[1])}</h4>`);
    } else if (cite) {
      if (!citation.length) fermer();
      citation.push(enLigne(cite[1]));
    } else if (puce || numero) {
      const balise = puce ? "ul" : "ol";
      if (paragraphe.length || table.length || citation.length || (liste && liste.balise !== balise)) fermer();
      liste ??= { balise, elements: [] };
      liste.elements.push(enLigne((puce ?? numero)![1]));
    } else if (liste && /^\s{2,}/.test(brute)) {
      // A continuation line of a list item.
      liste.elements[liste.elements.length - 1] += `<br>${enLigne(ligne)}`;
    } else {
      if (liste || table.length || citation.length) fermer();
      paragraphe.push(enLigne(ligne));
    }
  }
  fermer();
  return sortie.join("");
}

/** One line, for a title or a summary row: the same formatting, no paragraph around it. */
export const markdownEnLigne = (texte: string) => enLigne(texte);
