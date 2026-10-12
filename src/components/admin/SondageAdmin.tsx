"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";
import { useToast } from "@/components/Toast";
import { cloreSondage, creerSondage } from "@/lib/actions";
import type { Resultats, ResultatsPromo } from "@/lib/sondage";

/*
 * Two states in one box. While a poll runs, the box is its results and the
 * button that ends it — there is nothing else to do, since only one poll runs
 * at a time. Otherwise it is the form for the next one, with the last poll's
 * results kept above it, because a closed poll is exactly when its answer is
 * worth reading.
 *
 * Sending goes through the same two-tap confirmation as the announcement: it
 * reaches every subscribed device and cannot be taken back.
 */

const DUREES = [
  { heures: 24, label: "24 h" },
  { heures: 48, label: "48 h" },
  { heures: 168, label: "7 jours" },
] as const;

const QUESTION = "🍩 Les Bronuts arrivent sur Campusly. Tu commanderais quand ?";
const OPTIONS = [
  "☕ Le matin avant les cours",
  "🕛 À la pause de midi",
  "🌆 L'après-midi",
  "🤷 Je ne mange pas de donuts",
];
const TITRE = "🍩 Petit sondage, 1 tap";

type SondageVu = {
  id: number;
  question: string;
  options: string[];
  fermeLe: Date;
  appareilsNotifies: number | null;
  ouvert: boolean;
};

export function SondageAdmin({
  dernier,
  resultats,
  parPromo,
}: {
  dernier: SondageVu | null;
  resultats: Resultats | null;
  parPromo: ResultatsPromo[];
}) {
  return (
    <section className="mt-4 rounded-[18px] border-[1.5px] border-line-4 bg-white p-4">
      <h2 className="flex items-center gap-2 text-[15px] font-bold">
        <Icon name="chat" size={18} strokeWidth={1.9} />
        Sondage
      </h2>
      {dernier && resultats && (
        <ResultatsBloc sondage={dernier} resultats={resultats} parPromo={parPromo} />
      )}
      {!dernier?.ouvert && <Formulaire />}
    </section>
  );
}

