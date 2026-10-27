import { APP_URL } from "@/lib/constants";

/*
 * A past paper is never handed out at the address it is stored at. Every
 * screen, and the mobile API, points at /api/fichiers instead, which marks the
 * PDF on its way out with an invisible code that says which paper it was
 * and, for a download, which phone took it. A catalogue copied wholesale then
 * carries its own proof.
 *
 * Only PDFs go through it: a photo is shown as stored.
 */
export function lienFichier(subjectId: number, url: string | null, correction = false): string | null {
  if (!url || !/\.pdf$/i.test(url)) return url;
  const nom = url.split("/").pop()!.replace(/-[A-Za-z0-9]{20,}(?=\.pdf$)/, "");
  return `${APP_URL}/api/fichiers/${subjectId}/${encodeURIComponent(nom)}${correction ? "?c=1" : ""}`;
}

/* A paper as screens and the API may show it: the stored addresses replaced. */
export function masquerFichiers<T extends { id: number; fileUrl: string | null; correctionUrl: string | null }>(s: T): T {
  return { ...s, fileUrl: lienFichier(s.id, s.fileUrl), correctionUrl: lienFichier(s.id, s.correctionUrl, true) };
}

/* The preview is fetched by Google's viewer, with no cookie: one cached copy serves everyone. */
export function lienApercu(url: string) {
  if (!url.includes("/api/fichiers/")) return url;
  return `${url}${url.includes("?") ? "&" : "?"}v=1`;
}
