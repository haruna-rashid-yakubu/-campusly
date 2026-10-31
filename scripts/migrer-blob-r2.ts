/*
 * Moves every file still on Vercel Blob to R2 (lib/envois) and points the
 * rows at its new address: the photos of the cités, the papers students
 * proposed, the Sujets' files, the timetable photos.
 *
 * Each file is copied before its row changes, so a run cut short leaves
 * nothing pointing at a missing file; run again, it picks up where it stopped.
 * A blob already gone (a Sujet's copy deleted once it was digitised) is
 * pointed at R2 all the same: the row only says that the Sujet has a file, and
 * the file route serves the digitised versions first.
 *
 *   npx tsx scripts/migrer-blob-r2.ts            dry run: says what it would do
 *   npx tsx scripts/migrer-blob-r2.ts --ecrire
 *
 * R2's keys come from .env.local; DATABASE_URL from the file named by ENV_FILE
 * (vercel env pull), deleted afterwards.
 */
import { config } from "dotenv";

config({ path: [".env.local", ...(process.env.ENV_FILE ? [process.env.ENV_FILE] : [])], quiet: true });

const estBlob = (url: string) => {
  try {
    return new URL(url).hostname.endsWith(".blob.vercel-storage.com");
  } catch {
    return false;
  }
};

async function principal() {
  const { eq } = await import("drizzle-orm");
  const { db } = await import("../src/db");
  const { cites, programmePublications, subjectSubmissions, subjects } = await import("../src/db/schema");
  const { deposer } = await import("../src/lib/numerisation/r2");
  const { urlEnvoi } = await import("../src/lib/envois");
  const ecrire = process.argv.includes("--ecrire");
  const bilan = { copies: 0, absents: 0, lignes: 0 };

  /** The new address of one blob, copied first when it still exists. */
  async function deplacer(url: string) {
    const cle = "envois/" + decodeURIComponent(new URL(url).pathname.slice(1));
    const res = await fetch(url);
    if (res.ok) {
      if (ecrire) await deposer(cle, new Uint8Array(await res.arrayBuffer()), res.headers.get("content-type") ?? "application/octet-stream");
      bilan.copies += 1;
    } else {
      console.log(`  absent (${res.status}) : ${cle}`);
      bilan.absents += 1;
    }
    return urlEnvoi(cle);
  }

  for (const ligne of await db.select({ id: subjects.id, fileUrl: subjects.fileUrl, correctionUrl: subjects.correctionUrl }).from(subjects)) {
    const champs: { fileUrl?: string; correctionUrl?: string } = {};
    if (ligne.fileUrl && estBlob(ligne.fileUrl)) champs.fileUrl = await deplacer(ligne.fileUrl);
    if (ligne.correctionUrl && estBlob(ligne.correctionUrl)) champs.correctionUrl = await deplacer(ligne.correctionUrl);
    if (!Object.keys(champs).length) continue;
    if (ecrire) await db.update(subjects).set(champs).where(eq(subjects.id, ligne.id));
    bilan.lignes += 1;
  }

  for (const ligne of await db.select({ id: subjectSubmissions.id, fileUrl: subjectSubmissions.fileUrl }).from(subjectSubmissions)) {
    if (!ligne.fileUrl || !estBlob(ligne.fileUrl)) continue;
    const fileUrl = await deplacer(ligne.fileUrl);
    if (ecrire) await db.update(subjectSubmissions).set({ fileUrl }).where(eq(subjectSubmissions.id, ligne.id));
    bilan.lignes += 1;
  }

  for (const ligne of await db.select({ id: programmePublications.id, photoUrl: programmePublications.photoUrl }).from(programmePublications)) {
    if (!ligne.photoUrl || !estBlob(ligne.photoUrl)) continue;
    const photoUrl = await deplacer(ligne.photoUrl);
    if (ecrire) await db.update(programmePublications).set({ photoUrl }).where(eq(programmePublications.id, ligne.id));
    bilan.lignes += 1;
  }

  for (const ligne of await db.select({ id: cites.id, photos: cites.photos }).from(cites)) {
    if (!ligne.photos.some(estBlob)) continue;
    const photos: string[] = [];
    for (const p of ligne.photos) photos.push(estBlob(p) ? await deplacer(p) : p);
    if (ecrire) await db.update(cites).set({ photos }).where(eq(cites.id, ligne.id));
    bilan.lignes += 1;
  }

  console.log(`${ecrire ? "Fait" : "À faire (essai)"} : ${bilan.copies} fichier(s) copiés, ${bilan.absents} déjà absents, ${bilan.lignes} ligne(s).`);
  process.exit(0);
}

principal().catch((e) => {
  console.error(e);
  process.exit(1);
});
