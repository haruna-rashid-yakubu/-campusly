"use client";

import "katex/dist/katex.min.css";
import { useEffect, useRef, useState } from "react";
import { Icon, type IconName } from "@/components/icons";
import { lireCours, type Cours } from "@/lib/cours";
import { markdown } from "@/lib/markdown";
import { QuizCarrousel } from "@/components/QuizCarrousel";
import { RapportIA } from "@/components/RapportIA";
import type { ResultatQuiz } from "@/lib/rapport-client";
import { decouper, enClair, type Bloc } from "@/lib/tuteur-blocs";

/*
 * The revision tutor of a Sujet, full screen: a conversation with an AI that
 * has the paper in front of it (api/sujets/[id]/tuteur) and, when the student
 * adds it, their own course. It explains and guides; the answer itself comes
 * when asked for.
 *
 * Its answers are not a wall of text: hints and results wait behind a button,
 * a method unfolds step by step, a quiz is answered by tapping, and each
 * answer ends with what to ask next.
 *
 * The conversation and the course are kept for the visit (sessionStorage);
 * the phone's back button closes the tutor.
 */
type Message = { role: "user" | "assistant"; content: string };
type Chargement = { nom: string; fait: number; total: number };

const COURS_MAX = 40_000;

const SUGGESTIONS = ["Par quoi je commence ?", "Explique-moi le premier exercice", "Quelles notions dois-je réviser ?", "Teste-moi avec un quiz"];

const ACTIONS: { libelle: string; icone: IconName; question: string }[] = [
  { libelle: "Plus simple", icone: "bulb", question: "Explique-moi ça plus simplement, avec des mots simples." },
  { libelle: "Un exemple", icone: "list", question: "Donne-moi un exemple concret pour bien comprendre." },
  { libelle: "Teste-moi", icone: "check", question: "Teste-moi avec un quiz de quelques questions sur ce qu'on vient de voir." },
];

const cle = (id: number, corrige: boolean, quoi: string) => `campusly.tuteur.${quoi}.${id}${corrige ? ".corrige" : ""}`;

function lire<T>(nom: string, defaut: T): T {
  try {
    return (JSON.parse(sessionStorage.getItem(nom) ?? "null") as T) ?? defaut;
  } catch {
    return defaut;
  }
}

function garder(nom: string, valeur: unknown) {
  try {
    sessionStorage.setItem(nom, JSON.stringify(valeur));
  } catch {
    /* private browsing, or full: the conversation lives as long as the screen */
  }
}

