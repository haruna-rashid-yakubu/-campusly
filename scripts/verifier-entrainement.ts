/*
 * Checks how the Sujets d'entraînement will render before they are published:
 * each sujet-N.md and corrige-N.md goes through the page's Markdown, and what
 * did not become formatting is listed — a KaTeX error, a "$" or "**" left
 * as is, a front matter missing a field.
 *
 *   npx tsx scripts/verifier-entrainement.ts [slugs]
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { markdown } from "../src/lib/markdown";

const DOSSIER = join(process.env.HOME ?? "", "campusly-numerisation", "entrainement");
const demandes = process.argv.slice(2);
const slugs = demandes.length ? demandes : readdirSync(DOSSIER).filter((d) => existsSync(join(DOSSIER, d, "profil.md")));
let problemes = 0;

for (const slug of slugs) {
  for (const nom of readdirSync(join(DOSSIER, slug)).filter((f) => /^(sujet|corrige)-\d\.md$/.test(f))) {
    let source = readFileSync(join(DOSSIER, slug, nom), "utf8");
    const notes: string[] = [];
    if (nom.startsWith("sujet")) {
      const m = /^---\n([\s\S]*?)\n---\n/.exec(source);
      if (!m) notes.push("en-tête absent");
      else {
        for (const champ of ["matiere", "type", "filiere", "niveau", "duree", "langue"])
          if (!new RegExp(`^${champ}\\s*:\\s*\\S`, "m").test(m[1])) notes.push(`en-tête sans ${champ}`);
        source = source.slice(m[0].length);
      }
    }
    const html = markdown(source, true);
    const texte = html.replace(/<span class="katex[\s\S]*?<\/annotation>/g, "").replace(/<[^>]+>/g, " ");
    if (html.includes("katex-error")) notes.push(`KaTeX : ${/title="([^"]{0,120})/.exec(html)?.[1] ?? "erreur"}`);
    for (const [motif, quoi] of [
      [/\$/, "« $ » resté brut"],
      [/\*\*/, "« ** » resté brut"],
      [/\\\(|\\\[/, "délimiteur LaTeX \\( ou \\["],
    ] as const) {
      const i = texte.search(motif);
      if (i >= 0) notes.push(`${quoi} : …${texte.slice(Math.max(0, i - 40), i + 40).replace(/\s+/g, " ")}…`);
    }
    if (notes.length) {
      problemes += notes.length;
      console.log(`${slug}/${nom}\n  ${notes.join("\n  ")}`);
    }
  }
}
console.log(problemes ? `${problemes} point(s) à revoir.` : "Rendu propre.");
