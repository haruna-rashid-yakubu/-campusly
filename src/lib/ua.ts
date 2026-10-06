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

export type Plateforme = "iPhone" | "Android";

/*
 * Which set of instructions a person needs. Anything that is not an iPhone is
 * told the Android way: on a desktop browser the menu wording is close enough,
 * and guessing wrong there costs nothing, where guessing wrong on a phone
 * sends someone looking for a button that is not on their screen.
 */
export function plateforme(userAgent: string): Plateforme {
  return estIPhone(userAgent) ? "iPhone" : "Android";
}

export function detectInstallTab(userAgent: string): InstallTab {
  if (estNavigateurIntegre(userAgent)) return "Autre";
  if (estIPhone(userAgent)) return "iPhone";
  if (/android/i.test(userAgent)) return "Android";
  return "Android";
}
