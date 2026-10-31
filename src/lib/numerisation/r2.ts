import { AwsClient } from "aws4fetch";

/*
 * The private R2 bucket the papers live in. Nothing in it is public: the site
 * reads it here and serves files through /api/fichiers, which marks them.
 * aws4fetch signs plain fetch calls, so this runs the same on the server and in
 * a local script.
 */
function client() {
  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET } = process.env;
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET) {
    throw new Error("R2 n'est pas configuré (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET).");
  }
  return {
    aws: new AwsClient({ accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY, service: "s3", region: "auto" }),
    base: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET}`,
  };
}

const chemin = (cle: string) => cle.split("/").map(encodeURIComponent).join("/");

export async function deposer(cle: string, contenu: Uint8Array | string, type: string) {
  const { aws, base } = client();
  const res = await aws.fetch(`${base}/${chemin(cle)}`, {
    method: "PUT",
    body: typeof contenu === "string" ? contenu : Buffer.from(contenu),
    headers: { "Content-Type": type },
  });
  if (!res.ok) throw new Error(`R2 a refusé ${cle} (${res.status})`);
}

/** The object's bytes, or null when it does not exist. */
export async function lire(cle: string): Promise<Uint8Array | null> {
  const { aws, base } = client();
  const res = await aws.fetch(`${base}/${chemin(cle)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`R2 n'a pas pu lire ${cle} (${res.status})`);
  return new Uint8Array(await res.arrayBuffer());
}

/** The object's bytes and the type it was stored with, or null when it does not exist. */
export async function lireAvecType(cle: string): Promise<{ octets: Uint8Array; type: string } | null> {
  const { aws, base } = client();
  const res = await aws.fetch(`${base}/${chemin(cle)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`R2 n'a pas pu lire ${cle} (${res.status})`);
  return { octets: new Uint8Array(await res.arrayBuffer()), type: res.headers.get("content-type") ?? "application/octet-stream" };
}

export async function supprimer(cle: string) {
  const { aws, base } = client();
  const res = await aws.fetch(`${base}/${chemin(cle)}`, { method: "DELETE" });
  if (!res.ok && res.status !== 404) throw new Error(`R2 n'a pas pu supprimer ${cle} (${res.status})`);
}

// Where each file of a paper lives. `c` is the Corrigé's prefix.
export const cles = {
  original: (id: number, nom: string, corrige = false) => `originaux/sujets/${id}/${corrige ? "corrige-" : ""}${nom}`,
  originale: (id: number, corrige = false) => `sujets/${id}/${corrige ? "corrige-" : ""}originale.pdf`,
  reconstituee: (id: number, corrige = false) => `sujets/${id}/${corrige ? "corrige-" : ""}reconstituee.pdf`,
  extraction: (id: number, corrige = false) => `sujets/${id}/${corrige ? "corrige-" : ""}extraction.json`,
  // A cleaned page photograph or a cropped figure, shown on the Sujet page.
  image: (id: number, nom: string) => `sujets/${id}/images/${nom}`,
  // The Corrigé IA (GLOSSARY.md): its PDF, its text for the page, and the list of the Sujets that have one.
  corrigeIa: (id: number) => `sujets/${id}/corrige-ia.pdf`,
  corrigeIaTexte: (id: number) => `sujets/${id}/corrige-ia.json`,
  indexCorrigesIa: "corriges-ia/index.json",
  // The Sujets d'entraînement (GLOSSARY.md): the lecturers and their papers, then each paper's PDFs and texts.
  indexEntrainement: "entrainement/index.json",
  entrainementPdf: (slug: string, n: number, corrige = false) => `entrainement/${slug}/${n}/${corrige ? "corrige" : "sujet"}.pdf`,
  entrainementTextes: (slug: string, n: number) => `entrainement/${slug}/${n}/textes.json`,
};
