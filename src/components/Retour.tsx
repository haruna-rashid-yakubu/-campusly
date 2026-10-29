"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

/*
 * "Back" and "close" go back in history, never forward to a new copy of the
 * page before. A link to the previous page pushes an entry, and the browser's
 * own back then returns to the screen that was just left: open a paper full
 * screen, close it, press back, and the full screen is open again, forever.
 *
 * History only holds Campusly's previous page when the visit has moved within
 * the app since it was opened. Arriving from a shared link or a notification,
 * back would leave the site, so the screen's own parent replaces this one
 * instead. Counted here, in memory: a full reload starts again from zero,
 * which is when it should.
 */
let pages = 0;

export function SuiviNavigation() {
  const chemin = usePathname();
  useEffect(() => {
    pages++;
  }, [chemin]);
  return null;
}

export function useRetour() {
  const router = useRouter();
  return (parent = "/") => (pages > 1 ? router.back() : router.replace(parent));
}
