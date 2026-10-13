"use client";

import { useEffect, useRef, useState } from "react";

/*
 * Plays by itself, muted and looping, like a shop window — except for a
 * student who has asked their phone to save data. A clip that downloads on
 * its own is exactly what that setting is for, so they get the still image
 * and a play button instead, and decide.
 */
export function VideoVendeur({ src, poster }: { src: string; poster?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [economie, setEconomie] = useState(false);

  useEffect(() => {
    const connexion = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } })
      .connection;
    const lent = connexion?.saveData || connexion?.effectiveType === "2g" || connexion?.effectiveType === "slow-2g";
    if (lent) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEconomie(true);
      return;
    }
    void ref.current?.play().catch(() => {});
  }, []);

  return (
    <video
      ref={ref}
      src={src}
      poster={poster}
      muted
      loop
      playsInline
      preload={economie ? "none" : "metadata"}
      controls={economie}
      className="mt-3 aspect-video w-full rounded-[20px] bg-surface object-cover"
    />
  );
}
