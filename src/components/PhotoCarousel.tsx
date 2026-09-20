"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/icons";

export function PhotoCarousel({
  photos,
  alt,
  backHref,
  shareButton,
}: {
  photos: string[];
  alt: string;
  backHref: string;
  shareButton: React.ReactNode;
}) {
  const [index, setIndex] = useState(0);
  const total = Math.max(photos.length, 1);

  return (
    <div className="relative grid h-[300px] place-items-center bg-line-3 text-[13px] font-semibold text-slate-light">
      {photos[index] ? (
        <Image src={photos[index]} alt={alt} fill className="object-cover" />
      ) : (
        `photo ${index + 1} / ${total}`
      )}

      <div className="absolute inset-x-4 flex justify-between" style={{ top: "calc(50px + var(--safe-top))" }}>
        <Link
          href={backHref}
          className="press-scale grid h-[42px] w-[42px] place-items-center rounded-full bg-white/95 shadow-md"
          aria-label="Retour"
        >
          <Icon name="back" size={20} strokeWidth={2} />
        </Link>
        {shareButton}
      </div>

      {photos.length > 1 && (
        <>
          <button
            onClick={() => setIndex((i) => (i - 1 + photos.length) % photos.length)}
            className="absolute left-2.5 top-[150px] grid h-[38px] w-[38px] place-items-center rounded-full bg-white/85"
            aria-label="Photo précédente"
          >
            <Icon name="back" size={18} strokeWidth={2} />
          </button>
          <button
            onClick={() => setIndex((i) => (i + 1) % photos.length)}
            className="absolute right-2.5 top-[150px] grid h-[38px] w-[38px] place-items-center rounded-full bg-white/85"
            aria-label="Photo suivante"
          >
            <Icon name="right" size={18} strokeWidth={2} />
          </button>
          <div className="absolute inset-x-0 bottom-3.5 flex justify-center gap-1.5">
            {photos.map((_, i) => (
              <span
                key={i}
                className="h-1.5 rounded-full bg-white transition-[width]"
                style={{ width: i === index ? 20 : 6, opacity: i === index ? 1 : 0.6 }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
