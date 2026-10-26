"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

/*
 * The shop's square logo, faded into the sticky header once its big header
 * has scrolled away: the student still sees whose menu they are in, and the
 * menu keeps the room.
 */
export function LogoQuandDefile({ cible, logo, nom }: { cible: string; logo: string | null; nom: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = document.getElementById(cible);
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => setVisible(!e.isIntersecting), { rootMargin: "-80px 0px 0px 0px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, [cible]);

  if (!logo) return null;
  return (
    <span
      aria-hidden
      className={`block h-9 w-9 overflow-hidden rounded-[11px] transition-all duration-[var(--duree-court)] ease-[var(--courbe)] ${
        visible ? "scale-100 opacity-100" : "scale-75 opacity-0"
      }`}
      title={nom}
    >
      <Image src={logo} alt="" width={36} height={36} className="h-9 w-9 object-cover" />
    </span>
  );
}
