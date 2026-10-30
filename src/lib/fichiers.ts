import { APP_URL } from "@/lib/constants";

/*
 * A past paper is never handed out at the address it is stored at. Every
 * screen, and the mobile API, points at /api/fichiers instead, which serves
 * the digitised Version reconstituée (or, with ?o=1, the Version originale)
 * and marks the PDF on its way out with an invisible code that says which
 * paper it was and which account took it.
 *
 * `jeton` (lib/jeton) is the signed-in reader's: the link then works where no
 * session travels with it, the app's in-app browser.
 */
export function lienFichier(subjectId: number, url: string | null, correction = false, jeton?: string): string | null {
  if (!url) return url;
  const nom = `${(url.split("/").pop() ?? "sujet").replace(/-[A-Za-z0-9]{20,}(?=\.\w+$)/, "").replace(/\.\w+$/, "")}.pdf`;
  const params = new URLSearchParams();
  if (correction) params.set("c", "1");
  if (jeton) params.set("t", jeton);
  const requete = params.toString();
  return `${APP_URL}/api/fichiers/${subjectId}/${encodeURIComponent(nom)}${requete ? `?${requete}` : ""}`;
}

/** A Sujet's Corrigé IA (GLOSSARY.md), through the same route and the same mark as its PDF. */
export function lienCorrigeIa(subjectId: number, jeton?: string) {
  return `${APP_URL}/api/fichiers/${subjectId}/corrige-ia.pdf?ia=1${jeton ? `&t=${encodeURIComponent(jeton)}` : ""}`;
}

/** The same paper as photographed: the reference to check the reconstituted text against. */
export function lienOriginal(url: string) {
  return `${url}${url.includes("?") ? "&" : "?"}o=1`;
}

/* A paper as screens and the API may show it: the stored addresses replaced. */
export function masquerFichiers<T extends { id: number; fileUrl: string | null; correctionUrl: string | null }>(
  s: T,
  jeton?: string
): T {
  return { ...s, fileUrl: lienFichier(s.id, s.fileUrl, false, jeton), correctionUrl: lienFichier(s.id, s.correctionUrl, true, jeton) };
}
