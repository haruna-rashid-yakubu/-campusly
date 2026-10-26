"use client";

import { useEffect, useState } from "react";
import { articlesSauves } from "@/lib/panier-client";

// "Panier en cours" on a shop's card, when a basket is waiting on this phone.
export function PucePanier({ vendeurId }: { vendeurId: number }) {
  const [nb, setNb] = useState(0);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNb(articlesSauves(vendeurId));
  }, [vendeurId]);
  if (nb === 0) return null;
  return (
    <span className="mt-1.5 inline-flex rounded-full bg-teal-tint px-2.5 py-0.5 text-[12px] font-extrabold text-teal-active">
      Panier en cours · {nb} article{nb > 1 ? "s" : ""}
    </span>
  );
}
