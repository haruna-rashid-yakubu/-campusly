import { APP_URL } from "@/lib/constants";
import { deposer, lireAvecType, supprimer } from "@/lib/numerisation/r2";

/*
 * The files people send — a paper's photos, a timetable, a cité's façade —
 * kept in the R2 bucket under envois/, where Vercel Blob used to hold them.
 * /fichiers/<clé> serves them at an address that, as on the blob store,
 * cannot be guessed.
 */

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024; // 25 MB
export const TYPES_ACCEPTES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

const PREFIXE = "envois/";
const CHEMIN_PUBLIC = "/fichiers/";

/** The address a file is served at, which is also what the rows store. */
export function urlEnvoi(cle: string) {
  return new URL(CHEMIN_PUBLIC + cle.split("/").map(encodeURIComponent).join("/"), APP_URL).toString();
}

/** The key behind one of this app's addresses, or null for anything else: a URL from a browser proves nothing. */
export function cleEnvoi(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.protocol !== "https:" || u.host !== new URL(APP_URL).host || !u.pathname.startsWith(CHEMIN_PUBLIC)) return null;
    const cle = decodeURIComponent(u.pathname.slice(CHEMIN_PUBLIC.length));
    return cle.startsWith(PREFIXE) && !cle.includes("..") ? cle : null;
  } catch {
    return null;
  }
}

export const estLienEnvoi = (url: string) => cleEnvoi(url) !== null;

export async function uploadFile(file: File, folder: string) {
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("Fichier trop lourd (25 Mo max). Compresse-le avant d'envoyer.");
  }
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const cle = `${PREFIXE}${folder}/${Date.now()}-${crypto.randomUUID().slice(0, 12)}-${safeName}`;
  await deposer(cle, new Uint8Array(await file.arrayBuffer()), file.type || "application/octet-stream");
  return { url: urlEnvoi(cle), name: file.name };
}

/** The file behind one of this app's addresses, or null. */
export async function lireEnvoi(url: string) {
  const cle = cleEnvoi(url);
  return cle ? lireAvecType(cle) : null;
}

// Deleting the row is what the admin asked for; losing the file afterwards is
// housekeeping. Never let a storage hiccup surface as a failed deletion.
export async function deleteFile(url: string) {
  const cle = cleEnvoi(url);
  if (!cle) return;
  try {
    await supprimer(cle);
  } catch {
    // orphaned file — harmless, and the row is already gone
  }
}
