"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";
import { useToast } from "@/components/Toast";
import { nommerDelegue, retirerDelegue, viderDelegues } from "@/lib/actions";

const INPUT =
  "h-[52px] w-full rounded-2xl border-[1.5px] border-line-2 bg-white px-3.5 text-[15px] font-semibold text-ink outline-none focus:border-teal";

export type DelegueRow = {
  id: number;
  email: string;
  classeLabel: string;
  nommePar: string | null;
};

export function DelegueForm({
  classes,
  delegues,
}: {
  classes: string[];
  delegues: DelegueRow[];
}) {
  const router = useRouter();
  const { show } = useToast();
  const [envoi, startTransition] = useTransition();

  const [email, setEmail] = useState("");
  const [classe, setClasse] = useState(classes[0] ?? "");
  const [forcer, setForcer] = useState(false);
  const [finAnnee, setFinAnnee] = useState(false);

  const ajouter = () => {
    startTransition(async () => {
      try {
        await nommerDelegue({ email, classeLabel: classe, forcer });
        show(`${email.trim().toLowerCase()} est délégué de ${classe}`);
        setEmail("");
        setForcer(false);
        router.refresh();
      } catch (e) {
        show(e instanceof Error ? e.message : "Impossible de nommer ce délégué", "warn");
      }
    });
  };

  const retirer = (d: DelegueRow) => {
    startTransition(async () => {
      try {
        await retirerDelegue(d.id);
        show(`${d.email} n'est plus délégué de ${d.classeLabel}`);
        router.refresh();
      } catch (e) {
        show(e instanceof Error ? e.message : "Retrait impossible", "warn");
      }
    });
  };

  const toutRetirer = () => {
    startTransition(async () => {
      try {
        await viderDelegues();
        show("Tous les délégués ont été retirés");
        setFinAnnee(false);
        router.refresh();
      } catch (e) {
        show(e instanceof Error ? e.message : "Action impossible", "warn");
      }
    });
  };

  return (
    <>
      <div className="rounded-[20px] border border-line p-4">
        <div className="mb-3.5 text-[16px] font-extrabold tracking-tight">Nommer un délégué</div>

        <label className="mb-1.5 block text-[13px] font-bold text-ink-soft">
          Adresse Google{" "}
          <span className="font-semibold text-slate-light">· celle de son compte</span>
        </label>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          inputMode="email"
          autoCapitalize="off"
          autoCorrect="off"
          placeholder="prenom.nom@gmail.com"
          className={`${INPUT} mb-3.5`}
        />

        <label className="mb-1.5 block text-[13px] font-bold text-ink-soft">Promo</label>
        <select
          value={classe}
          onChange={(e) => setClasse(e.target.value)}
          className={`${INPUT} mb-3.5`}
        >
          {classes.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        {/* Breaking the one-promo rule has to be said out loud, never inferred. */}
        <label className="mb-4 flex items-center gap-2.5 text-[13.5px] font-semibold text-ink-soft">
          <input
            type="checkbox"
            checked={forcer}
            onChange={(e) => setForcer(e.target.checked)}
            className="h-[18px] w-[18px] accent-teal"
          />
          Autoriser deux promos pour cette personne
        </label>

        <button
          onClick={ajouter}
          disabled={envoi || !email.trim()}
          className="press-scale h-[54px] w-full rounded-2xl bg-teal text-[15.5px] font-bold text-white disabled:opacity-60 active:bg-teal-press"
        >
          {envoi ? "Enregistrement…" : "Nommer"}
        </button>

        <p className="mt-3 text-[12.5px] leading-snug text-slate-light">
          Le droit attend l&rsquo;adresse : la personne peut être nommée avant d&rsquo;avoir jamais
          ouvert Campusly, et le trouvera à sa première connexion.
        </p>
      </div>

      <div className="mb-2 mt-6 text-base font-extrabold">
        {delegues.length} délégué{delegues.length > 1 ? "s" : ""}
      </div>
      {delegues.length === 0 ? (
        <p className="text-[13.5px] text-slate-light">Personne pour l&rsquo;instant.</p>
      ) : (
        delegues.map((d) => (
          <div
            key={d.id}
            className="flex items-center gap-3 border-t border-line-3 py-3"
          >
            <span className="grid h-[38px] w-[38px] flex-none place-items-center rounded-full bg-teal-tint text-[14px] font-extrabold text-teal-dark">
              {d.email[0]?.toUpperCase() ?? "?"}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[14.5px] font-bold">{d.email}</span>
              <span className="mt-0.5 block truncate text-[12.5px] text-slate-light">
                {d.classeLabel}
                {d.nommePar ? ` · nommé par ${d.nommePar}` : ""}
              </span>
            </span>
            <button
              onClick={() => retirer(d)}
              disabled={envoi}
              aria-label={`Retirer ${d.email}`}
              className="grid h-9 w-9 flex-none place-items-center rounded-xl text-slate-light active:bg-surface-2"
            >
              <Icon name="x" size={17} strokeWidth={2.2} />
            </button>
          </div>
        ))
      )}

      {/* Délégués are elected for a year. Twelve removals in June is how half
          of them stay in place for a second year by accident. */}
      {delegues.length > 0 && (
        <div className="mt-7 rounded-[18px] border border-line-3 bg-surface-2 p-4">
          <div className="text-[14.5px] font-extrabold">Fin d&rsquo;année</div>
          <p className="mt-1 text-[13px] leading-snug text-slate-light">
            Retire les {delegues.length} délégués d&rsquo;un coup. Les emplois du temps et les
            annales déjà publiés ne bougent pas.
          </p>
          {finAnnee ? (
            <div className="mt-3 flex gap-2">
              <button
                onClick={toutRetirer}
                disabled={envoi}
                className="h-[46px] flex-1 rounded-[13px] bg-danger text-[14px] font-bold text-white disabled:opacity-60"
              >
                Oui, retirer les {delegues.length}
              </button>
              <button
                onClick={() => setFinAnnee(false)}
                disabled={envoi}
                className="h-[46px] px-4 text-[14px] font-bold text-slate-light"
              >
                Annuler
              </button>
            </div>
          ) : (
            <button
              onClick={() => setFinAnnee(true)}
              className="mt-3 h-[46px] w-full rounded-[13px] border-[1.5px] border-line-2 bg-white text-[14px] font-bold text-slate-light active:bg-surface-3"
            >
              Retirer tous les délégués
            </button>
          )}
        </div>
      )}
    </>
  );
}
