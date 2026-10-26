"use client";

import { useState, useTransition } from "react";
import { useToast } from "@/components/Toast";
import { enregistrerProfil } from "@/lib/actions";

/*
 * What the student told the app at onboarding, editable. Saved on the device
 * and, when signed in, on the account — the same action as the welcome flow.
 */
export function ProfilForm({
  prenom: prenomInitial,
  nom: nomInitial,
  telephone: telInitial,
}: {
  prenom: string | null;
  nom: string | null;
  telephone: string | null;
}) {
  const [prenom, setPrenom] = useState(prenomInitial ?? "");
  const [nom, setNom] = useState(nomInitial ?? "");
  // Shown without the country code the field already carries.
  const [telephone, setTelephone] = useState(telInitial?.replace(/^237/, "") ?? "");
  const [enCours, startTransition] = useTransition();
  const { show } = useToast();

  const champ =
    "mt-1.5 h-[52px] w-full rounded-2xl border-[1.5px] border-line-4 bg-white px-4 text-[16px] font-semibold outline-none focus:border-teal";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const p = await enregistrerProfil({ prenom, nom, telephone });
          if (telephone.trim() && !p.telephone) show("Numéro WhatsApp incomplet : 9 chiffres, commençant par 6", "warn");
          else show("Profil enregistré");
        });
      }}
      className="space-y-4"
    >
      <label className="block text-[13.5px] font-bold text-ink-soft">
        Prénom
        <input value={prenom} onChange={(e) => setPrenom(e.target.value)} maxLength={60} autoComplete="given-name" className={champ} />
      </label>
      <label className="block text-[13.5px] font-bold text-ink-soft">
        Nom
        <input value={nom} onChange={(e) => setNom(e.target.value)} maxLength={60} autoComplete="family-name" className={champ} />
      </label>
      <label className="block text-[13.5px] font-bold text-ink-soft">
        WhatsApp
        <div className="mt-1.5 flex gap-2">
          <span className="flex h-[52px] items-center rounded-2xl bg-surface px-4 text-[16px] font-bold text-ink-soft">+237</span>
          <input
            type="tel"
            inputMode="tel"
            value={telephone}
            onChange={(e) => setTelephone(e.target.value)}
            placeholder="6 90 00 00 00"
            autoComplete="tel-national"
            className={champ.replace("mt-1.5 ", "")}
          />
        </div>
        <span className="mt-1 block text-[12.5px] font-medium text-slate">
          Pour que le vendeur ou le pressing te recontacte, rien d&rsquo;autre.
        </span>
      </label>
      <button
        type="submit"
        disabled={enCours}
        className="press-scale flex h-[54px] w-full items-center justify-center rounded-2xl bg-teal text-[16px] font-bold text-white active:bg-teal-press disabled:opacity-60"
      >
        Enregistrer
      </button>
    </form>
  );
}
