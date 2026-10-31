/*
 * Puts the Sujets d'entraînement (GLOSSARY.md) online: for each lecturer
 * whose five papers have been written and then checked
 * (scripts/entrainement-redaction.md), prints each paper and its corrigé,
 * sends to R2 the PDFs and the texts for the page, then the index of the
 * lecturers and their papers.
 *
 *   npx tsx scripts/entrainer.ts                 every lecturer ready (5 sujets, 5 corrigés, verif.md)
 *   npx tsx scripts/entrainer.ts simo-christelle these ones
 *
 * Reads ../campusly-numerisation/entrainement/{enseignants.json, <slug>/…}.
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });
process.env.DATABASE_URL ??= "postgres://inutilise@localhost/x";

const DOSSIER = join(process.env.HOME ?? "", "campusly-numerisation", "entrainement");
const N = [1, 2, 3, 4, 5];

// The front matter between the two "---", and the text after it.
function decouper(source: string) {
  const m = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(source.trim());
  if (!m) throw new Error("en-tête manquant");
  const tete = Object.fromEntries(
    m[1].split("\n").map((l) => /^(\w+)\s*:\s*(.*)$/.exec(l)).filter((x) => !!x).map((x) => [x![1], x![2].trim()])
  );
  return { tete, texte: m[2].trim() };
}

async function principal() {
  const { cles, deposer } = await import("../src/lib/numerisation/r2");
  const { gabaritEntrainement, lireProfil } = await import("../src/lib/entrainement");
  type Enseignant = import("../src/lib/entrainement").EnseignantEntrainement;
  type Sujet = import("../src/lib/entrainement").SujetEntrainement;
  const { imprimerPdf } = await import("./pdf-local");

  const noms = new Map(
    (JSON.parse(readFileSync(join(DOSSIER, "enseignants.json"), "utf8")) as { slug: string; nom: string }[]).map((e) => [e.slug, e.nom])
  );
  const fichier = (slug: string, nom: string) => join(DOSSIER, slug, nom);
  const pret = (slug: string) =>
    noms.has(slug) &&
    existsSync(fichier(slug, "verif.md")) &&
    existsSync(fichier(slug, "profil.md")) &&
    N.every((n) => existsSync(fichier(slug, `sujet-${n}.md`)) && existsSync(fichier(slug, `corrige-${n}.md`)));
  const demandes = process.argv.slice(2);
  const slugs = (demandes.length ? demandes : [...noms.keys()]).filter(pret);
  console.log(`${slugs.length} enseignant(s) prêt(s)`);

  for (const slug of slugs) {
    const nom = noms.get(slug)!;
    const sujets: Sujet[] = [];
    for (const n of N) {
      const { tete, texte } = decouper(readFileSync(fichier(slug, `sujet-${n}.md`), "utf8"));
      const corrige = readFileSync(fichier(slug, `corrige-${n}.md`), "utf8").trim();
      const s: Sujet = {
        n,
        matiere: tete.matiere,
        type: tete.type,
        filiere: tete.filiere,
        niveau: tete.niveau,
        duree: tete.duree,
        langue: tete.langue || "fr",
      };
      if (!s.matiere || !s.type || !s.filiere || !s.niveau) throw new Error(`${slug}/sujet-${n}.md : en-tête incomplet`);
      const pied = (quoi: string) =>
        `<div style="width:100%;font-family:Manrope,sans-serif;font-size:7.5pt;color:#64748b;padding:0 16mm;display:flex;justify-content:space-between"><span><b style="color:#0a7f77">Campusly</b> · ${quoi} · non rédigé par l'enseignant</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`;
      const pdfSujet = await imprimerPdf(gabaritEntrainement({ nom }, s, texte, false), pied("Sujet d'entraînement"));
      const pdfCorrige = await imprimerPdf(gabaritEntrainement({ nom }, s, corrige, true), pied("Corrigé d'entraînement"));
      writeFileSync(fichier(slug, `sujet-${n}.pdf`), pdfSujet);
      writeFileSync(fichier(slug, `corrige-${n}.pdf`), pdfCorrige);
      await deposer(cles.entrainementPdf(slug, n), pdfSujet, "application/pdf");
      await deposer(cles.entrainementPdf(slug, n, true), pdfCorrige, "application/pdf");
      await deposer(cles.entrainementTextes(slug, n), JSON.stringify({ sujet: texte, corrige }), "application/json");
      sujets.push(s);
    }
    const enseignant: Enseignant = { slug, nom, profil: lireProfil(readFileSync(fichier(slug, "profil.md"), "utf8")), sujets };
    writeFileSync(fichier(slug, "publie.json"), JSON.stringify(enseignant));
    console.log(`✓ ${nom} : ${[...new Set(sujets.map((s) => s.matiere))].join(", ")}`);
  }

  // The index lists every lecturer published by this run or an earlier one.
  const enLigne = readdirSync(DOSSIER)
    .filter((d) => pret(d) && existsSync(fichier(d, "publie.json")))
    .map((d) => JSON.parse(readFileSync(fichier(d, "publie.json"), "utf8")) as Enseignant)
    .sort((a, b) => a.nom.localeCompare(b.nom, "fr"));
  await deposer(cles.indexEntrainement, JSON.stringify(enLigne), "application/json");
  console.log(`Index : ${enLigne.length} enseignant(s), ${enLigne.length * N.length} Sujets d'entraînement en ligne.`);
}

principal().catch((e) => {
  console.error(e);
  process.exit(1);
});
