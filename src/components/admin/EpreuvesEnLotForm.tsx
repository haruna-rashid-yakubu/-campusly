"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";
import { useToast } from "@/components/Toast";
import { publierEpreuves } from "@/lib/actions";

const INPUT =
  "h-[52px] w-full rounded-2xl border-[1.5px] border-line-2 bg-white px-3.5 text-[15px] font-semibold text-ink outline-none focus:border-teal";
const PETIT =
  "h-[46px] w-full rounded-[13px] border-[1.5px] border-line-2 bg-white px-3 text-[14.5px] font-semibold text-ink outline-none focus:border-teal";

type Ligne = { fichier: File; matiere: string; annee: string; type: string };

export function EpreuvesEnLotForm({
  classes,
  defaultClasse,
  types,
  matieres,
  annees,
}: {
  classes: string[];
  defaultClasse: string;
  types: readonly string[];
  matieres: string[];
  annees: string[];
}) {
  const router = useRouter();
  const { show } = useToast();
  const [envoi, startTransition] = useTransition();
  const fichierRef = useRef<HTMLInputElement>(null);

  const [classe, setClasse] = useState(
    classes.includes(defaultClasse) ? defaultClasse : (classes[0] ?? "")
  );
  const [annee, setAnnee] = useState(annees[0] ?? String(new Date().getFullYear()));
  const [type, setType] = useState(types[0] ?? "Examen");
  const [enseignant, setEnseignant] = useState("");
  const [lignes, setLignes] = useState<Ligne[]>([]);

  /*
   * A file keeps the values that were on screen when it was added, so changing
   * the shared année afterwards does not silently rewrite sheets already
   * labelled — but "Appliquer à toutes" is there for when that is the point.
   */
  const ajouter = (fichiers: FileList | null) => {
    if (!fichiers?.length) return;
    setLignes((anciennes) => [
      ...anciennes,
      ...Array.from(fichiers).map((fichier) => ({
        fichier,
        matiere: "",
        annee,
        type,
      })),
    ]);
  };

  const modifier = (i: number, champ: keyof Omit<Ligne, "fichier">, valeur: string) =>
    setLignes((l) => l.map((ligne, j) => (j === i ? { ...ligne, [champ]: valeur } : ligne)));

  const retirer = (i: number) => setLignes((l) => l.filter((_, j) => j !== i));

  const appliquerATous = () =>
    setLignes((l) => l.map((ligne) => ({ ...ligne, annee, type })));

  const envoyer = () => {
    const sansMatiere = lignes.filter((l) => !l.matiere.trim()).length;
    if (sansMatiere > 0) {
      show(`${sansMatiere} épreuve${sansMatiere > 1 ? "s" : ""} sans matière`, "warn");
      return;
    }
    startTransition(async () => {
      try {
        const data = new FormData();
        data.set("classeLabel", classe);
        data.set(
          "epreuves",
          JSON.stringify(
            lignes.map((l) => ({
              matiere: l.matiere,
              annee: l.annee,
              type: l.type,
              enseignant,
            }))
          )
        );
        lignes.forEach((l, i) => data.set(`fichier-${i}`, l.fichier));

        const r = await publierEpreuves(data);
        if (!r.ok) {
          show(r.message, "warn");
          return;
        }
        if (r.refusees.length === 0) {
          show(`${r.publiees} épreuve${r.publiees > 1 ? "s" : ""} en ligne`);
          setLignes([]);
          router.push("/admin?tab=publies");
          router.refresh();
          return;
        }
        // The ones that went through are gone from the list; what is left is
        // exactly what still needs doing, with the reason on each row.
        show(`${r.publiees} publiée(s), ${r.refusees.length} à reprendre`, "warn");
        const echecs = new Set(r.refusees.map((x) => x.matiere));
        setLignes((l) => l.filter((ligne) => echecs.has(ligne.matiere.trim())));
        router.refresh();
      } catch (e) {
        show(e instanceof Error ? e.message : "Envoi impossible", "warn");
      }
    });
  };

  return (
    <div className="px-5 pb-12 pt-2">
      <p className="mb-5 text-[14.5px] leading-relaxed text-slate">
        Choisis la promo une fois, ajoute toutes les feuilles, puis nomme chaque matière. Tout part
        d&rsquo;un seul coup.
      </p>

      <label className="mb-1.5 block text-[13px] font-bold text-ink-soft">Promo</label>
      <select value={classe} onChange={(e) => setClasse(e.target.value)} className={`${INPUT} mb-3.5`}>
        {classes.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      <div className="mb-3.5 flex gap-2.5">
        <div className="flex-1">
          <label className="mb-1.5 block text-[13px] font-bold text-ink-soft">Année</label>
          <input
            value={annee}
            onChange={(e) => setAnnee(e.target.value)}
            list="annees-lot"
            inputMode="numeric"
            className={INPUT}
          />
          <datalist id="annees-lot">
            {annees.map((a) => (
              <option key={a} value={a} />
            ))}
          </datalist>
        </div>
        <div className="flex-1">
          <label className="mb-1.5 block text-[13px] font-bold text-ink-soft">Type</label>
          <select value={type} onChange={(e) => setType(e.target.value)} className={INPUT}>
            {types.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      <label className="mb-1.5 block text-[13px] font-bold text-ink-soft">
        Enseignant <span className="font-semibold text-slate-light">· facultatif</span>
      </label>
      <input
        value={enseignant}
        onChange={(e) => setEnseignant(e.target.value)}
        placeholder="Dr. NOUMO FOKO"
        className={`${INPUT} mb-5`}
      />

      <button
        onClick={() => fichierRef.current?.click()}
        className="mb-4 flex h-[110px] w-full flex-col items-center justify-center gap-2 rounded-[18px] border-[1.5px] border-dashed border-teal-border bg-teal-tint-soft text-teal-dark active:bg-teal-tint"
      >
        <Icon name="plus" size={24} strokeWidth={2} />
        <span className="text-[14.5px] font-bold">
          {lignes.length === 0 ? "Choisir les feuilles" : "Ajouter d'autres feuilles"}
        </span>
        <span className="text-[12px] font-semibold text-slate-light">
          Photos ou PDF — plusieurs à la fois
        </span>
      </button>
      <input
        ref={fichierRef}
        type="file"
        accept="image/*,application/pdf"
        multiple
        className="hidden"
        onChange={(e) => {
          ajouter(e.target.files);
          e.target.value = "";
        }}
      />

      {lignes.length > 0 && (
        <>
          <div className="mb-2 flex items-center justify-between">
            <div className="text-base font-extrabold">
              {lignes.length} épreuve{lignes.length > 1 ? "s" : ""}
            </div>
            <button
              onClick={appliquerATous}
              className="h-9 rounded-xl px-3 text-[13px] font-bold text-teal-dark active:bg-teal-tint"
            >
              Année et type à toutes
            </button>
          </div>

          <datalist id="matieres-lot">
            {matieres.map((m) => (
              <option key={m} value={m} />
            ))}
          </datalist>

          {lignes.map((ligne, i) => (
            <div key={`${ligne.fichier.name}-${i}`} className="mb-3 rounded-[18px] border border-line p-3.5">
              <div className="mb-2.5 flex items-center gap-2.5">
                <span className="grid h-9 w-9 flex-none place-items-center rounded-[11px] bg-surface text-teal-active">
                  <Icon name="doc" size={17} />
                </span>
                <span className="min-w-0 flex-1 truncate text-[12.5px] font-semibold text-slate-light">
                  {ligne.fichier.name}
                </span>
                <button
                  onClick={() => retirer(i)}
                  aria-label={`Retirer ${ligne.fichier.name}`}
                  className="grid h-9 w-9 flex-none place-items-center rounded-xl text-slate-light active:bg-surface-2"
                >
                  <Icon name="x" size={16} strokeWidth={2.2} />
                </button>
              </div>

              <input
                value={ligne.matiere}
                onChange={(e) => modifier(i, "matiere", e.target.value)}
                list="matieres-lot"
                placeholder="Matière"
                className={`${PETIT} mb-2`}
              />
              <div className="flex gap-2">
                <input
                  value={ligne.annee}
                  onChange={(e) => modifier(i, "annee", e.target.value)}
                  inputMode="numeric"
                  placeholder="Année"
                  className={PETIT}
                />
                <select
                  value={ligne.type}
                  onChange={(e) => modifier(i, "type", e.target.value)}
                  className={PETIT}
                >
                  {types.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}

          <button
            onClick={envoyer}
            disabled={envoi}
            className="press-scale mt-2 h-[54px] w-full rounded-2xl bg-teal text-[15.5px] font-bold text-white disabled:opacity-60 active:bg-teal-press"
          >
            {envoi
              ? "Envoi…"
              : `Publier ${lignes.length} épreuve${lignes.length > 1 ? "s" : ""}`}
          </button>
          <p className="mt-2.5 text-[12px] leading-snug text-slate-light">
            Elles partent toutes sur {classe}. Si l&rsquo;une échoue, les autres passent quand même
            et seule celle-là reste à reprendre.
          </p>
        </>
      )}
    </div>
  );
}
