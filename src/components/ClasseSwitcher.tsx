"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sheet } from "@/components/Sheet";
import { Icon } from "@/components/icons";
import { setClasse } from "@/lib/actions";
import { resyncPush } from "@/lib/push-client";
import { filiereDeClasse } from "@/lib/utils";

/** "BME · L2" -> "L2". Falls back to the whole label if there is no separator. */
function niveauDeClasse(label: string) {
  const parts = label.split("·");
  return (parts[1] ?? parts[0] ?? "").trim();
}

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
  const [open, setOpen] = useState(false);
  // The filière the student is already in opens first, so the sheet lands on
  // where they are rather than on a list they have to search.
  const [deplie, setDeplie] = useState<string | null>(() => filiereDeClasse(value));

  /*
   * Grouped by filière instead of listed flat. Three filières already make
   * nine rows, and every promo added makes three more — a flat list stops
   * being readable long before the campus is fully covered.
   */
  const filieres = useMemo(() => {
    const groupes = new Map<string, string[]>();
    for (const classe of classes) {
      const nom = filiereDeClasse(classe);
      groupes.set(nom, [...(groupes.get(nom) ?? []), classe]);
    }
    return [...groupes.entries()].map(([nom, labels]) => ({ nom, labels }));
  }, [classes]);

  const select = (v: string) => {
    setOpen(false);
    startTransition(async () => {
      await setClasse(v);
      // The subscription carries the promo it was created with, and only the
      // browser can hand it back. Without this, a signed-out device that picks
      // its classe after switching notifications on keeps the old stamp and
      // never hears about its own programme.
      await resyncPush();
      router.refresh();
    });
  };

  return (
    <>
      {variant === "pill" ? (
        <button
          onClick={() => setOpen(true)}
          className="press-scale mt-2 flex h-[34px] items-center gap-1.5 rounded-[11px] bg-surface px-3 text-[13.5px] font-bold text-ink-soft"
        >
          {value}
          <Icon name="chevD" size={16} strokeWidth={2} />
        </button>
      ) : (
        <button
          onClick={() => setOpen(true)}
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
      )}

      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title="Choisis ta classe"
        subtitle="On mémorise ton choix pour le programme."
      >
        {filieres.map(({ nom, labels }) => {
          const ouvert = deplie === nom;
          const actif = filiereDeClasse(value) === nom;

          // A filière with a single promo has nothing to unfold: making
          // someone tap twice to reach the only option is just friction.
          if (labels.length === 1) {
            const seul = labels[0];
            return (
              <button
                key={nom}
                onClick={() => select(seul)}
                className="flex min-h-[54px] w-full items-center border-0 border-b border-line-3 bg-transparent px-1 text-[15.5px] active:bg-surface-2"
                style={{ fontWeight: value === seul ? 800 : 600, color: value === seul ? "#0A7F77" : "#0F172A" }}
              >
                <span className="flex-1 text-left">{seul}</span>
                {value === seul && <Icon name="check" size={19} strokeWidth={2.4} />}
              </button>
            );
          }

          return (
            <div key={nom} className="border-b border-line-3">
              <button
                onClick={() => setDeplie(ouvert ? null : nom)}
                aria-expanded={ouvert}
                className="flex min-h-[54px] w-full items-center bg-transparent px-1 text-[15.5px] active:bg-surface-2"
                style={{ fontWeight: actif ? 800 : 600, color: actif ? "#0A7F77" : "#0F172A" }}
              >
                <span className="flex-1 text-left">{nom}</span>
                <span className="mr-1 text-[12.5px] font-semibold text-slate-light">
                  {actif ? niveauDeClasse(value) : `${labels.length} niveaux`}
                </span>
                <span
                  className="transition-transform"
                  style={{ transform: ouvert ? "rotate(180deg)" : "none" }}
                >
                  <Icon name="chevD" size={18} strokeWidth={2.2} />
                </span>
              </button>

              {ouvert && (
                <div className="anim-fade pb-1.5">
                  {labels.map((label) => (
                    <button
                      key={label}
                      onClick={() => select(label)}
                      className="flex min-h-[48px] w-full items-center rounded-[12px] bg-transparent pl-4 pr-1 text-[15px] active:bg-surface-2"
                      style={{
                        fontWeight: value === label ? 800 : 500,
                        color: value === label ? "#0A7F77" : "#0F172A",
                      }}
                    >
                      <span className="flex-1 text-left">{niveauDeClasse(label)}</span>
                      {value === label && <Icon name="check" size={18} strokeWidth={2.4} />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </Sheet>
    </>
  );
}
