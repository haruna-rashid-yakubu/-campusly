import katex from "katex";

/*
 * The tutor's answers, from the Markdown it writes to HTML, all of it:
 * headings, paragraphs, lists (nested, numbered, with checkboxes), tables
 * (with their column alignment), quotes (which can hold lists and formulas),
 * rules, code blocks, and in a line **bold**, *italic*, ***both***, ~~struck~~,
 * `code`, [links](https://…) and maths in $…$, $$…$$, \(…\), \[…\] or a bare
 * \begin{…}…\end{…}, typeset by KaTeX. Everything else is escaped.
 *
 * Code and maths are set aside first and put back last: a star or an
 * underscore inside them is never emphasis, and **$x$** is bold maths. In
 * running text, \dfrac becomes \frac: a full-size fraction is taller than the
 * line and ran into the one above.
 *
 * Run again on every streamed chunk: an unfinished "$x" stays text until its
 * closing dollar arrives, and an unclosed code block shows as code already.
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
const MIS = "\u0001";
const BLOC = "\u0000";

function enLigne(s: string, grandesFractions = false) {
  const mis: string[] = [];
  const garder = (html: string) => `${MIS}${mis.push(html) - 1}${MIS}`;
  const texte = s
    // Backslash escapes: \* \_ \# \` \| \[ \] \~ \$ keep their character and lose their meaning.
    .replace(/\\([*_#`|[\]~$>\\])/g, (_, c: string) => garder(echapper(c)))
    .replace(/`([^`\n]+)`/g, (_, c: string) => garder(`<code>${echapper(c)}</code>`))
    .replace(/\$\$([^$]+)\$\$|\$([^$\n]+?)\$/g, (_, d: string | undefined, m: string | undefined) =>
      // In a table cell, a fraction keeps its full size: the row grows to fit it.
      garder(grandesFractions ? katex.renderToString(d ?? m!, { throwOnError: false, strict: "ignore", output: "html" }) : maths(d ?? m!, false))
    );
  return echapper(texte)
    .replace(/\[([^\]\n]+)\]\((https?:\/\/[^\s)"<>]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/__(.+?)__/g, "<strong>$1</strong>")
    .replace(/~~(.+?)~~/g, "<del>$1</del>")
    // A star between words or numbers is a multiplication, not emphasis.
    .replace(/(^|[\s(«"'>])\*(?=\S)([^*\n]*?\S)\*(?=$|[\s).,;:!?»"'<])/g, "$1<em>$2</em>")
    .replace(/(^|[\s(«"'>])_(?=\S)([^_\n]*?\S)_(?=$|[\s).,;:!?»"'<])/g, "$1<em>$2</em>")
    .replace(new RegExp(`${MIS}(\\d+)${MIS}`, "g"), (_, i: string) => mis[Number(i)]);
}

const cellules = (ligne: string) =>
  ligne
    .trim()
    .replace(/^\|/, "")
    .replace(/(?<!\\)\|$/, "")
    .split(/(?<!\\)\|/)
    .map((c) => c.trim());

const estSeparation = (ligne: string) => /^\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?$/.test(ligne.trim());

function tableau(lignes: string[]) {
  const sep = lignes.findIndex(estSeparation);
  const alignements = sep >= 0 ? cellules(lignes[sep]).map((c) => (c.startsWith(":") && c.endsWith(":") ? "center" : c.endsWith(":") ? "right" : "")) : [];
  const tete = sep === 1 ? cellules(lignes[0]) : null;
  const corps = lignes.filter((_, i) => i !== sep && !(tete && i === 0)).map(cellules);
  const n = Math.max(tete?.length ?? 0, ...corps.map((l) => l.length));
  const ligne = (l: string[], balise: "th" | "td") =>
    `<tr>${Array.from({ length: n }, (_, i) => `<${balise}${alignements[i] ? ` style="text-align:${alignements[i]}"` : ""}>${enLigne(l[i] ?? "", true)}</${balise}>`).join("")}</tr>`;
  return `<div class="tableau"><table>${tete ? `<thead>${ligne(tete, "th")}</thead>` : ""}<tbody>${corps.map((l) => ligne(l, "td")).join("")}</tbody></table></div>`;
}

type Element = { retrait: number; balise: "ul" | "ol"; html: string; debut?: number };

// Items in their order, each with its indentation: nested lists rebuilt from it.
function liste(elements: Element[]) {
  let html = "";
  const pile: { retrait: number; balise: "ul" | "ol" }[] = [];
  const ouvrir = (e: Element) => {
    html += `<${e.balise}${e.balise === "ol" && e.debut && e.debut !== 1 ? ` start="${e.debut}"` : ""}><li>${e.html}`;
    pile.push({ retrait: e.retrait, balise: e.balise });
  };
  const fermer = () => (html += `</li></${pile.pop()!.balise}>`);
  for (const e of elements) {
    if (!pile.length || e.retrait > pile.at(-1)!.retrait) {
      ouvrir(e);
      continue;
    }
    while (pile.length && e.retrait < pile.at(-1)!.retrait) fermer();
    if (!pile.length) ouvrir(e);
    else if (pile.at(-1)!.balise !== e.balise) {
      fermer();
      ouvrir(e);
    } else html += `</li><li>${e.html}`;
  }
  while (pile.length) fermer();
  return html;
}

const retrait = (ligne: string) => ligne.match(/^[ \t]*/)![0].replace(/\t/g, "    ").length;

