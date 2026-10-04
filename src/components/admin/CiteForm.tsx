"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Icon } from "@/components/icons";
import { useToast } from "@/components/Toast";
import { creerCite, televerserPhotoCite, type ChambreInput } from "@/lib/actions";

const INPUT =
  "h-[52px] w-full rounded-2xl border-[1.5px] border-line-2 bg-white px-3.5 text-[15px] font-semibold text-ink outline-none focus:border-teal";

const TYPES = ["Chambre simple", "Chambre moderne", "Studio", "Appartement"];

const CHAMBRE_VIDE: ChambreInput = { type: "", surface: "", prixMensuel: 0, stock: 0 };

/** "7" minutes on foot at roughly 80 m/min, which is how students describe it. */
function metresDepuisMinutes(minutes: number) {
  return Math.round(minutes * 80);
}

export function CiteForm() {
  const router = useRouter();
  const { show } = useToast();
  const [ouvert, setOuvert] = useState(false);
  const [envoi, startTransition] = useTransition();
  const fichierRef = useRef<HTMLInputElement>(null);

  const [nom, setNom] = useState("");
  const [quartier, setQuartier] = useState("");
  const [minutes, setMinutes] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [envoiPhoto, setEnvoiPhoto] = useState(false);
  const [chambres, setChambres] = useState<ChambreInput[]>([{ ...CHAMBRE_VIDE }]);

  const setChambre = (i: number, next: Partial<ChambreInput>) =>
    setChambres((cs) => cs.map((c, j) => (j === i ? { ...c, ...next } : c)));

  /*
   * Photos go up one at a time, as they are picked, rather than riding along
   * with the form. Several photos straight off a phone make a post heavy
   * enough to time out on a campus connection, and losing the whole cité
   * because the fourth picture stalled would be the worst moment to fail.
   */
  const ajouterPhotos = async (files: FileList | null) => {
    if (!files?.length) return;
    setEnvoiPhoto(true);
    for (const file of Array.from(files)) {
      try {
        const data = new FormData();
        data.append("file", file);
        const url = await televerserPhotoCite(data);
        setPhotos((p) => [...p, url]);
      } catch {
        show(`Photo « ${file.name} » refusée`, "warn");
      }
    }
    setEnvoiPhoto(false);
    if (fichierRef.current) fichierRef.current.value = "";
  };

  const enregistrer = () => {
    const mn = Number(minutes);
    if (!nom.trim() || !quartier.trim()) {
      show("Le nom et le quartier sont obligatoires", "warn");
      return;
    }
    if (!Number.isFinite(mn) || mn <= 0) {
      show("Indique la distance en minutes à pied", "warn");
      return;
    }
    if (!chambres.some((c) => c.type.trim() && c.prixMensuel > 0)) {
      show("Ajoute au moins un type de chambre avec son prix", "warn");
      return;
    }

    startTransition(async () => {
      try {
        await creerCite({
          nom,
          quartier,
          distanceM: metresDepuisMinutes(mn),
          description,
          whatsapp,
          photos,
          chambres,
        });
        show(`${nom.trim()} ajoutée`);
        setNom("");
        setQuartier("");
        setMinutes("");
        setWhatsapp("");
        setDescription("");
        setPhotos([]);
        setChambres([{ ...CHAMBRE_VIDE }]);
        setOuvert(false);
        router.refresh();
      } catch (e) {
        show(e instanceof Error ? e.message : "Enregistrement impossible", "warn");
      }
    });
  };

  if (!ouvert) {
    return (
      <button
        onClick={() => setOuvert(true)}
        className="press-scale flex h-[54px] w-full items-center justify-center gap-2.5 rounded-2xl border-[1.5px] border-dashed border-teal-border bg-teal-tint-soft text-[15px] font-bold text-teal-dark active:bg-teal-tint"
      >
        <Icon name="plus" size={19} strokeWidth={2.2} />
        Ajouter une cité
      </button>
    );
  }

  return (
    <div className="rounded-[20px] border border-line p-4">
      <div className="mb-3.5 flex items-center justify-between">
        <div className="text-[16px] font-extrabold tracking-tight">Nouvelle cité</div>
        <button
          onClick={() => setOuvert(false)}
          className="text-[13.5px] font-bold text-slate-light"
          disabled={envoi}
        >
          Annuler
        </button>
      </div>

      <label className="mb-1.5 block text-[13px] font-bold text-ink-soft">Nom</label>
      <input
        value={nom}
        onChange={(e) => setNom(e.target.value)}
        placeholder="Cité Mbog Abang"
        className={`${INPUT} mb-3.5`}
      />

      <label className="mb-1.5 block text-[13px] font-bold text-ink-soft">Quartier</label>
      <input
        value={quartier}
        onChange={(e) => setQuartier(e.target.value)}
        placeholder="Nkolbisson"
        className={`${INPUT} mb-3.5`}
      />

      <label className="mb-1.5 block text-[13px] font-bold text-ink-soft">
        Distance du campus <span className="font-semibold text-slate-light">· à pied</span>
      </label>
      <div className="mb-3.5 flex items-center gap-2.5">
        <input
          value={minutes}
          onChange={(e) => setMinutes(e.target.value.replace(/[^0-9]/g, ""))}
          inputMode="numeric"
          placeholder="7"
          className={`${INPUT} flex-1`}
        />
        <span className="text-[14px] font-semibold text-slate-light">minutes</span>
      </div>

      <label className="mb-1.5 block text-[13px] font-bold text-ink-soft">
        WhatsApp du bailleur{" "}
        <span className="font-semibold text-slate-light">· sans lui, personne ne peut appeler</span>
      </label>
      <input
        value={whatsapp}
        onChange={(e) => setWhatsapp(e.target.value)}
        inputMode="tel"
        placeholder="237680000000"
        className={`${INPUT} mb-3.5`}
      />

      <label className="mb-1.5 block text-[13px] font-bold text-ink-soft">
        Description <span className="font-semibold text-slate-light">· facultatif</span>
      </label>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={3}
        placeholder="Eau de forage, courant, cuisine commune, portail fermé la nuit."
        className="mb-4 w-full rounded-2xl border-[1.5px] border-line-2 bg-white p-3.5 text-[15px] font-semibold text-ink outline-none focus:border-teal"
      />

      <div className="mb-1.5 text-[13px] font-bold text-ink-soft">
        Photos <span className="font-semibold text-slate-light">· facultatif</span>
      </div>
      {photos.length > 0 && (
        <div className="mb-2.5 flex flex-wrap gap-2">
          {photos.map((url) => (
            <span key={url} className="relative h-[66px] w-[66px] overflow-hidden rounded-[13px]">
              <Image src={url} alt="" fill className="object-cover" />
              <button
                onClick={() => setPhotos((p) => p.filter((u) => u !== url))}
                className="absolute right-0 top-0 grid h-6 w-6 place-items-center bg-ink/70 text-white"
                aria-label="Retirer cette photo"
              >
                <Icon name="x" size={14} strokeWidth={2.4} />
              </button>
            </span>
          ))}
        </div>
      )}
      <button
        onClick={() => fichierRef.current?.click()}
        disabled={envoiPhoto}
        className="mb-4 flex h-[46px] w-full items-center justify-center gap-2 rounded-[13px] border-[1.5px] border-line-2 bg-white text-[14px] font-bold text-ink-soft disabled:opacity-60 active:bg-surface-2"
      >
        <Icon name="plus" size={17} strokeWidth={2.2} />
        {envoiPhoto ? "Envoi…" : "Ajouter des photos"}
      </button>
      <input
        ref={fichierRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => ajouterPhotos(e.target.files)}
      />

      <div className="mb-2 border-t border-line-3 pt-3.5 text-[13px] font-bold text-ink-soft">
        Types de chambre
      </div>
      {chambres.map((c, i) => (
        <div key={i} className="mb-2.5 rounded-[16px] bg-surface-2 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[12.5px] font-bold text-slate-light">Type {i + 1}</span>
            {chambres.length > 1 && (
              <button
                onClick={() => setChambres((cs) => cs.filter((_, j) => j !== i))}
                className="text-[12.5px] font-bold text-slate-light"
              >
                Retirer
              </button>
            )}
          </div>
          <input
            value={c.type}
            onChange={(e) => setChambre(i, { type: e.target.value })}
            placeholder="Chambre simple"
            list="types-chambre"
            className={`${INPUT} mb-2`}
          />
          <div className="flex gap-2">
            <input
              value={c.surface}
              onChange={(e) => setChambre(i, { surface: e.target.value })}
              placeholder="9 m²"
              className={`${INPUT} flex-1`}
            />
            <input
              value={c.prixMensuel || ""}
              onChange={(e) =>
                setChambre(i, { prixMensuel: Number(e.target.value.replace(/[^0-9]/g, "")) || 0 })
              }
              inputMode="numeric"
              placeholder="25000 F"
              className={`${INPUT} flex-1`}
            />
            <input
              value={c.stock || ""}
              onChange={(e) =>
                setChambre(i, { stock: Number(e.target.value.replace(/[^0-9]/g, "")) || 0 })
              }
              inputMode="numeric"
              placeholder="libres"
              className={`${INPUT} w-[86px]`}
            />
          </div>
        </div>
      ))}
      <datalist id="types-chambre">
        {TYPES.map((t) => (
          <option key={t} value={t} />
        ))}
      </datalist>

      <button
        onClick={() => setChambres((cs) => [...cs, { ...CHAMBRE_VIDE }])}
        className="mb-4 flex h-[46px] w-full items-center justify-center gap-2 rounded-[13px] border-[1.5px] border-dashed border-line-2 text-[14px] font-bold text-slate-light active:bg-surface-2"
      >
        <Icon name="plus" size={17} strokeWidth={2.2} />
        Un autre type
      </button>

      <button
        onClick={enregistrer}
        disabled={envoi || envoiPhoto}
        className="press-scale h-[54px] w-full rounded-2xl bg-teal text-[15.5px] font-bold text-white disabled:opacity-60 active:bg-teal-press"
      >
        {envoi ? "Enregistrement…" : "Publier la cité"}
      </button>
    </div>
  );
}
