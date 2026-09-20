"use client";

import { useState } from "react";
import { Sheet, SheetOption } from "@/components/Sheet";

export type PickerOption = { label: string; value: string };

export function PickerButton({
  trigger,
  title,
  subtitle,
  options,
  value,
  onSelect,
}: {
  trigger: (open: () => void) => React.ReactNode;
  title: string;
  subtitle?: string;
  options: PickerOption[];
  value?: string | null;
  onSelect: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      {trigger(() => setOpen(true))}
      <Sheet open={open} onClose={() => setOpen(false)} title={title} subtitle={subtitle}>
        {options.map((o) => (
          <SheetOption
            key={o.value}
            label={o.label}
            selected={value === o.value}
            onClick={() => {
              onSelect(o.value);
              setOpen(false);
            }}
          />
        ))}
      </Sheet>
    </>
  );
}
