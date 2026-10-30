"use client";

import { useRef, useState } from "react";
import { Icon } from "@/components/icons";
import { markdown, markdownEnLigne } from "@/lib/markdown";
import type { QuestionQuiz } from "@/lib/tuteur-blocs";

/*
 * The tutor's quiz, one question at a time.
 *
 * A question is answered by tapping a choice: the right one turns green, a
 * wrong pick red, the explanation unfolds, and only then does "Question
 * suivante" slide the next one in. The bar at the top fills question by
 * question, green or red; an answered step can be tapped to look back at it.
 * At the end, the score, what went wrong, and where to go from there.
 *
 * The choices are shuffled — the same way at every render, from the question's
 * text — so the right answer is not always the first one the model wrote.
 */
const html = (texte: string) => ({ __html: markdown(texte) });

function ordre(n: number, graine: string) {
  let h = 2166136261;
  for (const c of graine) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  const indices = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0;
    const j = h % (i + 1);
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices;
}

const vibrer = (motif: number | number[]) => {
  try {
    navigator.vibrate?.(motif);
  } catch {
    /* not on this phone */
  }
};

export function QuizCarrousel({ questions, onSuite }: { questions: QuestionQuiz[]; onSuite: (question: string) => void }) {
  // The choice picked for each question, as an index into its shuffled order.
  const [reponses, setReponses] = useState<(number | null)[]>(() => questions.map(() => null));
  const [index, setIndex] = useState(0);
  const [sens, setSens] = useState<"avant" | "arriere">("avant");
  const [fini, setFini] = useState(false);
  const carteRef = useRef<HTMLDivElement>(null);

  const melanges = questions.map((q) => ordre(q.choix.length, q.question).map((i) => q.choix[i]));
  const juste = (i: number) => reponses[i] !== null && melanges[i][reponses[i]!]?.juste === true;
  const score = questions.filter((_, i) => juste(i)).length;
  const premiereLibre = reponses.findIndex((r) => r === null);
  const n = questions.length;

  const aller = (cible: number) => {
    setSens(cible < index ? "arriere" : "avant");
    setIndex(cible);
    setFini(false);
    requestAnimationFrame(() => carteRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" }));
  };

  const choisir = (choix: number) => {
    if (reponses[index] !== null) return;
    const bon = melanges[index][choix].juste;
    vibrer(bon ? 12 : [10, 50, 10]);
    setReponses((r) => r.map((x, i) => (i === index ? choix : x)));
  };

  // Answers go in order, so the next one to answer is always after the one on screen.
  const suivant = () => {
    if (premiereLibre !== -1) return aller(premiereLibre);
    setSens("avant");
    setFini(true);
    requestAnimationFrame(() => carteRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" }));
  };

  const recommencer = () => {
    setReponses(questions.map(() => null));
    setSens("arriere");
    setIndex(0);
    setFini(false);
  };

  const q = questions[index];
  const choix = melanges[index];
  const pris = reponses[index];
  const repondu = pris !== null;
  const bonIndex = choix.findIndex((c) => c.juste);
  const toutRepondu = premiereLibre === -1;

  return (
    <div ref={carteRef} className="scroll-mt-4 overflow-hidden rounded-[20px] border-[1.5px] border-line-4 bg-white">
      <div className="px-3.5 pt-3">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[11.5px] font-black uppercase tracking-[.08em] text-teal-dark">
            <Icon name="ballot" size={14} strokeWidth={2.2} />
            Quiz
          </span>
          <span className="text-[12px] font-bold tabular-nums text-slate">
            {fini ? `${score}/${n} bonnes réponses` : `Question ${index + 1} sur ${n}`}
          </span>
        </div>
        {/* One step per question: green or red once answered, tappable to look back. */}
        <div className="mt-2.5 flex gap-1" role="tablist" aria-label="Progression du quiz">
          {questions.map((_, i) => {
            const fait = reponses[i] !== null;
            return (
              <button
                key={i}
                role="tab"
                aria-selected={!fini && i === index}
                aria-label={`Question ${i + 1}${fait ? (juste(i) ? ", juste" : ", fausse") : ""}`}
                disabled={!fait && i !== premiereLibre}
                onClick={() => aller(i)}
                className="group flex h-4 flex-1 items-center"
              >
                <span
                  className={`h-1.5 w-full rounded-full transition-colors duration-300 ${
                    fait ? (juste(i) ? "bg-[#16a34a]" : "bg-[#dc2626]") : i === index && !fini ? "bg-teal" : "bg-line-3"
                  } ${!fini && i === index ? "ring-2 ring-teal/25" : ""}`}
                />
              </button>
            );
          })}
        </div>
      </div>

      {fini ? (
        <Score
          score={score}
          questions={questions}
          juste={juste}
          onRevoir={aller}
          onRecommencer={recommencer}
          onSuite={onSuite}
        />
      ) : (
        <div key={`${index}-${sens}`} className={`px-3.5 pb-3.5 pt-3 ${sens === "avant" ? "anim-glisse" : "anim-glisse-retour"}`}>
          <div className="reponse-ia text-[15.5px] font-bold" dangerouslySetInnerHTML={html(q.question)} />
          <div className="mt-3 flex flex-col gap-2">
            {choix.map((c, i) => {
              const etat = !repondu ? "libre" : c.juste ? "juste" : i === pris ? "faux" : "eteint";
              return (
                <button
                  key={i}
                  disabled={repondu}
                  onClick={() => choisir(i)}
                  className={`press-scale flex min-h-[52px] items-center gap-3 rounded-2xl border-[1.5px] px-3 py-2.5 text-left text-[14.5px] font-semibold transition-[background-color,border-color,color,opacity] duration-200 ${
                    etat === "juste"
                      ? "border-[#16a34a] bg-[#f0fdf4] text-[#166534]"
                      : etat === "faux"
                        ? "border-[#dc2626] bg-[#fef2f2] text-[#991b1b]"
                        : etat === "eteint"
                          ? "border-line-3 text-slate-light opacity-70"
                          : "border-line-4 bg-white active:border-teal active:bg-teal-tint-soft"
                  }`}
                >
                  <span
                    className={`grid h-7 w-7 flex-none place-items-center rounded-full text-[12px] font-black ${
                      etat === "juste" ? "bg-[#16a34a] text-white" : etat === "faux" ? "bg-[#dc2626] text-white" : "border-[1.5px] border-current"
                    }`}
                  >
                    {etat === "juste" ? <Icon name="check" size={14} strokeWidth={3} /> : etat === "faux" ? <Icon name="x" size={14} strokeWidth={3} /> : String.fromCharCode(65 + i)}
                  </span>
                  <span className="reponse-ia min-w-0 flex-1" dangerouslySetInnerHTML={html(c.texte)} />
                </button>
              );
            })}
          </div>

          {repondu ? (
            <>
              <div className={`anim-deplie mt-3 rounded-2xl px-3.5 py-3 ${choix[pris].juste ? "bg-[#f0fdf4]" : "bg-[#fef2f2]"}`}>
                <div className={`text-[14px] font-extrabold ${choix[pris].juste ? "text-[#166534]" : "text-[#991b1b]"}`}>
                  {choix[pris].juste ? "Bonne réponse !" : `Pas tout à fait : c'était la réponse ${String.fromCharCode(65 + bonIndex)}.`}
                </div>
                {q.explication && <div className="reponse-ia mt-1 text-[14px] text-ink" dangerouslySetInnerHTML={html(q.explication)} />}
              </div>
              <button
                onClick={suivant}
                className="anim-deplie press-scale mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-teal text-[15px] font-extrabold text-white"
              >
                {toutRepondu ? "Voir mon score" : premiereLibre === index + 1 ? "Question suivante" : `Reprendre à la question ${premiereLibre + 1}`}
                <Icon name="right" size={17} strokeWidth={2.4} />
              </button>
            </>
          ) : (
            <div className="mt-3 text-center text-[12.5px] font-semibold text-slate-light">Touche la bonne réponse</div>
          )}
        </div>
      )}
    </div>
  );
}

function Score({
  score,
  questions,
  juste,
  onRevoir,
  onRecommencer,
  onSuite,
}: {
  score: number;
  questions: QuestionQuiz[];
  juste: (i: number) => boolean;
  onRevoir: (i: number) => void;
  onRecommencer: () => void;
  onSuite: (question: string) => void;
}) {
  const n = questions.length;
  const part = score / n;
  const erreurs = questions.map((q, i) => ({ q, i })).filter(({ i }) => !juste(i));
  const titre = part === 1 ? "Parfait !" : part >= 0.6 ? "Bien joué !" : "On continue à réviser";
  const sousTitre =
    part === 1 ? "Tu maîtrises cette notion." : part >= 0.6 ? "Encore un petit effort sur les erreurs." : "Revois les erreurs avec moi, puis réessaie.";

  return (
    <div className="px-3.5 pb-3.5 pt-4">
      <div className="anim-pop flex flex-col items-center text-center">
        <div
          className="grid h-[88px] w-[88px] place-items-center rounded-full"
          style={{ background: `conic-gradient(${part >= 0.6 ? "#16a34a" : "#f59e0b"} ${part * 360}deg, var(--color-line-3) 0)` }}
        >
          <div className="grid h-[72px] w-[72px] place-items-center rounded-full bg-white text-[22px] font-black tabular-nums">
            {score}/{n}
          </div>
        </div>
        <div className="mt-3 text-[18px] font-extrabold tracking-tight">{titre}</div>
        <div className="mt-0.5 text-[13.5px] text-slate">{sousTitre}</div>
      </div>

      <div className="mt-4 flex flex-col">
        {questions.map((q, i) => (
          <button
            key={i}
            onClick={() => onRevoir(i)}
            className="press-scale flex items-center gap-2.5 border-b border-line-3 py-2.5 text-left last:border-b-0"
          >
            <span className={`grid h-6 w-6 flex-none place-items-center rounded-full text-white ${juste(i) ? "bg-[#16a34a]" : "bg-[#dc2626]"}`}>
              <Icon name={juste(i) ? "check" : "x"} size={13} strokeWidth={3} />
            </span>
            {/* The question with its formulas typeset: stripping the dollars left raw \frac{…} on screen. */}
            <span
              className="line-clamp-1 min-w-0 flex-1 text-[13.5px] font-semibold"
              dangerouslySetInnerHTML={{ __html: markdownEnLigne(q.question.split("\n")[0]) }}
            />
            <Icon name="right" size={15} className="flex-none text-slate-light" />
          </button>
        ))}
      </div>

      <div className="mt-3 flex flex-col gap-2">
        {erreurs.length > 0 && (
          <button
            onClick={() =>
              onSuite(
                `Explique-moi mes erreurs dans le quiz : ${erreurs.map(({ q, i }) => `question ${i + 1} (« ${q.question.slice(0, 120)} »)`).join(", ")}.`
              )
            }
            className="press-scale flex h-12 items-center justify-center gap-2 rounded-2xl bg-teal text-[14.5px] font-extrabold text-white"
          >
            <Icon name="bulb" size={17} strokeWidth={2} />
            Revoir mes erreurs avec le tuteur
          </button>
        )}
        <div className="flex gap-2">
          <button
            onClick={onRecommencer}
            className="press-scale flex h-11 flex-1 items-center justify-center gap-1.5 rounded-2xl border-[1.5px] border-line-4 text-[13.5px] font-bold"
          >
            <Icon name="retry" size={16} strokeWidth={2} />
            Recommencer
          </button>
          <button
            onClick={() => onSuite("Fais-moi un autre quiz sur le même thème, un peu plus difficile.")}
            className={`press-scale flex h-11 flex-1 items-center justify-center gap-1.5 rounded-2xl text-[13.5px] font-bold ${
              erreurs.length ? "border-[1.5px] border-line-4" : "bg-teal text-white"
            }`}
          >
            <Icon name="spark" size={16} strokeWidth={2} />
            Un autre quiz
          </button>
        </div>
      </div>
    </div>
  );
}