function element(ligne: string): Element | null {
  const m = ligne.match(/^([ \t]*)(?:([-*•+])|(\d+)[.)])\s+(.*)$/);
  if (!m) return null;
  let texte = m[4];
  // A checkbox: "- [ ] à faire", "- [x] fait".
  const tache = texte.match(/^\[( |x|X)\]\s+(.*)$/);
  if (tache) texte = `${MIS}case${tache[1].trim() ? "1" : "0"}${MIS}${tache[2]}`;
  const html = enLigne(texte).replace(
    new RegExp(`${MIS}case([01])${MIS}`),
    (_, fait: string) => `<span class="case${fait === "1" ? " faite" : ""}" aria-hidden="true"></span>`
  );
  return { retrait: retrait(m[1]), balise: m[2] ? "ul" : "ol", html, debut: m[3] ? Number(m[3]) : undefined };
}

export function markdown(source: string): string {
  const blocs: string[] = [];
  const aPart = (html: string) => `\n${BLOC}${blocs.push(html) - 1}${BLOC}\n`;
  const formule = (m: string) => aPart(`<div class="formule">${maths(m, true)}</div>`);
  const texte = source
    .replace(/\r\n?/g, "\n")
    // Code first: nothing inside it is maths or Markdown. Unclosed while it streams in.
    .replace(/^[ \t]*```[^\n]*\n([\s\S]*?)(?:\n[ \t]*```[ \t]*$|$(?![\s\S]))/gm, (_, code: string) => aPart(`<pre><code>${echapper(code)}</code></pre>`))
    .replace(/\\\[([\s\S]+?)\\\]/g, (_, m: string) => formule(m))
    // A formula alone on its line first. Then a block whose $$ stand alone on their own lines —
    // in that order: matched first, a closing "…$$" at a line's end opened a block that swallowed
    // the text down to the next formula.
    .replace(/^[ \t]*\$\$([^\n]+?)\$\$[ \t]*$/gm, (_, m: string) => formule(m))
    .replace(/^[ \t]*\$\$[ \t]*\n([\s\S]+?)\n[ \t]*\$\$[ \t]*$/gm, (_, m: string) => formule(m))
    // An environment written without dollars around it.
    .replace(/^[ \t]*(\\begin\{([a-z*]+)\}[\s\S]+?\\end\{\2\})[ \t]*$/gm, (_, m: string) => formule(m))
    .replace(/\\\(([\s\S]+?)\\\)/g, (_, m: string) => `$${m.replace(/\n/g, " ")}$`);
  return rendre(texte, blocs);
}

function rendre(texte: string, blocs: string[]): string {
  const sortie: string[] = [];
  let paragraphe: string[] = [];
  let elements: Element[] = [];
  let table: string[] = [];
  let citation: string[] = [];
  const fermer = () => {
    if (paragraphe.length) sortie.push(`<p>${paragraphe.join("<br>")}</p>`);
    if (elements.length) sortie.push(liste(elements));
    if (table.length) sortie.push(tableau(table));
    // A quote holds Markdown of its own: lists, formulas, emphasis.
    if (citation.length) sortie.push(`<blockquote>${rendre(citation.join("\n"), blocs)}</blockquote>`);
    paragraphe = [];
    elements = [];
    table = [];
    citation = [];
  };

  for (const brute of texte.split("\n")) {
    const ligne = brute.trim();
    const bloc = ligne.match(new RegExp(`^${BLOC}(\\d+)${BLOC}$`));
    const titre = ligne.match(/^(#{1,6})\s+(.*?)\s*#*$/);
    const cite = brute.match(/^[ \t]*>\s?(.*)$/);
    const item = element(brute);
    // Anything that is not a quote line ends the quote, then is read for what it is.
    if (citation.length && ligne && !cite) fermer();
    if (!ligne) {
      // A blank line inside a quote or between list items does not end them.
      if (!citation.length && !elements.length) fermer();
      else if (citation.length) citation.push("");
    } else if (cite) {
      if (!citation.length) fermer();
      citation.push(cite[1]);
    } else if (bloc) {
      fermer();
      sortie.push(blocs[Number(bloc[1])]);
    } else if (ligne.startsWith("|") && (table.length || ligne.indexOf("|", 1) > 0)) {
      if (!table.length) fermer();
      table.push(ligne);
    } else if (/^(-[ \t]*){3,}$|^(\*[ \t]*){3,}$|^(_[ \t]*){3,}$/.test(ligne)) {
      fermer();
      sortie.push("<hr>");
    } else if (titre) {
      fermer();
      const niveau = titre[1].length <= 2 ? "h3" : titre[1].length === 3 ? "h4" : "h5";
      sortie.push(`<${niveau}>${enLigne(titre[2])}</${niveau}>`);
    } else if (item) {
      if (paragraphe.length || table.length) fermer();
      elements.push(item);
    } else if (elements.length && retrait(brute) >= 2) {
      // A continuation line of the last item.
      elements[elements.length - 1].html += `<br>${enLigne(ligne)}`;
    } else {
      if (elements.length || table.length) fermer();
      paragraphe.push(enLigne(ligne));
    }
  }
  fermer();
  return sortie.join("");
}

/** One line, for a title or a summary row: the same formatting, no paragraph around it. */
export const markdownEnLigne = (texte: string) => enLigne(texte);
