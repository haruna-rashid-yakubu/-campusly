"use client";

import { useEffect } from "react";
import { resyncPush } from "@/lib/push-client";

const RESYNC_KEY = "campusly:notif-resync";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});

    /*
     * Devices that switched notifications on before ever picking a promo are
     * stamped with nothing, and nothing in the app would ever ask them again:
     * the stamp is only written when notifications are enabled or the classe
     * changes, and these students have no reason to do either. They would go
     * on receiving silence. One resync per session repairs them on their next
     * visit without anyone touching anything.
     */
    try {
      if (sessionStorage.getItem(RESYNC_KEY) === "1") return;
      sessionStorage.setItem(RESYNC_KEY, "1");
    } catch {
      // Private mode throws on storage; resyncing every load is harmless.
    }
    void resyncPush();
  }, []);
  return null;
}
