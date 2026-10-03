"use client";

import { useEffect } from "react";
import { enregistrerVisite } from "@/lib/actions";

/** True when the app was opened from the home screen rather than a browser tab. */
function depuisEcranDAccueil() {
  if (typeof window === "undefined") return false;
  try {
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      // iOS answers through a non-standard flag of its own.
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true
    );
  } catch {
    return false;
  }
}

/*
 * Fires once when the shell mounts — that is, once per time the app is
 * opened, not on every tab switch, since client navigations do not remount
 * the layout. "How many people opened Campusly today" is the question; page
 * views would be a different and less useful number.
 *
 * Only the browser knows whether it is running installed, so the answer has
 * to travel with the visit.
 */
export function Visite() {
  useEffect(() => {
    void enregistrerVisite(depuisEcranDAccueil());
  }, []);
  return null;
}
