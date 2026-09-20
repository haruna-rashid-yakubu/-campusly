"use client";

import { useState } from "react";
import Image from "next/image";
import { Icon } from "@/components/icons";

export function ZoomViewer({ url }: { url: string }) {
  const [zoom, setZoom] = useState(1);

  return (
    <>
      <div className="flex h-full w-full items-center justify-center overflow-auto">
        <div
          className="relative transition-[width,height] duration-200"
          style={{ width: `${320 * zoom}px`, height: `${440 * zoom}px`, maxWidth: "94vw" }}
        >
          <Image src={url} alt="Document en plein écran" fill className="object-contain" />
        </div>
      </div>
      <div className="fixed inset-x-0 bottom-10 flex justify-center gap-2.5">
        <button
          onClick={() => setZoom((z) => Math.max(1, z - 0.25))}
          className="press-scale grid h-12 w-12 place-items-center rounded-full bg-white/15 text-white"
          aria-label="Réduire"
        >
          <Icon name="minus" size={20} strokeWidth={2.2} />
        </button>
        <button
          onClick={() => setZoom((z) => Math.min(2, z + 0.25))}
          className="press-scale grid h-12 w-12 place-items-center rounded-full bg-white/15 text-white"
          aria-label="Agrandir"
        >
          <Icon name="plus" size={20} strokeWidth={2.2} />
        </button>
      </div>
    </>
  );
}
