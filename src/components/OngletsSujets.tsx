import Link from "next/link";
import { Icon } from "@/components/icons";

/*
 * The two drawers of past papers: the Annales, the lecturers' own papers, and
 * the Entraînement, unseen papers written in their manner (GLOSSARY.md).
 */
export function OngletsSujets({ actif }: { actif: "annales" | "entrainement" }) {
  return (
    <div className="mt-2 flex gap-1 rounded-2xl bg-surface-2 p-1">
      {(
        [
          ["annales", "/sujets", "Annales"],
          ["entrainement", "/entrainement", "Entraînement"],
        ] as const
      ).map(([cle, href, label]) => (
        <Link
          key={cle}
          href={href}
          aria-current={actif === cle ? "page" : undefined}
          className={`flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl text-[14px] font-bold transition-colors ${
            actif === cle ? "bg-white text-ink shadow-sm" : "text-slate hover:text-ink"
          }`}
        >
          {cle === "entrainement" && <Icon name="spark" size={15} strokeWidth={2.2} />}
          {label}
        </Link>
      ))}
    </div>
  );
}
