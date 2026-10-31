/*
 * Puts the Corrigés IA (GLOSSARY.md) online: for each Sujet whose answer key
 * has been written and then checked (scripts/corrige-redaction.md), prints its
 * PDF and sends to R2 the PDF, its text for the page, and the index of the
 * Sujets that have one.
 *
 *   npx tsx scripts/corriger.ts            every Sujet ready (corrige-ia.md and corrige-ia.verif)
 *   npx tsx scripts/corriger.ts 138 81     these ones
 *
 * Reads ../campusly-numerisation/<id>/{sujet.md, corrige-ia.md, corrige-ia.notes, corrige-ia.verif}.
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });
process.env.DATABASE_URL ??= "postgres://inutilise@localhost/x";

const DOSSIER = join(process.env.HOME ?? "", "campusly-numerisation");

async function principal() {
  const { cles, deposer } = await import("../src/lib/numerisation/r2");
  const { gabaritCorrige } = await import("../src/lib/corrige-ia");
  const { imprimerPdf } = await import("./pdf-local");
  type Meta = { matiere: string; type: string; filiere: string; niveau: string; annee: string; enseignant: string | null };

  const pret = (id: number) => existsSync(join(DOSSIER, String(id), "corrige-ia.md")) && existsSync(join(DOSSIER, String(id), "corrige-ia.verif"));
  const demandes = process.argv.slice(2).filter((a) => /^\d+$/.test(a)).map(Number);
  const tous = readdirSync(DOSSIER).filter((d) => /^\d+$/.test(d)).map(Number).sort((a, b) => a - b);
  const ids = (demandes.length ? demandes : tous).filter(pret);
  console.log(`${ids.length} Corrigé(s) IA prêt(s)`);

  for (const id of ids) {
    const rep = join(DOSSIER, String(id));
    const meta = JSON.parse(readFileSync(join(rep, "extraction.json"), "utf8")).meta as Meta;
    const texte = readFileSync(join(rep, "corrige-ia.md"), "utf8").trim();
    const reserves = existsSync(join(rep, "corrige-ia.notes"))
      ? readFileSync(join(rep, "corrige-ia.notes"), "utf8").split("\n").map((l) => l.trim()).filter(Boolean)
      : [];
    const corrige = { sujet: id, le: new Date().toISOString(), texte, reserves };
    const pied = `<div style="width:100%;font-family:Manrope,sans-serif;font-size:7.5pt;color:#64748b;padding:0 16mm;display:flex;justify-content:space-between"><span><b style="color:#0a7f77">Campusly</b> · Corrigé IA · ${meta.matiere.replace(/[<>&]/g, "")}</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`;
    const pdf = await imprimerPdf(gabaritCorrige(meta, texte), pied);
    writeFileSync(join(rep, "corrige-ia.pdf"), pdf);
    await deposer(cles.corrigeIa(id), pdf, "application/pdf");
    await deposer(cles.corrigeIaTexte(id), JSON.stringify(corrige), "application/json");
    console.log(`✓ ${id} ${meta.matiere} : ${Math.round(pdf.length / 1024)} Ko${reserves.length ? `, ${reserves.length} réserve(s)` : ""}`);
  }

  // The index lists every Sujet whose Corrigé IA is ready, published by this run or an earlier one.
  const enLigne = tous.filter((id) => pret(id) && existsSync(join(DOSSIER, String(id), "corrige-ia.pdf")));
  await deposer(cles.indexCorrigesIa, JSON.stringify(enLigne), "application/json");
  console.log(`Index : ${enLigne.length} Corrigés IA en ligne.`);
}

principal().catch((e) => {
  console.error(e);
  process.exit(1);
});
