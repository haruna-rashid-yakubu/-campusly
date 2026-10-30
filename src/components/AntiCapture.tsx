"use client";

import { useEffect } from "react";

/*
 * Screenshots, made as unrewarding as a web page can make them.
 *
 * A browser cannot stop the phone or the computer from capturing its screen —
 * that happens outside it. What it can do: hide the page the moment it stops
 * being looked at (an app switcher's snapshot, a snipping tool that takes the
 * focus), hide it on the shortcuts that start a capture, refuse to print
 * and refuse to copy.
 *
 * The hiding is a blur on <html>, lifted as soon as the page has the focus
 * again; fields keep copy and paste.
 */
const MASQUE = "cy-masque";

function champ(cible: EventTarget | null) {
  return cible instanceof HTMLElement && !!cible.closest("input, textarea, [contenteditable=true]");
}

export function AntiCapture() {
  useEffect(() => {
    const racine = document.documentElement;
    let minuterie: ReturnType<typeof setTimeout> | null = null;
    const masquer = (pendant?: number) => {
      racine.classList.add(MASQUE);
      if (minuterie) clearTimeout(minuterie);
      minuterie = pendant ? setTimeout(() => document.hasFocus() && racine.classList.remove(MASQUE), pendant) : null;
    };
    const montrer = () => {
      if (minuterie) clearTimeout(minuterie);
      racine.classList.remove(MASQUE);
    };

    const touche = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      // Print Screen; Win+Shift+S; Cmd+Shift+3/4/5 (the modifiers arrive before the system takes the shot).
      if (k === "printscreen" || (e.shiftKey && (e.metaKey || e.ctrlKey))) {
        masquer(2500);
        if (k === "printscreen") void navigator.clipboard?.writeText("").catch(() => {});
      }
      // Print, save, and the developer tools' view-source.
      if ((e.metaKey || e.ctrlKey) && (k === "p" || k === "s" || (k === "u" && !e.shiftKey))) e.preventDefault();
    };
    const toucheRelachee = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "printscreen") {
        void navigator.clipboard?.writeText("").catch(() => {});
        masquer(2500);
      }
    };
    const visibilite = () => (document.hidden ? masquer() : montrer());
    const sansCopie = (e: Event) => {
      if (!champ(e.target)) e.preventDefault();
    };
    const avantImpression = () => masquer();
    const perdu = () => masquer();

    window.addEventListener("keydown", touche, true);
    window.addEventListener("keyup", toucheRelachee, true);
    window.addEventListener("blur", perdu);
    window.addEventListener("focus", montrer);
    window.addEventListener("pageshow", montrer);
    window.addEventListener("beforeprint", avantImpression);
    document.addEventListener("visibilitychange", visibilite);
    for (const t of ["copy", "cut", "contextmenu", "dragstart", "selectstart"]) document.addEventListener(t, sansCopie);
    return () => {
      window.removeEventListener("keydown", touche, true);
      window.removeEventListener("keyup", toucheRelachee, true);
      window.removeEventListener("blur", perdu);
      window.removeEventListener("focus", montrer);
      window.removeEventListener("pageshow", montrer);
      window.removeEventListener("beforeprint", avantImpression);
      document.removeEventListener("visibilitychange", visibilite);
      for (const t of ["copy", "cut", "contextmenu", "dragstart", "selectstart"]) document.removeEventListener(t, sansCopie);
    };
  }, []);
  return null;
}
