"use client";

import { useState, useTransition } from "react";
import { Icon } from "@/components/icons";
import { adjustRoomStock } from "@/lib/actions";

export function StockControl({ roomTypeId, initialStock }: { roomTypeId: number; initialStock: number }) {
  const [stock, setStock] = useState(initialStock);
  const [pending, startTransition] = useTransition();

  const adjust = (delta: number) => {
    setStock((s) => Math.max(0, s + delta));
    startTransition(async () => {
      await adjustRoomStock(roomTypeId, delta);
    });
  };

  return (
    <div className="flex items-center gap-2.5">
      <button
        disabled={pending || stock === 0}
        onClick={() => adjust(-1)}
        className="press-scale grid h-11 w-11 place-items-center rounded-[13px] border-[1.5px] border-line-2 bg-white disabled:opacity-40 active:bg-surface-2"
        aria-label="Retirer une chambre"
      >
        <Icon name="minus" size={20} strokeWidth={2.2} />
      </button>
      <span className="min-w-[22px] text-center text-[17px] font-extrabold tabular-nums">{stock}</span>
      <button
        disabled={pending}
        onClick={() => adjust(1)}
        className="press-scale grid h-11 w-11 place-items-center rounded-[13px] border-[1.5px] border-teal bg-white text-teal-dark disabled:opacity-40 active:bg-teal-tint"
        aria-label="Ajouter une chambre"
      >
        <Icon name="plus" size={20} strokeWidth={2.2} />
      </button>
    </div>
  );
}
