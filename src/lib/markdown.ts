import katex from "katex";

/*
 * The tutor's answers, from the little Markdown it writes to HTML: headings,
 * lists, **bold**, *italic*, `code`, and maths in $…$, $$…$$, \(…\) or \[…\],
 * typeset by KaTeX. Everything else is escaped. Run on every streamed chunk,
 * so an unfinished "$x" stays text until its closing dollar arrives.
 */
const echapper = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const maths = (latex: string, display: boolean) =>
  katex.renderToString(latex, { displayMode: display, throwOnError: false, output: "html" });

function enLigne(s: string) {
  return s
    .split(/(\$[^$\n]+\$)/g)
    .map((m) =>
      m.length > 2 && m.startsWith("$") && m.endsWith("$")
        ? maths(m.slice(1, -1), false)
        : echapper(m)
            .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
            .replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>")
            .replace(/`([^`]+)`/g, "<code>$1</code>")
    )
    .join("");
}

export function markdown(source: string) {
  const formules: string[] = [];
  const texte = source
    .replace(/\\\[([\s\S]+?)\\\]/g, (_, m: string) => `$$${m}$$`)
    .replace(/\\\(([\s\S]+?)\\\)/g, (_, m: string) => `$${m}$`)
    .replace(/\$\$([\s\S]+?)\$\$/g, (_, m: string) => `\n\u0000${formules.push(maths(m, true)) - 1}\u0000\n`);

  const sortie: string[] = [];
  let paragraphe: string[] = [];
  let liste: { balise: "ul" | "ol"; elements: string[] } | null = null;
  const fermer = () => {
    if (paragraphe.length) sortie.push(`<p>${paragraphe.join("<br>")}</p>`);
    paragraphe = [];
    if (liste) sortie.push(`<${liste.balise}>${liste.elements.map((e) => `<li>${e}</li>`).join("")}</${liste.balise}>`);
    liste = null;
  };

  for (const brute of texte.split("\n")) {
    const ligne = brute.trim();
    const formule = ligne.match(/^\u0000(\d+)\u0000$/);
    const titre = ligne.match(/^#{1,4}\s+(.*)$/);
    const puce = ligne.match(/^[-*•]\s+(.*)$/);
    const numero = ligne.match(/^\d+[.)]\s+(.*)$/);
    if (!ligne) fermer();
    else if (/^(-{3,}|\*{3,}|_{3,})$/.test(ligne)) {
      fermer();
      sortie.push("<hr>");
    }
    else if (formule) {
      fermer();
      sortie.push(`<div class="formule">${formules[Number(formule[1])]}</div>`);
    } else if (titre) {
      fermer();
      sortie.push(`<h4>${enLigne(titre[1])}</h4>`);
    } else if (puce || numero) {
      const balise = puce ? "ul" : "ol";
      if (paragraphe.length || (liste && liste.balise !== balise)) fermer();
      liste ??= { balise, elements: [] };
      liste.elements.push(enLigne((puce ?? numero)![1]));
    } else {
      if (liste) fermer();
      paragraphe.push(enLigne(ligne));
    }
  }
  fermer();
  return sortie.join("");
}