export function TuteurIA({
  subjectId,
  matiere,
  corrige,
  onFermer,
}: {
  subjectId: number;
  matiere: string;
  corrige: boolean;
  onFermer: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>(() => lire(cle(subjectId, corrige, "fil"), []));
  const [cours, setCours] = useState<Cours[]>(() => lire(cle(subjectId, corrige, "cours"), []));
  // Finished quizzes' scores, for the report's "Ton bilan".
  const [quiz, setQuiz] = useState<ResultatQuiz[]>(() => lire(cle(subjectId, corrige, "quiz"), []));
  const [rapport, setRapport] = useState(false);
  const [chargement, setChargement] = useState<Chargement | null>(null);
  const [saisie, setSaisie] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const filRef = useRef<HTMLDivElement>(null);
  const fichierRef = useRef<HTMLInputElement>(null);
  const fermerRef = useRef(onFermer);
  useEffect(() => {
    fermerRef.current = onFermer;
  });

  useEffect(() => {
    // Once: a second mount (React's development check) must not add a second step.
    if (!(window.history.state as Record<string, unknown> | null)?.tuteur) window.history.pushState({ ...window.history.state, tuteur: true }, "");
    // Layers stack (the report's reader opens over the tutor): close only when this one's step is left.
    const retour = () => {
      if (!(window.history.state as Record<string, unknown> | null)?.tuteur) fermerRef.current();
    };
    window.addEventListener("popstate", retour);
    const defilement = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("popstate", retour);
      document.body.style.overflow = defilement;
    };
  }, []);

  useEffect(() => {
    garder(cle(subjectId, corrige, "fil"), messages.slice(-30));
    filRef.current?.scrollTo({ top: filRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, subjectId, corrige]);

  useEffect(() => {
    garder(cle(subjectId, corrige, "cours"), cours);
  }, [cours, subjectId, corrige]);

  useEffect(() => {
    garder(cle(subjectId, corrige, "quiz"), quiz.slice(-10));
  }, [quiz, subjectId, corrige]);

  async function ajouterCours(fichiers: FileList | null) {
    if (!fichiers?.length) return;
    setErreur(null);
    for (const fichier of Array.from(fichiers)) {
      setChargement({ nom: fichier.name, fait: 0, total: 1 });
      try {
        const lu = await lireCours(subjectId, fichier, (fait, total) => setChargement({ nom: fichier.name, fait, total }));
        if (lu.texte.trim()) setCours((c) => [...c, lu]);
        else setErreur(`Aucun texte trouvé dans « ${fichier.name} ».`);
      } catch (e) {
        setErreur(e instanceof Error ? e.message : "Impossible de lire ce fichier.");
        break;
      }
    }
    setChargement(null);
  }

  async function envoyer(texte: string) {
    const question = texte.trim();
    if (!question || enCours) return;
    const fil: Message[] = [...messages, { role: "user", content: question }];
    setMessages([...fil, { role: "assistant", content: "" }]);
    setSaisie("");
    setErreur(null);
    setEnCours(true);
    try {
      const res = await fetch(`/api/sujets/${subjectId}/tuteur`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: fil,
          corrige,
          cours: cours.map((c) => `## ${c.nom}\n${c.texte}`).join("\n\n").slice(0, COURS_MAX),
        }),
      });
      if (!res.ok || !res.body) {
        const corps = (await res.json().catch(() => null)) as { erreur?: string; limite?: number } | null;
        throw new Error(
          corps?.erreur === "quota_ia"
            ? `Tu as posé tes ${corps.limite ?? 30} questions du jour. Reviens demain pour continuer !`
            : corps?.erreur === "connexion"
              ? "Connecte-toi pour parler au tuteur."
              : "Le tuteur ne répond pas pour le moment. Réessaie dans un instant."
        );
      }
      const lecteur = res.body.getReader();
      const decodeur = new TextDecoder();
      let reponse = "";
      for (;;) {
        const { done, value } = await lecteur.read();
        if (done) break;
        reponse += decodeur.decode(value, { stream: true });
        setMessages([...fil, { role: "assistant", content: reponse }]);
      }
      if (!reponse.trim()) throw new Error("Le tuteur ne répond pas pour le moment. Réessaie dans un instant.");
    } catch (e) {
      setMessages(fil.slice(0, -1));
      setSaisie(question);
      setErreur(e instanceof Error ? e.message : "Le tuteur ne répond pas pour le moment.");
    } finally {
      setEnCours(false);
    }
  }

  const vide = messages.length === 0;

  return (
    <div className="cy-tiroir fixed inset-0 z-50 flex flex-col bg-white anim-fade" role="dialog" aria-label="Tuteur IA">
      <div className="flex-none border-b border-line-3" style={{ paddingTop: "calc(10px + var(--safe-top))" }}>
        <div className="flex items-center gap-2 px-2 pb-2.5">
          <button onClick={() => window.history.back()} className="press-scale grid h-11 w-11 place-items-center" aria-label="Fermer">
            <Icon name="x" size={21} strokeWidth={2} />
          </button>
          <span className="grid h-9 w-9 flex-none place-items-center rounded-xl bg-teal text-white">
            <Icon name="spark" size={19} strokeWidth={1.9} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[15px] font-extrabold leading-tight">Tuteur IA</div>
            <div className="truncate text-[12.5px] text-slate">
              {corrige ? `Corrigé · ${matiere}` : matiere}
            </div>
          </div>
          <button
            onClick={() => setRapport(true)}
            className="press-scale flex h-9 items-center gap-1.5 rounded-xl bg-teal-tint px-2.5 text-[12.5px] font-extrabold text-teal-dark"
            aria-label="Générer le rapport de révision en PDF"
          >
            <Icon name="doc" size={15} strokeWidth={2.2} />
            Rapport PDF
          </button>
          {!vide && (
            <button
              onClick={() => setMessages([])}
              disabled={enCours}
              className="press-scale grid h-11 w-11 place-items-center text-slate disabled:opacity-40"
              aria-label="Nouvelle conversation"
            >
              <Icon name="refresh" size={19} strokeWidth={1.9} />
            </button>
          )}
        </div>

        {(cours.length > 0 || chargement) && (
          <div className="flex gap-2 overflow-x-auto px-3 pb-2.5 [scrollbar-width:none]">
            {cours.map((c, i) => (
              <span key={`${c.nom}-${i}`} className="flex h-9 flex-none items-center gap-1.5 rounded-full bg-teal-tint pl-3 pr-1 text-[12.5px] font-bold text-teal-dark">
                <Icon name="doc" size={15} strokeWidth={2} />
                <span className="max-w-[150px] truncate">{c.nom}</span>
                <span className="font-semibold opacity-70">· {c.pages} p.</span>
                <button
                  onClick={() => setCours((tous) => tous.filter((_, j) => j !== i))}
                  className="grid h-7 w-7 place-items-center rounded-full active:bg-teal-border"
                  aria-label={`Retirer ${c.nom}`}
                >
                  <Icon name="x" size={14} strokeWidth={2.2} />
                </button>
              </span>
            ))}
            {chargement && (
              <span className="flex h-9 flex-none items-center gap-2 rounded-full bg-surface px-3 text-[12.5px] font-bold text-slate">
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-light border-t-transparent" />
                <span className="max-w-[150px] truncate">{chargement.nom}</span>
                {chargement.total > 1 && <span>{chargement.fait}/{chargement.total}</span>}
              </span>
            )}
          </div>
        )}
      </div>

      <div ref={filRef} className="flex-1 overflow-y-auto overscroll-contain px-4 py-4">
        {vide ? (
          <div className="flex flex-col items-center pt-5 text-center">
            <span className="grid h-16 w-16 place-items-center rounded-[22px] bg-teal-tint text-teal-dark">
              <Icon name="spark" size={30} strokeWidth={1.6} />
            </span>
            <div className="mt-4 text-[19px] font-extrabold tracking-tight">Révise ce sujet avec l&rsquo;IA</div>
            <p className="mt-2 max-w-[300px] text-[14px] leading-relaxed text-slate">
              Indices, méthode pas à pas, quiz : je t&rsquo;aide à comprendre. La réponse, c&rsquo;est quand tu veux.
            </p>

            {cours.length === 0 && (
              <button
                onClick={() => fichierRef.current?.click()}
                disabled={!!chargement}
                className="press-scale mt-5 flex w-full max-w-[360px] items-center gap-3 rounded-2xl border-[1.5px] border-dashed border-teal-border bg-teal-tint-soft p-3.5 text-left disabled:opacity-60"
              >
                <span className="grid h-11 w-11 flex-none place-items-center rounded-xl bg-white text-teal-dark shadow-sm">
                  <Icon name="clip" size={20} strokeWidth={1.9} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[14.5px] font-extrabold">Ajoute ton cours</span>
                  <span className="mt-0.5 block text-[12.5px] leading-snug text-slate">
                    PDF ou photos de tes notes : je réponds avec les méthodes de ton prof.
                  </span>
                </span>
              </button>
            )}

            <button
              onClick={() => setRapport(true)}
              className="press-scale mt-3 flex w-full max-w-[360px] items-center gap-3 rounded-2xl border-[1.5px] border-line-4 bg-white p-3.5 text-left active:bg-surface-3"
            >
              <span className="grid h-11 w-11 flex-none place-items-center rounded-xl bg-teal-tint text-teal-dark">
                <Icon name="doc" size={20} strokeWidth={1.9} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[14.5px] font-extrabold">Rapport de révision PDF</span>
                <span className="mt-0.5 block text-[12.5px] leading-snug text-slate">Tout le sujet expliqué et corrigé, avec un plan de révision.</span>
              </span>
              <Icon name="right" size={16} className="flex-none text-slate-light" />
            </button>

            <div className="mt-3 flex w-full max-w-[360px] flex-col gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => void envoyer(s)}
                  className="press-scale flex h-12 items-center justify-between rounded-2xl border-[1.5px] border-line-4 bg-white px-4 text-left text-[14px] font-bold active:bg-surface-3"
                >
                  {s}
                  <Icon name="right" size={16} className="text-slate-light" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {messages.map((m, i) =>
              m.role === "user" ? (
                <div key={i} className="ml-10 self-end whitespace-pre-wrap rounded-[18px] rounded-br-md bg-teal px-3.5 py-2.5 text-[15px] leading-snug text-white">
                  {m.content}
                </div>
              ) : (
                <Reponse
                  key={i}
                  contenu={m.content}
                  derniere={i === messages.length - 1}
                  ecrit={enCours && i === messages.length - 1}
                  onSuite={(q) => void envoyer(q)}
                  onQuiz={(r) => setQuiz((q) => [...q, r])}
                />
              )
            )}
          </div>
        )}
        {erreur && (
          <div className="mt-3 flex items-start gap-2 rounded-2xl bg-warn-tint px-3.5 py-3 text-left text-[13.5px] font-semibold text-warn-ink">
            <Icon name="warn" size={17} className="mt-0.5 flex-none" />
            {erreur}
          </div>
        )}
      </div>

      {rapport && (
        <RapportIA
          subjectId={subjectId}
          matiere={matiere}
          corrige={corrige}
          messages={messages}
          quiz={quiz}
          cours={cours.map((c) => `## ${c.nom}\n${c.texte}`).join("\n\n").slice(0, COURS_MAX)}
          onFermer={() => setRapport(false)}
        />
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void envoyer(saisie);
        }}
        className="flex-none border-t border-line-3 bg-white px-3 pt-2.5"
        style={{ paddingBottom: "calc(10px + var(--safe-bottom))" }}
      >
        <input
          ref={fichierRef}
          type="file"
          accept="application/pdf,image/*"
          multiple
          hidden
          onChange={(e) => {
            void ajouterCours(e.target.files);
            e.target.value = "";
          }}
        />
        <div className="flex items-end gap-2">
          <button
            type="button"
            onClick={() => fichierRef.current?.click()}
            disabled={!!chargement}
            className="press-scale relative grid h-[46px] w-[46px] flex-none place-items-center rounded-full border-[1.5px] border-line-4 text-slate disabled:opacity-40"
            aria-label="Ajouter ton cours"
          >
            <Icon name="clip" size={19} strokeWidth={1.9} />
            {cours.length > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-teal px-1 text-[10px] font-black text-white">
                {cours.length}
              </span>
            )}
          </button>
          <textarea
            value={saisie}
            onChange={(e) => setSaisie(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && window.matchMedia("(pointer: fine)").matches) {
                e.preventDefault();
                void envoyer(saisie);
              }
            }}
            rows={1}
            maxLength={2000}
            placeholder="Pose ta question…"
            className="max-h-32 min-h-[46px] flex-1 resize-none rounded-[20px] border-[1.5px] border-line-4 bg-surface-3 px-4 py-[11px] text-[15px] leading-snug outline-none [field-sizing:content] focus:border-teal"
          />
          <button
            type="submit"
            disabled={enCours || !saisie.trim()}
            className="press-scale grid h-[46px] w-[46px] flex-none place-items-center rounded-full bg-teal text-white disabled:opacity-40"
            aria-label="Envoyer"
          >
            <Icon name="send" size={19} strokeWidth={2} />
          </button>
        </div>
        <div className="mt-1.5 text-center text-[11.5px] text-slate-light">L&rsquo;IA peut se tromper : vérifie avec ton cours.</div>
      </form>
    </div>
  );
}

