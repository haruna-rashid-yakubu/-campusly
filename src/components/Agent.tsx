"use client";

import { useEffect, useRef, useState } from "react";
import { AgentWidget } from "@/components/AgentWidgets";
import { Icon, type IconName } from "@/components/icons";
import { SignInButton } from "@/components/SignInButton";
import type { Evenement, Widget } from "@/lib/agent/types";
import { markdown } from "@/lib/markdown";
import { decouper } from "@/lib/tuteur-blocs";

/*
 * The assistant, the tab bar's middle tab: one tap, and then whatever the student asks
 * — order lunch, find a paper, read tomorrow's courses, find a room, answer
 * the poll. The route (api/agent) does it with its tools and streams each
 * step; this screen shows the steps as they happen, the cards the tools
 * produced (to tap, to send), and the answer with what to ask next.
 *
 * The conversation is kept for the visit; the phone's back button closes it.
 */
type Tour =
  | { role: "user"; content: string }
  | { role: "assistant"; content: string; etapes: string[]; widgets: Widget[]; contexte?: string; erreur?: string; fini: boolean };

const CLE = "campusly.agent";

const DEPARTS: { libelle: string; question: string; icone: IconName; teinte: string; fond: string }[] = [
  { libelle: "Commander à manger", question: "Je veux commander à manger, qu'est-ce qui est ouvert ?", icone: "bag", teinte: "#c2185b", fond: "#fdeef4" },
  { libelle: "Mes cours de demain", question: "J'ai quels cours demain ?", icone: "cal", teinte: "#0d9488", fond: "#e6f7f5" },
  { libelle: "Trouver un sujet", question: "Trouve-moi des anciens sujets de ma promo", icone: "doc", teinte: "#4f46e5", fond: "#eef0ff" },
  { libelle: "Un logement", question: "Trouve-moi un logement pas cher près du campus", icone: "bed", teinte: "#ea580c", fond: "#fff1e6" },
  { libelle: "Ma semaine", question: "Montre-moi mon programme de la semaine", icone: "list", teinte: "#0284c7", fond: "#e8f4fd" },
  { libelle: "Le sondage", question: "Y a-t-il un sondage en cours ?", icone: "ballot", teinte: "var(--color-teal-dark)", fond: "var(--color-teal-tint)" },
];

function lire(): Tour[] {
  try {
    return (JSON.parse(sessionStorage.getItem(CLE) ?? "[]") as Tour[]).map((t) => (t.role === "assistant" ? { ...t, fini: true } : t));
  } catch {
    return [];
  }
}

