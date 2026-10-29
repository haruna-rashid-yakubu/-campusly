/*
 * Numérise les Sujets existants, en deux temps séparés par une relecture.
 *
 *   npx tsx scripts/numeriser.ts --preparer <dossier> 64 138 145
 *     Archive l'original dans R2, lit chaque page avec DeepSeek et écrit, pour
 *     chaque Sujet, <dossier>/<id>/page-01.jpg … et extraction.json.
 *     Une extraction déjà présente dans R2 est reprise (--relire pour refaire).
 *
 *   (relecture : chaque page est comparée à sa photo et extraction.json corrigé)
 *
 *   npx tsx scripts/numeriser.ts --publier <dossier> 64 138 145
 *     Produit la Version originale et la Version reconstituée à partir de
 *     l'extraction relue et les dépose dans R2 avec elle.
 *
 * Un Corrigé dans un fichier séparé est traité sous <id>-corrige.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { config } from "dotenv";
import puppeteer from "puppeteer-core";
import sharp from "sharp";
import { extrairePage, type Bloc, type Extraction, type PageExtraite } from "../src/lib/numerisation/extraction";
import { gabarit, piedDePage } from "../src/lib/numerisation/gabarit";
import { versionOriginale } from "../src/lib/numerisation/originale";
import { cles, deposer, lire } from "../src/lib/numerisation/r2";

// The modules read their keys when called, so loading them first is fine.
config({ path: ".env.local", quiet: true });

const SITE = "https://campusly-ucac.vercel.app";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const args = process.argv.slice(2);
const mode = args.includes("--preparer") ? "preparer" : args.includes("--publier") ? "publier" : null;
const dossier = args[args.findIndex((a) => a === "--preparer" || a === "--publier") + 1];
const relire = args.includes("--relire");
const ids = args.filter((a) => /^\d+$/.test(a) && a !== dossier).map(Number);
if (!mode || !dossier) {
  console.error("Usage : --preparer <dossier> <ids…> | --publier <dossier> <ids…>");
  process.exit(1);
}

type Sujet = { id: number; matiere: string; filiere: string; niveau: string; annee: string; type: string; enseignant: string | null; corrige: boolean; correctionUrl?: string | null };

async function sujet(id: number): Promise<Sujet> {
  const r = await fetch(`${SITE}/api/v1/sujets/${id}`);
  if (!r.ok) throw new Error(`Sujet ${id} introuvable`);
  return ((await r.json()) as { subject: Sujet }).subject;
}

// The file as published: from R2 once archived, otherwise from the site (first run).
async function original(id: number, corrige: boolean) {
  const nom = corrige ? "corrige.pdf" : "sujet.pdf";
  const archive = await lire(cles.original(id, nom, corrige));
  if (archive) return archive;
  const r = await fetch(`${SITE}/api/fichiers/${id}/f.pdf?v=1${corrige ? "&c=1" : ""}`);
  if (!r.ok) return null;
  const octets = new Uint8Array(await r.arrayBuffer());
  await deposer(cles.original(id, nom, corrige), octets, r.headers.get("content-type") ?? "application/pdf");
  return octets;
}

// One JPEG per page, whatever came in.
function pagesDe(octets: Uint8Array): Uint8Array[] {
  if (Buffer.from(octets.slice(0, 5)).toString() !== "%PDF-") return [octets];
  const tmp = mkdtempSync(join(tmpdir(), "num-"));
  writeFileSync(join(tmp, "f.pdf"), octets);
  execFileSync("pdftoppm", ["-r", "170", "-jpeg", "-jpegopt", "quality=88", join(tmp, "f.pdf"), join(tmp, "p")]);
  return readdirSync(tmp)
    .filter((f) => f.startsWith("p") && f.endsWith(".jpg"))
    .sort()
    .map((f) => new Uint8Array(readFileSync(join(tmp, f))));
}

const nomPage = (i: number) => `page-${String(i + 1).padStart(2, "0")}.jpg`;

async function preparer(s: Sujet, corrige: boolean) {
  const octets = await original(s.id, corrige);
  if (!octets) {
    if (corrige) return; // "Avec corrigé" can mean the answers are in the same file.
    throw new Error(`Fichier du Sujet ${s.id} introuvable`);
  }
  const images = pagesDe(octets);
  const rep = join(dossier, `${s.id}${corrige ? "-corrige" : ""}`);
  mkdirSync(rep, { recursive: true });
  images.forEach((img, i) => writeFileSync(join(rep, nomPage(i)), img));

  const deja = relire ? null : await lire(cles.extraction(s.id, corrige));
  const cache = deja ? (JSON.parse(Buffer.from(deja).toString()) as Extraction) : null;
  const pages: PageExtraite[] = cache && cache.pages.length === images.length ? cache.pages : [];
  if (!pages.length) {
    // Four pages at a time: enough to be quick, few enough not to be throttled.
    for (let i = 0; i < images.length; i += 4) {
      pages.push(...(await Promise.all(images.slice(i, i + 4).map((image) => extrairePage(image)))));
    }
  }
  const entete = pages.find((p) => p.entete)?.entete ?? null;
  const extraction: Extraction = cache?.verification
    ? cache
    : {
        sujet: s.id,
        corrige,
        meta: {
          matiere: s.matiere,
          filiere: s.filiere,
          niveau: s.niveau,
          annee: s.annee,
          type: entete?.type ?? s.type,
          enseignant: s.enseignant ?? entete?.enseignant ?? null,
          duree: entete?.duree ?? null,
          session: entete?.session ?? null,
          etablissement: entete?.etablissement ?? [],
          corrige,
          langue: pages[0]?.langue ?? "fr",
        },
        confiance: Math.min(...pages.map((p) => p.confiance)),
        themes: [...new Set(pages.flatMap((p) => p.themes))],
        pages,
        verification: null,
      };
  writeFileSync(join(rep, "extraction.json"), JSON.stringify(extraction, null, 2));
  await deposer(cles.extraction(s.id, corrige), JSON.stringify(extraction), "application/json");
  console.log(`· ${s.id}${corrige ? " corrigé" : ""} ${s.matiere} : ${images.length} page(s), confiance ${extraction.confiance.toFixed(2)}${extraction.verification ? " (déjà relu)" : ""}`);
}

async function figures(images: Uint8Array[], pages: PageExtraite[]) {
  const map = new Map<Bloc, string>();
  for (const [i, extraite] of pages.entries()) {
    const brute = images[i];
    if (!brute) continue;
    // Figure boxes are measured on the upright page.
    const image = await sharp(await sharp(brute).rotate().toBuffer()).rotate(extraite.rotation ?? 0).toBuffer();
    const { width = 0, height = 0 } = await sharp(image).metadata();
    for (const b of extraite.blocs) {
      if (b.t !== "figure") continue;
      const [x0, y0, x1, y1] = b.boite.map((v) => Math.max(0, Math.min(1000, v)) / 1000);
      const left = Math.round(x0 * width), top = Math.round(y0 * height);
      const w = Math.round((x1 - x0) * width), h = Math.round((y1 - y0) * height);
      if (w < 20 || h < 20) continue;
      const jpg = await sharp(image).extract({ left, top, width: w, height: h }).normalise().jpeg({ quality: 85 }).toBuffer();
      map.set(b, `data:image/jpeg;base64,${jpg.toString("base64")}`);
    }
  }
  return map;
}

async function imprimer(html: string, pied: string) {
  const navigateur = await puppeteer.launch({ executablePath: CHROME, headless: true });
  try {
    const page = await navigateur.newPage();
    await page.setContent(html, { waitUntil: "load" });
    await page.evaluateHandle("document.fonts.ready");
    return await page.pdf({
      format: "A4",
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: "<span></span>",
      footerTemplate: pied,
      margin: { top: "20mm", bottom: "22mm", left: "18mm", right: "18mm" },
    });
  } finally {
    await navigateur.close();
  }
}

async function publier(id: number, corrige: boolean) {
  const rep = join(dossier, `${id}${corrige ? "-corrige" : ""}`);
  if (!existsSync(join(rep, "extraction.json"))) return;
  const extraction = JSON.parse(readFileSync(join(rep, "extraction.json"), "utf8")) as Extraction;
  if (!extraction.verification) {
    console.log(`· ${id}${corrige ? " corrigé" : ""} : pas encore relu, ignoré`);
    return;
  }
  const images = readdirSync(rep)
    .filter((f) => /^page-\d+\.jpg$/.test(f))
    .sort()
    .map((f) => new Uint8Array(readFileSync(join(rep, f))));
  const { meta, pages } = extraction;
  extraction.confiance = Math.min(...pages.map((p) => p.confiance));
  // A sheet the photos never showed is said where the student would look for it, at the end.
  const manque = extraction.verification.corrections.find((c) => c.startsWith("MANQUE"));
  const derniere = pages[pages.length - 1];
  if (manque && !derniere.blocs.some((b) => b.t === "paragraphe" && b.texte.startsWith("[Incomplet"))) {
    derniere.blocs.push({
      t: "paragraphe",
      texte: `[Incomplet : ${manque.replace(/^MANQUE\s*:\s*/, "")}. Si tu as cette feuille, envoie-la sur Campusly.]`,
    });
  }

  const reconstituee = await imprimer(gabarit(meta, pages, await figures(images, pages)), piedDePage(meta));
  const originale = await versionOriginale(
    images.map((image, i) => ({ image, extraite: pages[i] })),
    `${meta.matiere} ${meta.annee}`
  );
  writeFileSync(join(rep, "originale.pdf"), originale);
  writeFileSync(join(rep, "reconstituee.pdf"), reconstituee);
  await deposer(cles.originale(id, corrige), originale, "application/pdf");
  await deposer(cles.reconstituee(id, corrige), reconstituee, "application/pdf");
  await deposer(cles.extraction(id, corrige), JSON.stringify(extraction), "application/json");
  const aRelire = pages.filter((p) => p.aRelire).length;
  console.log(`· ${id}${corrige ? " corrigé" : ""} ${meta.matiere} : publié, ${extraction.verification.corrections.length} correction(s)${aRelire ? `, ${aRelire} page(s) à relire` : ""}`);
}

async function principal() {
  for (const id of ids) {
    try {
      if (mode === "preparer") {
        const s = await sujet(id);
        await preparer(s, false);
        if (s.corrige || s.correctionUrl) await preparer(s, true);
      } else {
        await publier(id, false);
        await publier(id, true);
      }
    } catch (e) {
      console.error(`✗ ${id} : ${(e as Error).message}`);
    }
  }
}

principal().catch((e) => {
  console.error(e);
  process.exit(1);
});
