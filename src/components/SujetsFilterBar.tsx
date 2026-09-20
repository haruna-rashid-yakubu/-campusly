"use client";

import { useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Chip } from "@/components/Chip";
import { PickerButton } from "@/components/PickerButton";
import { Icon } from "@/components/icons";
import { SUBJECT_FILTER_FACETS, SUBJECT_FILTER_LABELS } from "@/lib/constants";

const RESET_LABEL: Record<string, string> = {
  filiere: "Toutes",
  niveau: "Tous",
  annee: "Toutes",
  type: "Tous",
};

export function SujetsFilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(() => searchParams.get("q") ?? "");
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pushParams = (mutate: (params: URLSearchParams) => void) => {
    const params = new URLSearchParams(searchParams.toString());
    mutate(params);
    router.push(params.size ? `${pathname}?${params.toString()}` : pathname);
  };

  const onQChange = (value: string) => {
    setQ(value);
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => {
      pushParams((params) => (value ? params.set("q", value) : params.delete("q")));
    }, 300);
  };

  return (
    <>
      <div className="mt-3 flex h-12 items-center gap-2.5 rounded-2xl bg-surface-2 px-3.5">
        <span className="flex-none text-slate-light">
          <Icon name="search" size={19} strokeWidth={2} />
        </span>
        <input
          value={q}
          onChange={(e) => onQChange(e.target.value)}
          placeholder="Chercher une matière"
          className="min-w-0 flex-1 border-0 bg-transparent text-[15px] text-ink outline-none"
        />
        {q && (
          <button
            onClick={() => {
              setQ("");
              pushParams((params) => params.delete("q"));
            }}
            className="grid h-[30px] w-[30px] flex-none place-items-center rounded-full bg-line-5 text-ink-soft"
          >
            <Icon name="x" size={17} strokeWidth={2.4} />
          </button>
        )}
      </div>
      <div className="no-scrollbar -mx-5 mt-3 flex gap-2 overflow-x-auto px-5 pb-0.5">
        {Object.entries(SUBJECT_FILTER_FACETS).map(([key, options]) => {
          const current = searchParams.get(key) ?? "";
          return (
            <PickerButton
              key={key}
              title={SUBJECT_FILTER_LABELS[key]}
              value={current}
              options={[
                { label: RESET_LABEL[key], value: "" },
                ...options.map((o) => ({ label: o, value: o })),
              ]}
              onSelect={(v) => pushParams((params) => (v ? params.set(key, v) : params.delete(key)))}
              trigger={(open) => (
                <Chip label={current || SUBJECT_FILTER_LABELS[key]} active={!!current} onClick={open} />
              )}
            />
          );
        })}
      </div>
    </>
  );
}