export function Agent({ onFermer }: { onFermer: () => void }) {
  const [tours, setTours] = useState<Tour[]>(lire);
  const [saisie, setSaisie] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [connexion, setConnexion] = useState(false);
  const filRef = useRef<HTMLDivElement>(null);
  const fermerRef = useRef(onFermer);
  useEffect(() => {
    fermerRef.current = onFermer;
  });

  useEffect(() => {
    // Once: a second mount (React's development check) must not add a second step.
    if (!(window.history.state as Record<string, unknown> | null)?.agent) window.history.pushState({ ...window.history.state, agent: true }, "");
    const retour = () => {
      if (!(window.history.state as Record<string, unknown> | null)?.agent) fermerRef.current();
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
    try {
      sessionStorage.setItem(CLE, JSON.stringify(tours.slice(-24)));
    } catch {
      /* private browsing: the conversation lives as long as the screen */
    }
    filRef.current?.scrollTo({ top: filRef.current.scrollHeight, behavior: "smooth" });
  }, [tours]);

  // Leaving for another page: close first, so the history step goes with it.
  const quitter = () => fermerRef.current();

  async function demander(question: string) {
    const q = question.trim();
    if (!q || enCours) return;
    const avant: Tour[] = [...tours, { role: "user", content: q }];
    let reponse: Extract<Tour, { role: "assistant" }> = { role: "assistant", content: "", etapes: [], widgets: [], fini: false };
    const maj = () => setTours([...avant, { ...reponse }]);
    setTours([...avant, reponse]);
    setSaisie("");
    setEnCours(true);
    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // What the cards showed travels with the words, so "le deuxième" can be understood.
          messages: avant.map((t) => ({ role: t.role, content: t.role === "assistant" && t.contexte ? `${t.content}\n\n[${t.contexte}]` : t.content })),
        }),
      });
      if (res.status === 401) {
        setConnexion(true);
        setTours(tours);
        return;
      }
      if (!res.ok || !res.body) {
        const corps = (await res.json().catch(() => null)) as { erreur?: string; limite?: number } | null;
        throw new Error(corps?.erreur === "quota" ? `Tu as fait tes ${corps.limite ?? 40} demandes du jour. Reviens demain !` : "L'assistant ne répond pas pour le moment.");
      }
      const lecteur = res.body.getReader();
      const decodeur = new TextDecoder();
      let reste = "";
      for (;;) {
        const { done, value } = await lecteur.read();
        if (done) break;
        reste += decodeur.decode(value, { stream: true });
        const lignes = reste.split("\n");
        reste = lignes.pop() ?? "";
        for (const ligne of lignes) {
          if (!ligne.trim()) continue;
          const e = JSON.parse(ligne) as Evenement;
          if (e.t === "etape") reponse = { ...reponse, etapes: [...reponse.etapes, e.texte] };
          else if (e.t === "widget") reponse = { ...reponse, widgets: [...reponse.widgets, e.widget] };
          else if (e.t === "texte") reponse = { ...reponse, content: e.texte };
          else if (e.t === "contexte") reponse = { ...reponse, contexte: e.texte };
          else if (e.t === "erreur") reponse = { ...reponse, erreur: e.message };
          else if (e.t === "fin") reponse = { ...reponse, fini: true };
          maj();
        }
      }
      reponse = { ...reponse, fini: true };
      maj();
    } catch (e) {
      reponse = { ...reponse, fini: true, erreur: e instanceof Error ? e.message : "L'assistant ne répond pas pour le moment." };
      maj();
    } finally {
      setEnCours(false);
    }
  }

  const vide = tours.length === 0;

  return (
    <div className="cy-tiroir fixed inset-0 z-50 flex flex-col bg-white anim-fade" role="dialog" aria-label="Assistant Campusly">
      <div className="flex flex-none items-center gap-2 border-b border-line-3 px-2 pb-2.5" style={{ paddingTop: "calc(10px + var(--safe-top))" }}>
        <button onClick={() => window.history.back()} className="press-scale grid h-11 w-11 place-items-center" aria-label="Fermer">
          <Icon name="x" size={21} strokeWidth={2} />
        </button>
        <span className="grid h-9 w-9 flex-none place-items-center rounded-xl bg-teal text-white">
          <Icon name="spark" size={19} strokeWidth={1.9} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[15px] font-extrabold leading-tight">Assistant Campusly</div>
          <div className="truncate text-[12.5px] text-slate">{enCours ? "Au travail…" : "Commande, cherche, organise pour toi"}</div>
        </div>
        {!vide && (
          <button
            onClick={() => setTours([])}
            disabled={enCours}
            className="press-scale grid h-11 w-11 place-items-center text-slate disabled:opacity-40"
            aria-label="Nouvelle conversation"
          >
            <Icon name="refresh" size={19} strokeWidth={1.9} />
          </button>
        )}
      </div>

      <div ref={filRef} className="flex-1 overflow-y-auto overscroll-contain px-4 py-4">
        {connexion ? (
          <div className="flex flex-col items-center pt-16 text-center">
            <span className="grid h-16 w-16 place-items-center rounded-[22px] bg-surface text-slate">
              <Icon name="lock" size={28} strokeWidth={1.7} />
            </span>
            <div className="mt-4 text-[18px] font-extrabold">Connecte-toi pour utiliser l&rsquo;assistant</div>
            <p className="mt-1.5 max-w-[290px] text-[14px] text-slate">Il agit en ton nom : il a besoin de savoir qui tu es.</p>
            <SignInButton className="press-scale mt-5 flex h-[52px] w-full max-w-xs items-center justify-center rounded-2xl border-[1.5px] border-line-4 bg-white text-[15px] font-bold" />
          </div>
        ) : vide ? (
          <div className="flex flex-col items-center pt-4 text-center">
            <span className="grid h-16 w-16 place-items-center rounded-[22px] bg-teal-tint text-teal-dark">
              <Icon name="spark" size={30} strokeWidth={1.7} />
            </span>
            <div className="mt-4 text-[21px] font-extrabold tracking-tight">Qu&rsquo;est-ce que je fais pour toi ?</div>
            <p className="mt-1.5 max-w-[300px] text-[14px] leading-relaxed text-slate">
              Je commande, je cherche tes sujets, je lis ton programme, je trouve un logement. Demande-le comme à un ami.
            </p>
            <div className="mt-6 grid w-full max-w-[380px] grid-cols-2 gap-2.5">
              {DEPARTS.map((d) => (
                <button
                  key={d.libelle}
                  onClick={() => void demander(d.question)}
                  className="press-scale flex flex-col items-start gap-2.5 rounded-2xl border border-line bg-white p-3 text-left shadow-[0_8px_20px_-16px_rgba(15,23,42,.35)]"
                >
                  <span className="grid h-9 w-9 place-items-center rounded-xl" style={{ background: d.fond, color: d.teinte }}>
                    <Icon name={d.icone} size={18} strokeWidth={2} />
                  </span>
                  <span className="text-[13.5px] font-extrabold leading-tight">{d.libelle}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {tours.map((t, i) =>
              t.role === "user" ? (
                <div key={i} className="ml-10 self-end whitespace-pre-wrap rounded-[18px] rounded-br-md bg-teal px-3.5 py-2.5 text-[15px] leading-snug text-white">
                  {t.content}
                </div>
              ) : (
                <TourAssistant key={i} tour={t} dernier={i === tours.length - 1} onSuite={(q) => void demander(q)} onQuitter={quitter} />
              )
            )}
          </div>
        )}
      </div>

      {!connexion && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void demander(saisie);
          }}
          className="flex-none border-t border-line-3 bg-white px-3 pt-2.5"
          style={{ paddingBottom: "calc(10px + var(--safe-bottom))" }}
        >
          <div className="flex items-end gap-2">
            <textarea
              value={saisie}
              onChange={(e) => setSaisie(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && window.matchMedia("(pointer: fine)").matches) {
                  e.preventDefault();
                  void demander(saisie);
                }
              }}
              rows={1}
              maxLength={1000}
              placeholder="Commande, cherche, demande…"
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
        </form>
      )}
    </div>
  );
}

