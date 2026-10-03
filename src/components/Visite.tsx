"use client";

import { useEffect } from "react";
import { enregistrerVisite } from "@/lib/actions";

/*
 * Fires once when the shell mounts — that is, once per time the app is
 * opened, not on every tab switch, since client navigations do not remount
 * the layout. "How many people opened Campusly today" is the question; page
 * views would be a different and less useful number.
 */
export function Visite() {
  useEffect(() => {
    void enregistrerVisite();
  }, []);
  return null;
}