// One answer: its blocks drawn as cards and buttons, then what to do next.
function Reponse({
  contenu,
  derniere,
  ecrit,
  onSuite,
  onQuiz,
}: {
  contenu: string;
  derniere: boolean;
  ecrit: boolean;
  onSuite: (question: string) => void;
  onQuiz: (resultat: ResultatQuiz) => void;
}) {
  const [copie, setCopie] = useState(false);
  if (!contenu) {
    return (
      <div className="flex h-11 w-16 items-center justify-center gap-1 self-start rounded-[18px] rounded-bl-md bg-surface" aria-label="Le tuteur écrit">
        {[0, 1, 2].map((n) => (
          <span key={n} className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-light" style={{ animationDelay: `${n * 120}ms` }} />
        ))}
      </div>
    );
  }
  const { blocs, suggestions: proposees } = decouper(contenu);
  // A quiz's score already offers another quiz: the same button twice is noise.
  const suggestions = blocs.some((b) => b.t === "quiz") ? proposees.filter((s) => !/autre quiz/i.test(s)) : proposees;

  return (
    <div className="mr-3 flex min-w-0 max-w-[calc(100%-12px)] flex-col gap-2 self-start">
      {blocs.map((b, i) => (
        <BlocReponse key={i} bloc={b} onSuite={onSuite} onQuiz={onQuiz} />
      ))}

      {derniere && !ecrit && (
        <>
          {suggestions.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1.5">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => onSuite(s)}
                  className="press-scale rounded-full border-[1.5px] border-teal-border bg-white px-3.5 py-2 text-[13px] font-bold text-teal-dark active:bg-teal-tint"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
          <div className="flex items-center gap-0.5">
            {ACTIONS.filter((a) => !suggestions.some((s) => s.toLowerCase().includes(a.libelle.toLowerCase()))).map((a) => (
              <button
                key={a.libelle}
                onClick={() => onSuite(a.question)}
                className="press-scale flex h-9 items-center gap-1.5 whitespace-nowrap rounded-xl px-2 text-[12.5px] font-bold text-slate active:bg-surface"
              >
                <Icon name={a.icone} size={15} strokeWidth={2} />
                {a.libelle}
              </button>
            ))}
            <button
              onClick={() => {
                void navigator.clipboard?.writeText(enClair(contenu)).then(() => {
                  setCopie(true);
                  setTimeout(() => setCopie(false), 1500);
                });
              }}
              className="press-scale ml-auto grid h-9 w-9 place-items-center rounded-xl text-slate active:bg-surface"
              aria-label="Copier la réponse"
            >
              <Icon name={copie ? "check" : "copy"} size={16} strokeWidth={2} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

const html = (texte: string) => ({ __html: markdown(texte) });

function BlocReponse({
  bloc,
  onSuite,
  onQuiz,
}: {
  bloc: Bloc;
  onSuite: (question: string) => void;
  onQuiz: (resultat: ResultatQuiz) => void;
}) {
  if (bloc.t === "md") {
    return <div className="reponse-ia rounded-[18px] rounded-bl-md bg-surface px-3.5 py-3 text-ink" dangerouslySetInnerHTML={html(bloc.texte)} />;
  }
  if (!bloc.complet) {
    const nom = {
      indice: "un indice",
      solution: "la réponse",
      cle: "l'essentiel",
      etapes: "la méthode",
      quiz: bloc.t === "quiz" && bloc.questions.length > 1 ? `ton quiz (${bloc.questions.length} questions)` : "ton quiz",
    }[bloc.t];
    return (
      <div className="flex items-center gap-2 rounded-2xl border-[1.5px] border-dashed border-line-4 px-3.5 py-3 text-[13px] font-bold text-slate">
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-light border-t-transparent" />
        Le tuteur prépare {nom}…
      </div>
    );
  }
  if (bloc.t === "indice") return <Revele icone="bulb" libelle="Voir un indice" titre="Indice" texte={bloc.texte} />;
  if (bloc.t === "solution") return <Revele icone="eye" libelle="Voir la réponse" titre="Réponse" texte={bloc.texte} fort />;
  if (bloc.t === "cle") {
    return (
      <div className="rounded-2xl border-l-4 border-teal bg-teal-tint px-3.5 py-3">
        <div className="mb-1 flex items-center gap-1.5 text-[11.5px] font-black uppercase tracking-[.08em] text-teal-dark">
          <Icon name="star" size={14} strokeWidth={2.2} />À retenir
        </div>
        <div className="reponse-ia text-ink" dangerouslySetInnerHTML={html(bloc.texte)} />
      </div>
    );
  }
  if (bloc.t === "etapes") return <Etapes etapes={bloc.etapes} />;
  if (bloc.t === "quiz") return <QuizCarrousel questions={bloc.questions} onSuite={onSuite} onTermine={onQuiz} />;
  return null;
}

// A hint or an answer, behind a button the student chooses to press.
function Revele({ icone, libelle, titre, texte, fort }: { icone: IconName; libelle: string; titre: string; texte: string; fort?: boolean }) {
  const [vu, setVu] = useState(false);
  if (!vu) {
    return (
      <button
        onClick={() => setVu(true)}
        className={`press-scale flex h-12 items-center justify-center gap-2 rounded-2xl text-[14.5px] font-extrabold ${
          fort ? "bg-ink text-white" : "border-[1.5px] border-warn-ink/30 bg-warn-tint text-warn-ink"
        }`}
      >
        <Icon name={icone} size={18} strokeWidth={2} />
        {libelle}
      </button>
    );
  }
  return (
    <div className={`anim-fade rounded-2xl px-3.5 py-3 ${fort ? "border-[1.5px] border-ink/15 bg-white" : "bg-warn-tint"}`}>
      <div className={`mb-1 flex items-center gap-1.5 text-[11.5px] font-black uppercase tracking-[.08em] ${fort ? "text-ink" : "text-warn-ink"}`}>
        <Icon name={icone} size={14} strokeWidth={2.2} />
        {titre}
      </div>
      <div className="reponse-ia text-ink" dangerouslySetInnerHTML={html(texte)} />
    </div>
  );
}

// A method the student walks through one step at a time.
function Etapes({ etapes }: { etapes: string[] }) {
  const [vues, setVues] = useState(1);
  return (
    <div className="rounded-2xl border-[1.5px] border-line-4 bg-white p-3">
      <div className="mb-2 flex items-center justify-between px-0.5 text-[11.5px] font-black uppercase tracking-[.08em] text-slate">
        <span>Méthode</span>
        <span>
          {Math.min(vues, etapes.length)}/{etapes.length}
        </span>
      </div>
      <ol className="flex flex-col gap-2">
        {etapes.slice(0, vues).map((e, i) => (
          <li key={i} className="anim-fade flex gap-2.5">
            <span className="grid h-6 w-6 flex-none place-items-center rounded-full bg-teal text-[12px] font-black text-white">{i + 1}</span>
            <span className="reponse-ia min-w-0 flex-1 pt-0.5" dangerouslySetInnerHTML={html(e)} />
          </li>
        ))}
      </ol>
      {vues < etapes.length && (
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => setVues((v) => v + 1)}
            className="press-scale flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-teal-tint text-[13.5px] font-extrabold text-teal-dark"
          >
            Étape suivante
            <Icon name="right" size={15} strokeWidth={2.2} />
          </button>
          <button onClick={() => setVues(etapes.length)} className="press-scale h-10 rounded-xl px-3 text-[13px] font-bold text-slate">
            Tout voir
          </button>
        </div>
      )}
    </div>
  );
}