// One answer: the steps it took (ticked as they finish), the cards, the words, what next.
function TourAssistant({
  tour,
  dernier,
  onSuite,
  onQuitter,
}: {
  tour: Extract<Tour, { role: "assistant" }>;
  dernier: boolean;
  onSuite: (q: string) => void;
  onQuitter: () => void;
}) {
  const { blocs, suggestions } = decouper(tour.content);
  const texte = blocs.flatMap((b) => (b.t === "md" ? [b.texte] : "texte" in b ? [b.texte] : [])).join("\n\n");
  const attente = !tour.fini && !tour.content;

  return (
    <div className="mr-2 flex min-w-0 max-w-[calc(100%-8px)] flex-col gap-2 self-start">
      {tour.etapes.length > 0 && (
        <div className="flex flex-col gap-1 px-1">
          {tour.etapes.map((e, i) => {
            const enCours = !tour.fini && i === tour.etapes.length - 1 && !tour.content;
            return (
              <div key={i} className="anim-deplie flex items-center gap-2 text-[12.5px] font-semibold text-slate">
                {enCours ? (
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-teal border-t-transparent" />
                ) : (
                  <span className="grid h-3.5 w-3.5 place-items-center rounded-full bg-teal text-white">
                    <Icon name="check" size={9} strokeWidth={3.4} />
                  </span>
                )}
                {e}
              </div>
            );
          })}
        </div>
      )}

      {attente && tour.etapes.length === 0 && (
        <div className="flex h-11 w-16 items-center justify-center gap-1 rounded-[18px] rounded-bl-md bg-surface" aria-label="L'assistant réfléchit">
          {[0, 1, 2].map((n) => (
            <span key={n} className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-light" style={{ animationDelay: `${n * 120}ms` }} />
          ))}
        </div>
      )}

      {tour.widgets.map((w, i) => (
        <div key={i} className="anim-deplie">
          <AgentWidget widget={w} onSuite={onSuite} onQuitter={onQuitter} />
        </div>
      ))}

      {texte && <div className="reponse-ia anim-fade rounded-[18px] rounded-bl-md bg-surface px-3.5 py-3 text-ink" dangerouslySetInnerHTML={{ __html: markdown(texte) }} />}

      {tour.erreur && (
        <div className="flex items-start gap-2 rounded-2xl bg-warn-tint px-3.5 py-3 text-[13.5px] font-semibold text-warn-ink">
          <Icon name="warn" size={17} className="mt-0.5 flex-none" />
          {tour.erreur}
        </div>
      )}

      {dernier && tour.fini && suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
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
    </div>
  );
}
