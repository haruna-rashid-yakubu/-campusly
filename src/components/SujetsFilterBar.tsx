"use client";

import { useRef, useState, useTransition } from "react";
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
  const [enCours, startTransition] = useTransition();

  /*
   * The results follow the URL, but a search is not a place to go back to:
   * the address is replaced, not pushed (one history step per letter made the
   * back button replay the typing), and the page does not jump to the top.
   * While the new results load, the layout is marked pending: the list dims
   * and the field shows a spinner, instead of the screen being swapped out.
   */
  const pushParams = (mutate: (params: URLSearchParams) => void) => {
    const params = new URLSearchParams(searchParams.toString());
    mutate(params);
    params.delete("n");
    startTransition(() => router.replace(params.size ? `${pathname}?${params.toString()}` : pathname, { scroll: false }));
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
      <div
        data-pending={enCours ? "" : undefined}
        className="mt-3 flex h-12 items-center gap-2.5 rounded-2xl bg-surface-2 px-3.5"
      >
        <span className="grid w-[19px] flex-none place-items-center text-slate-light">
          {enCours ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-light border-t-transparent" aria-label="Recherche en cours" />
          ) : (
            <Icon name="search" size={19} strokeWidth={2} />
          )}
        </span>
        {/* type="search" with the keyboard's "Rechercher" key: Enter only closes the keyboard, it never submits a page. */}
        <input
          type="search"
          inputMode="search"
          enterKeyHint="search"
          autoComplete="off"
          value={q}
          onChange={(e) => onQChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              e.currentTarget.blur();
            }
          }}
          placeholder="Matière ou enseignant"
          className="min-w-0 flex-1 appearance-none border-0 bg-transparent text-[15px] text-ink outline-none [&::-webkit-search-cancel-button]:hidden"
        />
        {q && (
          <button
            type="button"
            aria-label="Effacer la recherche"
            onClick={() => {
              if (debounce.current) clearTimeout(debounce.current);
              setQ("");
              pushParams((params) => params.delete("q"));
            }}
            className="grid h-[30px] w-[30px] flex-none place-items-center rounded-full bg-line-5 text-ink-soft"
          >
            <Icon name="x" size={17} strokeWidth={2.4} />
          </button>
        )}
      </div>
      {/* The fade at the right edge says the row goes on: "Type d'épreuve" was cut off with no hint. */}
      <div className="relative -mx-5 mt-3">
      <div className="no-scrollbar flex gap-2 overflow-x-auto px-5 pb-0.5">
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
        <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-white to-transparent" />
      </div>
    </>
  );
}