function ResultatsBloc({
  sondage,
  resultats,
  parPromo,
}: {
  sondage: SondageVu;
  resultats: Resultats;
  parPromo: ResultatsPromo[];
}) {
  const [pending, startTransition] = useTransition();
  const [confirme, setConfirme] = useState(false);
  const router = useRouter();
  const { show } = useToast();
  const [voirPromos, setVoirPromos] = useState(false);

  const clore = () =>
    startTransition(async () => {
      await cloreSondage(sondage.id);
      show("Sondage clos", "success");
      router.refresh();
    });

  const fin = sondage.fermeLe.toLocaleString("fr-FR", {
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Douala",
  });

  return (
    <div className="mt-2.5">
      <div className="text-[12px] font-bold text-slate-light">
        {sondage.ouvert ? `En cours · jusqu'à ${fin}` : "Dernier sondage · terminé"}
        {sondage.appareilsNotifies !== null && ` · notifié sur ${sondage.appareilsNotifies} appareils`}
      </div>
      <div className="mt-1 text-[14.5px] font-bold leading-snug">{sondage.question}</div>

      <div className="mt-2.5 flex flex-col gap-1.5">
        {sondage.options.map((o, i) => {
          const n = resultats.parOption[i] ?? 0;
          const pct = resultats.total > 0 ? Math.round((n / resultats.total) * 100) : 0;
          return (
            <div key={i} className="relative overflow-hidden rounded-[10px] bg-surface-3">
              <span className="absolute inset-y-0 left-0 bg-teal-tint" style={{ width: `${pct}%` }} />
              <span className="relative flex items-center gap-2 px-3 py-2 text-[13.5px]">
                <span className="min-w-0 flex-1">{o}</span>
                <span className="font-extrabold tabular-nums">
                  {n} · {pct} %
                </span>
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-2 text-[12.5px] text-slate-light">
        {resultats.total} réponse{resultats.total > 1 ? "s" : ""} · une par appareil
      </div>

      {parPromo.length > 0 && (
        <button
          onClick={() => setVoirPromos((v) => !v)}
          className="mt-2 text-[13px] font-bold text-teal-dark"
        >
          {voirPromos ? "Masquer le détail par promo" : "Voir le détail par promo"}
        </button>
      )}
      {voirPromos && (
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="text-left text-slate-light">
                <th className="py-1 pr-2 font-bold">Promo</th>
                {sondage.options.map((_, i) => (
                  <th key={i} className="px-1 py-1 text-right font-bold">
                    R{i + 1}
                  </th>
                ))}
                <th className="py-1 pl-1 text-right font-bold">Total</th>
              </tr>
            </thead>
            <tbody>
              {parPromo.map((p) => (
                <tr key={p.promo ?? "inconnue"} className="border-t border-line-3">
                  <td className="py-1.5 pr-2">{p.promo ?? "Promo inconnue"}</td>
                  {p.parOption.map((n, i) => (
                    <td key={i} className="px-1 py-1.5 text-right tabular-nums">
                      {n}
                    </td>
                  ))}
                  <td className="py-1.5 pl-1 text-right font-bold tabular-nums">{p.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-1 text-[11.5px] text-slate-light">
            R1 à R{sondage.options.length} : les réponses dans l&rsquo;ordre ci-dessus.
          </div>
        </div>
      )}

      {sondage.ouvert && (
        <button
          onClick={() => (confirme ? clore() : setConfirme(true))}
          disabled={pending}
          className={`press-scale mt-3 flex h-[44px] w-full items-center justify-center gap-2 rounded-[12px] text-[14px] font-bold disabled:opacity-60 ${
            confirme ? "bg-warn-tint text-warn-ink" : "border-[1.5px] border-line-4 bg-white"
          }`}
        >
          {pending ? "…" : confirme ? "Confirmer — plus personne ne pourra répondre" : "Clore le sondage"}
        </button>
      )}
    </div>
  );
}

function Formulaire() {
  const [question, setQuestion] = useState(QUESTION);
  const [options, setOptions] = useState<string[]>(OPTIONS);
  const [duree, setDuree] = useState<number>(48);
  const [notifier, setNotifier] = useState(true);
  const [titre, setTitre] = useState(TITRE);
  const [confirme, setConfirme] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const { show } = useToast();

  const modifier = (f: () => void) => {
    f();
    setConfirme(false);
  };

  const remplies = options.filter((o) => o.trim()).length;
  const pret = question.trim() && remplies >= 2 && (!notifier || titre.trim());

  const lancer = () =>
    startTransition(async () => {
      const r = await creerSondage({ question, options, dureeHeures: duree, notifier, titreNotification: titre });
      if (!r.ok) {
        show(r.message, "warn");
        setConfirme(false);
        return;
      }
      show(
        r.appareils === null
          ? "Sondage ouvert, sans notification"
          : `Sondage ouvert · notifié sur ${r.appareils} appareil${r.appareils > 1 ? "s" : ""}`,
        "success"
      );
      router.refresh();
    });

  return (
    <div className="mt-3 border-t border-line-3 pt-3">
      <div className="text-[12px] font-bold text-slate-light">Nouveau sondage</div>
      <textarea
        value={question}
        onChange={(e) => modifier(() => setQuestion(e.target.value))}
        rows={2}
        placeholder="La question"
        className="mt-1.5 w-full rounded-[12px] border-[1.5px] border-line-4 p-3 text-[14.5px] leading-snug"
      />
      <div className="mt-1 flex flex-col gap-1.5">
        {options.map((o, i) => (
          <div key={i} className="flex gap-1.5">
            <input
              value={o}
              onChange={(e) =>
                modifier(() => setOptions((prev) => prev.map((p, j) => (j === i ? e.target.value : p))))
              }
              placeholder={`Réponse ${i + 1}`}
              className="h-[44px] min-w-0 flex-1 rounded-[12px] border-[1.5px] border-line-4 px-3 text-[14px]"
            />
            {options.length > 2 && (
              <button
                onClick={() => modifier(() => setOptions((prev) => prev.filter((_, j) => j !== i)))}
                aria-label={`Retirer la réponse ${i + 1}`}
                className="grid h-[44px] w-[44px] flex-none place-items-center rounded-[12px] border-[1.5px] border-line-4 text-slate-light"
              >
                <Icon name="x" size={16} />
              </button>
            )}
          </div>
        ))}
      </div>
      {options.length < 4 && (
        <button
          onClick={() => modifier(() => setOptions((prev) => [...prev, ""]))}
          className="mt-1.5 flex items-center gap-1 text-[13px] font-bold text-teal-dark"
        >
          <Icon name="plus" size={15} /> Ajouter une réponse
        </button>
      )}

      <div className="mt-2.5 text-[12px] font-bold text-slate-light">Durée</div>
      <div className="mt-1.5 flex gap-1.5">
        {DUREES.map((d) => (
          <button
            key={d.heures}
            onClick={() => modifier(() => setDuree(d.heures))}
            className={`press-scale h-[34px] rounded-full px-3 text-[12.5px] font-bold ${
              duree === d.heures ? "bg-teal text-white" : "border-[1.5px] border-line-4 bg-white text-slate"
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>

      <label className="mt-3 flex items-center gap-2 text-[13.5px] font-bold">
        <input
          type="checkbox"
          checked={notifier}
          onChange={(e) => modifier(() => setNotifier(e.target.checked))}
          className="h-[18px] w-[18px] accent-teal"
        />
        Envoyer une notification à tout le monde
      </label>
      {notifier && (
        <>
          <input
            value={titre}
            onChange={(e) => modifier(() => setTitre(e.target.value))}
            placeholder="Titre de la notification"
            className="mt-1.5 h-[44px] w-full rounded-[12px] border-[1.5px] border-line-4 px-3 text-[14px]"
          />
          <p className="mt-1 text-[12px] leading-snug text-slate-light">
            Le texte de la notification est la question. Le tap ouvre le sondage.
          </p>
        </>
      )}

      <button
        onClick={() => (confirme ? lancer() : setConfirme(true))}
        disabled={pending || !pret}
        className={`press-scale mt-3 flex h-[48px] w-full items-center justify-center gap-2 rounded-[14px] text-[14.5px] font-bold disabled:opacity-60 ${
          confirme ? "bg-warn-tint text-warn-ink" : "bg-teal text-white"
        }`}
      >
        <Icon name={confirme ? "warn" : "chat"} size={18} strokeWidth={1.9} />
        {pending
          ? "Lancement…"
          : confirme
            ? notifier
              ? "Confirmer — la notification part à tout le monde"
              : "Confirmer — ouvrir sans notification"
            : "Lancer le sondage"}
      </button>
    </div>
  );
}
