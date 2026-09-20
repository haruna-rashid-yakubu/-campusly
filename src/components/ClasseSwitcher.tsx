"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { PickerButton } from "@/components/PickerButton";
import { Icon } from "@/components/icons";
import { setClasse } from "@/lib/actions";

export function ClasseSwitcher({
  value,
  classes,
  variant = "pill",
}: {
  value: string;
  classes: string[];
  variant?: "pill" | "field";
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const select = (v: string) => {
    startTransition(async () => {
      await setClasse(v);
      router.refresh();
    });
  };

  return (
    <PickerButton
      title="Choisis ta classe"
      subtitle="On mémorise ton choix pour le programme."
      options={classes.map((c) => ({ label: c, value: c }))}
      value={value}
      onSelect={select}
      trigger={(open) =>
        variant === "pill" ? (
          <button
            onClick={open}
            className="press-scale mt-2 flex h-[34px] items-center gap-1.5 rounded-[11px] bg-surface px-3 text-[13.5px] font-bold text-ink-soft"
          >
            {value}
            <Icon name="chevD" size={16} strokeWidth={2} />
          </button>
        ) : (
          <button
            onClick={open}
            className="flex h-[52px] w-full items-center justify-between rounded-2xl border-[1.5px] border-line-2 bg-white px-3.5 font-semibold active:border-teal"
          >
            <span className="flex items-center gap-2.5">
              <span className="text-teal-dark">
                <Icon name="cap" size={20} />
              </span>
              <span className="text-[15px]">{value}</span>
            </span>
            <Icon name="chevD" size={18} strokeWidth={2} />
          </button>
        )
      }
    />
  );
}
