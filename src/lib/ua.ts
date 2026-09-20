export type InstallTab = "Android" | "iPhone" | "Autre";

export function detectInstallTab(userAgent: string): InstallTab {
  const ua = userAgent.toLowerCase();
  const inAppBrowser = /whatsapp|fbav|fban|instagram|line\//.test(ua);
  if (inAppBrowser) return "Autre";
  if (/iphone|ipad|ipod/.test(ua)) return "iPhone";
  if (/android/.test(ua)) return "Android";
  return "Android";
}
