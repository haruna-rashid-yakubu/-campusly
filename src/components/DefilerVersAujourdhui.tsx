"use client";

import { useEffect } from "react";

// Opens the week on today, so the student lands on the day they came for.
export function DefilerVersAujourdhui() {
  useEffect(() => {
    if (window.location.hash) return;
    document.getElementById("aujourdhui")?.scrollIntoView({ block: "start" });
  }, []);
  return null;
}
