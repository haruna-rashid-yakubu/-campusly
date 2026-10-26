"use client";

import { useEffect, useRef, useState } from "react";

/*
 * A basket kept on the phone, per shop. Leaving the page to check the
 * timetable, or the browser dropping the tab while WhatsApp is open, used to
 * empty it; now it is there when the student comes back.
 *
 * Read after the first render only: the server knows nothing of
 * localStorage, and reading it during render would make the two disagree.
 */
const cle = (vendeurId: number) => `campusly:panier:${vendeurId}`;
const CLE_CONFIRMATION = "campusly:commande-envoyee";

type Sauve<T> = { data: T; nb: number; at: number };

// A basket older than this is from another day's hunger.
const DUREE_MS = 3 * 24 * 3600_000;

export function usePanierSauve<T>(
  vendeurId: number,
  vide: T,
  // Drops what no longer exists or is sold out, from a basket read back.
  nettoyer: (t: T) => T,
  compter: (t: T) => number
) {
  const [valeur, setValeur] = useState<T>(vide);
  const pret = useRef(false);

  useEffect(() => {
    try {
      const brut = localStorage.getItem(cle(vendeurId));
      if (brut) {
        const s = JSON.parse(brut) as Sauve<T>;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (Date.now() - s.at < DUREE_MS) setValeur(nettoyer(s.data));
      }
    } catch {
      // Unreadable or private mode: start empty.
    }
    pret.current = true;
    // Read once per shop; `nettoyer` is recreated every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendeurId]);

  useEffect(() => {
    if (!pret.current) return;
    try {
      const nb = compter(valeur);
      if (nb === 0) localStorage.removeItem(cle(vendeurId));
      else localStorage.setItem(cle(vendeurId), JSON.stringify({ data: valeur, nb, at: Date.now() } satisfies Sauve<T>));
    } catch {
      // Full or private mode: the basket simply is not kept.
    }
  }, [valeur, vendeurId, compter]);

  return [valeur, setValeur] as const;
}

/** Items in the saved basket of a shop, for the "panier en cours" chip; 0 when none. */
export function articlesSauves(vendeurId: number) {
  try {
    const brut = localStorage.getItem(cle(vendeurId));
    if (!brut) return 0;
    const s = JSON.parse(brut) as Sauve<unknown>;
    return Date.now() - s.at < DUREE_MS ? s.nb : 0;
  } catch {
    return 0;
  }
}

export type CommandeEnvoyee = {
  vendeurId: number;
  vendeurNom: string;
  reference: string;
  url: string;
  total: number;
  lignes: string[];
};

/*
 * The order just handed to WhatsApp, kept for the tab so the page can say
 * "sent" when the student comes back to it — whether the browser kept the page
 * alive, restored it, or loaded it again.
 */
export function memoriserCommande(c: CommandeEnvoyee) {
  try {
    sessionStorage.setItem(CLE_CONFIRMATION, JSON.stringify(c));
  } catch {
    // The confirmation is a courtesy; WhatsApp still opens.
  }
  window.dispatchEvent(new Event("campusly:commande"));
}

export function lireCommande(vendeurId: number): CommandeEnvoyee | null {
  try {
    const c = JSON.parse(sessionStorage.getItem(CLE_CONFIRMATION) ?? "null") as CommandeEnvoyee | null;
    return c && c.vendeurId === vendeurId ? c : null;
  } catch {
    return null;
  }
}

export function oublierCommande() {
  try {
    sessionStorage.removeItem(CLE_CONFIRMATION);
  } catch {
    // ignore
  }
}
