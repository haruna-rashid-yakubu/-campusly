"use client";

import "katex/dist/katex.min.css";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/icons";
import { markdown } from "@/lib/markdown";

/*
 * The revision tutor of a Sujet, full screen: a conversation with an AI that
 * has the paper in front of it (api/sujets/[id]/tuteur). It explains and
 * guides; the answer itself comes when the student asks for it.
 *
 * The conversation is kept for the visit (sessionStorage), so closing the
 * tutor to look at the PDF and coming back finds it where it was. The phone's
 * back button closes it, as it does the PDF reader.
 */
type Message = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Par quoi je commence ?",
  "Explique-moi le premier exercice",
  "Quelles notions dois-je réviser ?",
  "Vérifie ma réponse",
];

const cle = (id: number, corrige: boolean) => `campusly.tuteur.${id}${corrige ? ".corrige" : ""}`;

function lire(id: number, corrige: boolean): Message[] {
  try {
    return JSON.parse(sessionStorage.getItem(cle(id, corrige)) ?? "[]") as Message[];
  } catch {
    return [];
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
  const [messages, setMessages] = useState<Message[]>(() => lire(subjectId, corrige));
  const [saisie, setSaisie] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const filRef = useRef<HTMLDivElement>(null);
  const fermerRef = useRef(onFermer);
  useEffect(() => {
    fermerRef.current = onFermer;
  });

  useEffect(() => {
    window.history.pushState({ ...window.history.state, tuteur: true }, "");
    const retour = () => fermerRef.current();
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
      sessionStorage.setItem(cle(subjectId, corrige), JSON.stringify(messages.slice(-30)));
    } catch {
      /* private browsing: the conversation lives as long as the screen */
    }
    filRef.current?.scrollTo({ top: filRef.current.scrollHeight });
  }, [messages, subjectId, corrige]);

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
        body: JSON.stringify({ messages: fil, corrige }),
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
    <div className="fixed inset-0 z-50 flex flex-col bg-white anim-fade" role="dialog" aria-label="Tuteur IA">
      <div
        className="flex flex-none items-center gap-2 border-b border-line-3 px-2 pb-2.5"
        style={{ paddingTop: "calc(10px + var(--safe-top))" }}
      >
        <button onClick={() => window.history.back()} className="press-scale grid h-11 w-11 place-items-center" aria-label="Fermer">
          <Icon name="x" size={21} strokeWidth={2} />
        </button>
        <span className="grid h-9 w-9 flex-none place-items-center rounded-xl bg-teal text-white">
          <Icon name="spark" size={19} strokeWidth={1.9} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[15px] font-extrabold leading-tight">Tuteur IA</div>
          <div className="truncate text-[12.5px] text-slate">{corrige ? `Corrigé · ${matiere}` : matiere}</div>
        </div>
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

      <div ref={filRef} className="flex-1 overflow-y-auto overscroll-contain px-4 py-4">
        {vide ? (
          <div className="flex flex-col items-center pt-8 text-center">
            <span className="grid h-16 w-16 place-items-center rounded-[22px] bg-teal-tint text-teal-dark">
              <Icon name="spark" size={30} strokeWidth={1.6} />
            </span>
            <div className="mt-4 text-[19px] font-extrabold tracking-tight">Révise ce sujet avec l&rsquo;IA</div>
            <p className="mt-2 max-w-[300px] text-[14px] leading-relaxed text-slate">
              Je t&rsquo;explique les notions et la méthode, étape par étape. Quand tu veux vérifier, demande-moi la réponse.
            </p>
            <div className="mt-6 flex w-full max-w-[360px] flex-col gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => (s === "Vérifie ma réponse" ? setSaisie("Voici ma réponse à la question … : ") : void envoyer(s))}
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
              ) : m.content ? (
                <div
                  key={i}
                  className="reponse-ia mr-4 self-start rounded-[18px] rounded-bl-md bg-surface px-3.5 py-3 text-ink"
                  dangerouslySetInnerHTML={{ __html: markdown(m.content) }}
                />
              ) : (
                <div key={i} className="flex h-11 w-16 items-center justify-center gap-1 self-start rounded-[18px] rounded-bl-md bg-surface" aria-label="Le tuteur écrit">
                  {[0, 1, 2].map((n) => (
                    <span key={n} className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-light" style={{ animationDelay: `${n * 120}ms` }} />
                  ))}
                </div>
              )
            )}
          </div>
        )}
        {erreur && (
          <div className="mt-3 flex items-start gap-2 rounded-2xl bg-warn-tint px-3.5 py-3 text-[13.5px] font-semibold text-warn-ink">
            <Icon name="warn" size={17} className="mt-0.5 flex-none" />
            {erreur}
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void envoyer(saisie);
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
                void envoyer(saisie);
              }
            }}
            rows={1}
            maxLength={2000}
            placeholder="Pose ta question sur ce sujet…"
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
