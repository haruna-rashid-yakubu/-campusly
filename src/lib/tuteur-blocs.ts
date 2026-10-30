/*
 * The tutor's answer cut into what the screen draws: Markdown between
 * interactive blocks (:::indice, :::solution, :::cle, :::etapes, :::quiz —
 * see lib/tuteur), and the follow-ups of its last line [[suggestions: a | b]].
 *
 * Read again on every streamed chunk: a block not closed yet is marked
 * incomplete and shown as being written, and a half-written suggestions line
 * is hidden until it ends.
 */
export type Bloc =
  | { t: "md"; texte: string }
  | { t: "indice" | "solution" | "cle"; texte: string; complet: boolean }
  | { t: "etapes"; etapes: string[]; complet: boolean }
  | { t: "quiz"; question: string; choix: { texte: string; juste: boolean }[]; explication: string; complet: boolean };

const NOMS = ["indice", "solution", "cle", "etapes", "quiz"] as const;

function bloc(nom: (typeof NOMS)[number], lignes: string[], complet: boolean): Bloc {
  const texte = lignes.join("\n").trim();
  if (nom === "etapes") {
    const etapes = lignes.map((l) => l.trim()).filter(Boolean).map((l) => l.replace(/^(-|\*|•|\d+[.)])\s*/, ""));
    return { t: "etapes", etapes, complet };
  }
  if (nom === "quiz") {
    const choix: { texte: string; juste: boolean }[] = [];
    const question: string[] = [];
    let explication = "";
    for (const l of lignes.map((x) => x.trim()).filter(Boolean)) {
      const c = l.match(/^[-*]\s*\[( |x|X)\]\s*(.*)$/);
      if (c) choix.push({ texte: c[2], juste: c[1].toLowerCase() === "x" });
      else if (/^explication\s*:/i.test(l)) explication = l.replace(/^explication\s*:\s*/i, "");
      else if (explication) explication += `\n${l}`;
      else if (!choix.length) question.push(l);
    }
    return { t: "quiz", question: question.join("\n"), choix, explication, complet: complet && choix.some((c) => c.juste) };
  }
  return { t: nom, texte, complet };
}

export function decouper(source: string): { blocs: Bloc[]; suggestions: string[] } {
  let texte = source;
  let suggestions: string[] = [];
  const s = texte.match(/\[\[\s*suggestions\s*:([^\]]*)\]\]/i);
  if (s) {
    suggestions = s[1].split("|").map((x) => x.trim()).filter(Boolean).slice(0, 3);
    texte = texte.replace(s[0], "");
  }
  // Still being written: hidden until its closing brackets arrive.
  texte = texte.replace(/\[\[[^\]]*$/, "");

  const blocs: Bloc[] = [];
  let md: string[] = [];
  let ouvert: { nom: (typeof NOMS)[number]; lignes: string[] } | null = null;
  const viderMd = () => {
    if (md.join("").trim()) blocs.push({ t: "md", texte: md.join("\n") });
    md = [];
  };

  for (const ligne of texte.split("\n")) {
    const debut = ligne.trim().match(/^:::\s*([a-zé]+)\s*$/i);
    const nom = debut ? (debut[1].toLowerCase().replace("é", "e") as (typeof NOMS)[number]) : null;
    if (!ouvert && nom && NOMS.includes(nom)) {
      viderMd();
      ouvert = { nom, lignes: [] };
    } else if (ouvert && ligne.trim() === ":::") {
      blocs.push(bloc(ouvert.nom, ouvert.lignes, true));
      ouvert = null;
    } else if (ouvert) ouvert.lignes.push(ligne);
    else md.push(ligne);
  }
  viderMd();
  if (ouvert) blocs.push(bloc(ouvert.nom, ouvert.lignes, false));
  return { blocs, suggestions };
}

/** The answer as plain text, for "Copier": the blocks' markers removed. */
export function enClair(source: string) {
  return source
    .replace(/\[\[[^\]]*\]\]/g, "")
    .replace(/^:::\s*(indice|solution|cle|etapes|quiz)\s*$/gim, (_, n: string) => ({ indice: "Indice :", solution: "Réponse :", cle: "À retenir :", etapes: "Étapes :", quiz: "Quiz :" })[n.toLowerCase()] ?? "")
    .replace(/^:::\s*$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
