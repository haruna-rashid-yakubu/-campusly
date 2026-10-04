"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Icon } from "@/components/icons";
import { useToast } from "@/components/Toast";
import { proposerProgramme } from "@/lib/actions";

const INPUT =
  "h-[52px] w-full rounded-2xl border-[1.5px] border-line-2 bg-white px-3.5 text-[15px] font-semibold text-ink outline-none focus:border-teal";

export type SemaineOption = { value: string; label: string };

export function ProposerProgrammeForm({
  classes,
  defaultClasse,
  semaines,
}: {
  classes: string[];
  defaultClasse: string;
  semaines: SemaineOption[];
}) {
  const router = useRouter();
  const { show } = useToast();
  const [envoi, startTransition] = useTransition();
  const fichierRef = useRef<HTMLInputElement>(null);

  const [classe, setClasse] = useState(
    classes.includes(defaultClasse) ? defaultClasse : (classes[0] ?? "")
  );
  const [semaine, setSemaine] = useState(semaines[0]?.value ?? "");
  const [note, setNote] = useState("");
  const [fichier, setFichier] = useState<File | null>(null);
  const [apercu, setApercu] = useState<string | null>(null);

  const choisir = (f: File | null) => {
    setFichier(f);
    setApercu((ancien) => {
      if (ancien) URL.revokeObjectURL(ancien);
      return f ? URL.createObjectURL(f) : null;
    });
  };

  const envoyer = () => {
    if (!fichier) {
      show("Ajoute la photo du tableau", "warn");
      return;
    }
    startTransition(async () => {
      try {
        const data = new FormData();
        data.append("classeLabel", classe);
        data.append("semaine", semaine);
        data.append("note", note);
        data.append("file", fichier);
        await proposerProgramme(data);
        show("Envoyé — ton délégué va le publier");
        router.push("/programme");
        router.refresh();
      } catch (e) {
        show(e instanceof Error ? e.message : "Envoi impossible", "warn");
      }
    });
  };

  return (
    <div className="px-5 pb-12 pt-2">
      <p className="mb-5 text-[14.5px] leading-relaxed text-slate">
        Photographie la feuille affichée au tableau. Le délégué de la promo la met en ligne, et
        tout le monde l&rsquo;a sur son téléphone.
      </p>

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

      <label className="mb-1.5 block text-[13px] font-bold text-ink-soft">Semaine</label>
      <select
        value={semaine}
        onChange={(e) => setSemaine(e.target.value)}
        className={`${INPUT} mb-3.5`}
      >
        {semaines.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>

      <div className="mb-1.5 text-[13px] font-bold text-ink-soft">Photo du tableau</div>
      {apercu ? (
        <div className="mb-3 overflow-hidden rounded-[18px] border border-line">
          <span className="relative block aspect-[4/3] w-full">
            <Image src={apercu} alt="" fill unoptimized className="object-cover" />
          </span>
          <button
            onClick={() => fichierRef.current?.click()}
            className="h-[46px] w-full border-t border-line text-[14px] font-bold text-slate-light active:bg-surface-2"
          >
            Reprendre la photo
          </button>
        </div>
      ) : (
        <button
          onClick={() => fichierRef.current?.click()}
          className="mb-3 flex h-[120px] w-full flex-col items-center justify-center gap-2 rounded-[18px] border-[1.5px] border-dashed border-teal-border bg-teal-tint-soft text-teal-dark active:bg-teal-tint"
        >
          <Icon name="cal" size={26} strokeWidth={1.8} />
          <span className="text-[14.5px] font-bold">Prendre la photo</span>
        </button>
      )}
      <input
        ref={fichierRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => choisir(e.target.files?.[0] ?? null)}
      />

      <label className="mb-1.5 mt-2 block text-[13px] font-bold text-ink-soft">
        Un mot <span className="font-semibold text-slate-light">· facultatif</span>
      </label>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
        placeholder="La salle du mardi a changé."
        className="mb-5 w-full rounded-2xl border-[1.5px] border-line-2 bg-white p-3.5 text-[15px] font-semibold text-ink outline-none focus:border-teal"
      />

      <button
        onClick={envoyer}
        disabled={envoi}
        className="press-scale h-[54px] w-full rounded-2xl bg-teal text-[15.5px] font-bold text-white disabled:opacity-60 active:bg-teal-press"
      >
        {envoi ? "Envoi…" : "Envoyer au délégué"}
      </button>
    </div>
  );
}
