"use client";

import { useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Chip } from "@/components/Chip";
import { PickerButton } from "@/components/PickerButton";
import { Icon } from "@/components/icons";
import { SUBJECT_FILTER_LABELS } from "@/lib/constants";

const RESET_LABEL: Record<string, string> = {
  filiere: "Toutes",
  niveau: "Tous",
  annee: "Toutes",
  type: "Tous",
  enseignant: "Tous",
};

/*
 * "toutes" rather than an absent parameter, because absent already means
 * something else here: a facet can arrive with a default (the student's own
 * filière), so removing the parameter would put the default back instead of
 * clearing it. The sentinel is what lets someone actually look outside their
 * own filière.
 */
const ALL = "toutes";

export function SujetsFilterBar({
  facets,
  defaults,
}: {
  facets: Record<string, string[]>;
  defaults?: Record<string, string>;
}) {
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
          placeholder="Matière ou enseignant"
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
        {Object.entries(facets)
          // A facet with no values (no paper carries an enseignant yet) would
          // render a chip that opens an empty picker.
          .filter(([, options]) => options.length > 0)
          .map(([key, options]) => {
            const fallback = defaults?.[key];
            const raw = searchParams.get(key);
            const current = raw ?? fallback ?? "";
            const cleared = raw === ALL;
            // Clearing a facet that has a default must be written down, not
            // deleted, or the default silently reapplies on the next render.
            const resetValue = fallback ? ALL : "";
            return (
              <PickerButton
                key={key}
                title={SUBJECT_FILTER_LABELS[key]}
                value={cleared ? "" : current}
                options={[
                  { label: RESET_LABEL[key], value: resetValue },
                  ...options.map((o) => ({ label: o, value: o })),
                ]}
                onSelect={(v) =>
                  pushParams((params) => (v ? params.set(key, v) : params.delete(key)))
                }
                trigger={(open) => (
                  <Chip
                    label={cleared || !current ? SUBJECT_FILTER_LABELS[key] : current}
                    active={!cleared && !!current}
                    onClick={open}
                  />
                )}
              />
            );
          })}
      </div>
    </>
  );
}
