/*
 * Deletes the public copies of digitised Sujets from Vercel Blob.
 *
 * A Sujet's file was first stored on a public blob, at an address that never
 * expires: anyone who saw it once keeps it. Since the digitisation, the file
 * route serves the Sujet from the private R2 bucket, where the original is
 * archived too, and the blob is only a leak. It is deleted here, Sujet by
 * Sujet, and only once R2 holds the archived original, the Version
 * reconstituée and the proofread extraction for it.
 *
 * The row keeps its fileUrl: it still says that the Sujet has a file, which
 * the site and the API rely on.
 *
 *   npx tsx scripts/purger-blob.ts            dry run: says what it would delete
 *   npx tsx scripts/purger-blob.ts --supprimer
 *
 * Needs DATABASE_URL and BLOB_READ_WRITE_TOKEN (vercel env pull) besides R2's.
 */
import { config } from "dotenv";

config({ path: process.env.ENV_FILE ?? ".env.local", quiet: true });

async function principal() {
  const { del, head } = await import("@vercel/blob");
  const { db } = await import("../src/db");
  const { subjects } = await import("../src/db/schema");
  const { cles, lire } = await import("../src/lib/numerisation/r2");
  const supprimer = process.argv.includes("--supprimer");

  const estBlob = (url: string | null): url is string => !!url && new URL(url).hostname.endsWith(".public.blob.vercel-storage.com");
  const present = async (cle: string) => ((await lire(cle))?.byteLength ?? 0) > 1000;

  const lignes = await db.select({ id: subjects.id, fileUrl: subjects.fileUrl, correctionUrl: subjects.correctionUrl }).from(subjects);
  let effaces = 0;
  const gardes: string[] = [];

  for (const s of lignes) {
    for (const [url, corrige] of [[s.fileUrl, false], [s.correctionUrl, true]] as const) {
      if (!estBlob(url)) continue;
      const nom = corrige ? "corrige.pdf" : "sujet.pdf";
      const archive = await present(cles.original(s.id, nom, corrige));
      const reconstituee = await present(cles.reconstituee(s.id, corrige));
      const extraction = await present(cles.extraction(s.id, corrige));
      if (!archive || !reconstituee || !extraction) {
        gardes.push(`${s.id}${corrige ? " (corrigé)" : ""} : ${[!archive && "original", !reconstituee && "reconstituée", !extraction && "extraction"].filter(Boolean).join(", ")} absent de R2`);
        continue;
      }
      const existe = await head(url).then(() => true, () => false);
      if (!existe) continue;
      if (supprimer) await del(url);
      effaces++;
    }
  }

  console.log(`${supprimer ? "Supprimés" : "À supprimer (simulation)"} : ${effaces}`);
  if (gardes.length) console.log(`Gardés, faute de copie complète dans R2 :\n  ${gardes.join("\n  ")}`);
}

principal().catch((e) => {
  console.error(e);
  process.exit(1);
});
