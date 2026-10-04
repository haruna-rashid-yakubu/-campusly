export type InstallTab = "Android" | "iPhone" | "Autre";

/*
 * A page opened inside another app — WhatsApp, Facebook, Instagram — rather
 * than in the phone's own browser. This matters because these embedded
 * browsers cannot install anything: the share sheet they show has Copy and
 * Add to Reading List, and no "Add to Home Screen" at all.
 */
export function estNavigateurIntegre(userAgent: string): boolean {
  return /whatsapp|fbav|fban|fb_iab|instagram|line\//i.test(userAgent);
}

export function estIPhone(userAgent: string): boolean {
  return /iphone|ipad|ipod/i.test(userAgent);
}

export function detectInstallTab(userAgent: string): InstallTab {
  if (estNavigateurIntegre(userAgent)) return "Autre";
  if (estIPhone(userAgent)) return "iPhone";
  if (/android/i.test(userAgent)) return "Android";
  return "Android";
}
