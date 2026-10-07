"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";
import { Icon } from "@/components/icons";
import { setClasse } from "@/lib/actions";
import { resyncPush } from "@/lib/push-client";
import { estUnLienPartage, hasTabBar, neDependPasDeLaPromo } from "@/lib/nav";
import { filiereDeClasse } from "@/lib/utils";

/** "BME · L2" -> "L2". Falls back to the whole label if there is no separator. */
function niveauDeClasse(label: string) {
  const parts = label.split("·");
  return (parts[1] ?? parts[0] ?? "").trim();
}

/*
 * The first screen a new device sees, and the only one it cannot walk past.
 *
 * Choosing a promo used to be optional, and the numbers said what that costs:
 * of 39 devices in a day, 36 had never chosen. They were all being shown the
 * default promo's programme — somebody else's timetable — and they left. The
 * two who had chosen opened the app seventeen times each.
 *
 * So it is a screen rather than a prompt: no close button, nothing to dismiss,
 * one tap on a filière and one on a niveau. It carries the launch screen's
 * mark and wording on purpose — from the reader's side this is still the app
 * starting, not something interrupting it.
 *
 * The page underneath is still rendered and still in the HTML, which keeps
 * shared links and crawlers seeing real content rather than this.
 */
export function ChoixClasseRequis({ classes }: { classes: string[] }) {
  const pathname = usePathname();
  const router = useRouter();
  const [enCours, startTransition] = useTransition();
  const [deplie, setDeplie] = useState<string | null>(null);
  const [choisi, setChoisi] = useState<string | null>(null);

  const filieres = useMemo(() => {
    const groupes = new Map<string, string[]>();
    for (const classe of classes) {
      const nom = filiereDeClasse(classe);
      groupes.set(nom, [...(groupes.get(nom) ?? []), classe]);
    }
    return [...groupes.entries()].map(([nom, labels]) => ({ nom, labels }));
  }, [classes]);

  /*
   * Admin, the install guide and the fullscreen viewers are not the main app
   * surface, and someone sent straight to one of them has a reason to be
   * there that a promo question would only get in the way of.
   *
   * A link to one precise paper or cité is let through for the same reason,
   * and it is the one that matters most: those links are how the app spreads.
   * Someone opens "here is last year's stats paper" from a group chat, and a
   * wall before the paper is a wall at the exact moment they wanted it. They
   * get what they came for; the question waits until they look around, which
   * is when it starts being worth answering.
   */
  const affiche =
    hasTabBar(pathname) &&
    !estUnLienPartage(pathname) &&
    !neDependPasDeLaPromo(pathname) &&
    classes.length > 0;

  useEffect(() => {
    if (!affiche) return;
    const precedent = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = precedent;
    };
  }, [affiche]);

  if (!affiche) return null;

  const select = (label: string) => {
    setChoisi(label);
    startTransition(async () => {
      await setClasse(label);
      // Switched notifications on before getting here — a device coming from
      // the install guide can have — and the stamp is still empty.
      await resyncPush();
      router.refresh();
    });
  };

  /*
   * z-25 sits above the tab bar and the offline toast but below the offline
   * overlay: choosing a promo posts to the server, so being told the
   * connection is gone has to win over being asked.
   */
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="choix-classe-titre"
      className="anim-fade fixed inset-0 z-[25] overflow-y-auto bg-white"
      style={{
        paddingTop: "calc(32px + var(--safe-top))",
        paddingBottom: "calc(28px + var(--safe-bottom))",
      }}
    >
      <div className="mx-auto w-full max-w-[460px] px-6">
        <span className="mx-auto block w-fit">
          <Logo size={60} />
        </span>
        <h1
          id="choix-classe-titre"
          className="mt-4 text-center text-[24px] font-extrabold tracking-tight"
        >
          Tu es en quelle classe&nbsp;?
        </h1>
        <p className="mx-auto mt-1.5 max-w-[320px] text-center text-[14.5px] leading-snug text-slate-light">
          Pour te montrer ton programme et les sujets de ta promo, et pas ceux des autres.
        </p>

        <div className="mt-6">
          {filieres.map(({ nom, labels }) => {
            const ouvert = deplie === nom;

            if (labels.length === 1) {
              const seul = labels[0];
              return (
                <button
                  key={nom}
                  disabled={enCours}
                  onClick={() => select(seul)}
                  className="flex min-h-[58px] w-full items-center border-0 border-b border-line-3 bg-transparent px-1 text-[16px] font-semibold active:bg-surface-2 disabled:opacity-50"
                >
                  <span className="flex-1 text-left">{seul}</span>
                  {choisi === seul && enCours && (
                    <span className="anim-skeleton h-1 w-8 rounded-full bg-line-3" aria-hidden />
                  )}
                </button>
              );
            }

            return (
              <div key={nom} className="border-b border-line-3">
                <button
                  disabled={enCours}
                  onClick={() => setDeplie(ouvert ? null : nom)}
                  aria-expanded={ouvert}
                  className="flex min-h-[58px] w-full items-center bg-transparent px-1 text-[16px] font-semibold active:bg-surface-2 disabled:opacity-50"
                >
                  <span className="flex-1 text-left">{nom}</span>
                  <span className="mr-1 text-[12.5px] font-semibold text-slate-light">
                    {labels.length} niveaux
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
                        disabled={enCours}
                        onClick={() => select(label)}
                        className="flex min-h-[50px] w-full items-center rounded-[12px] bg-transparent pl-4 pr-1 text-[15.5px] active:bg-surface-2 disabled:opacity-50"
                        style={{ fontWeight: choisi === label ? 800 : 500 }}
                      >
                        <span className="flex-1 text-left">{niveauDeClasse(label)}</span>
                        {choisi === label && enCours && (
                          <span
                            className="anim-skeleton h-1 w-8 rounded-full bg-line-3"
                            aria-hidden
                          />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <p className="mt-6 text-center text-[12.5px] leading-snug text-slate-light">
          Tu pourras en changer à tout moment depuis l&rsquo;écran Programme.
        </p>
      </div>
    </div>
  );
}
