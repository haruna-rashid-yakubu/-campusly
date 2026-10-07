/*
 * Reports an action from the browser, without ever making it wait.
 *
 * `sendBeacon` hands the request to the browser, which delivers it even once
 * the page is gone — the case this exists for, since the tap that reports a
 * landlord contact is the tap that leaves for WhatsApp. `fetch` with
 * `keepalive` is the same promise for the browsers that lack it.
 *
 * Nothing is returned and nothing is awaited: the caller's next line opens
 * WhatsApp. A lost count is the acceptable failure here.
 */

export type Evenement = {
  type: "contact_bailleur" | "partage";
  cible: "cite" | "app";
  cibleId?: number | null;
  canal?: "statut" | "systeme" | "whatsapp" | "copie";
};

export function compter(evenement: Evenement) {
  if (typeof navigator === "undefined") return;

  const corps = JSON.stringify(evenement);

  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([corps], { type: "application/json" });
      if (navigator.sendBeacon("/api/compteur", blob)) return;
    }
    void fetch("/api/compteur", {
      method: "POST",
      body: corps,
      headers: { "Content-Type": "application/json" },
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* tant pis pour le compteur */
  }
}
