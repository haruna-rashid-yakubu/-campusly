"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/icons";
import { LecteurPdf } from "@/components/LecteurPdf";
import type { ResultatQuiz } from "@/lib/rapport-client";

/*
 * The revision report, from the tutor: what it will hold, then its parts being
 * written at the same time (api/sujets/[id]/tuteur/rapport) — each ticks off
 * as it arrives — then the PDF, to open in the page's reader, download or
 * share. A part that fails is asked for once more before giving up.
 */
type Partie = { id: string; titre: string; exercices: string[] };
type EtatPartie = "attente" | "ecrit" | "faite" | "echec";
type Etape =
  | { t: "intro" }
  | { t: "redaction"; parties: Partie[]; etats: Record<string, EtatPartie> }
  | { t: "mise-en-page" }
  | { t: "pret"; pdf: Uint8Array }
  | { t: "erreur"; message: string };

export function RapportIA({
  subjectId,
  matiere,
  corrige,
  messages,
  quiz,
  cours,
  filigrane,
  onFermer,
}: {
  subjectId: number;
  matiere: string;
  corrige: boolean;
  messages: { role: string; content: string }[];
  quiz: ResultatQuiz[];
  cours: string;
  filigrane: string;
  onFermer: () => void;
}) {
  const [etape, setEtape] = useState<Etape>({ t: "intro" });
  const [lecteur, setLecteur] = useState(false);
  const actif = useRef(true);
  const fermerRef = useRef(onFermer);
  useEffect(() => {
    fermerRef.current = onFermer;
  });
  // Its own step in the history, over the tutor's: the phone's back button closes the report first.
  useEffect(() => {
    actif.current = true;
    // Once: a second mount (React's development check) must not add a second step.
    if (!(window.history.state as Record<string, unknown> | null)?.rapport) window.history.pushState({ ...window.history.state, rapport: true }, "");
    const retour = () => {
      if (!(window.history.state as Record<string, unknown> | null)?.rapport) fermerRef.current();
    };
    window.addEventListener("popstate", retour);
    return () => {
      actif.current = false;
      window.removeEventListener("popstate", retour);
    };
  }, []);

  const appel = (corps: object) =>
    fetch(`/api/sujets/${subjectId}/tuteur/rapport`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ corrige, ...corps }),
    });

  async function generer() {
    try {
      const res = await appel({ etape: "plan" });
      const plan = (await res.json().catch(() => null)) as { parties?: Partie[]; erreur?: string; limite?: number } | null;
      if (!res.ok || !plan?.parties) {
        throw new Error(
          plan?.erreur === "quota_rapport"
            ? `Tu as déjà généré ${plan.limite ?? 5} rapports aujourd'hui. Reviens demain !`
            : plan?.erreur === "connexion"
              ? "Connecte-toi pour générer ton rapport."
              : "Le rapport ne peut pas être préparé pour le moment. Réessaie dans un instant."
        );
      }
      const parties = plan.parties;
      const etats: Record<string, EtatPartie> = Object.fromEntries(parties.map((p) => [p.id, "ecrit"]));
      setEtape({ t: "redaction", parties, etats: { ...etats } });
      const marquer = (id: string, e: EtatPartie) => {
        etats[id] = e;
        if (actif.current) setEtape({ t: "redaction", parties, etats: { ...etats } });
      };

      const ecrire = async (p: Partie): Promise<string | null> => {
        for (let essai = 0; essai < 2; essai++) {
          const r = await appel({ partie: p.id, messages, quiz, cours }).catch(() => null);
          const d = r?.ok ? ((await r.json().catch(() => null)) as { texte?: string } | null) : null;
          if (d?.texte) {
            marquer(p.id, "faite");
            return d.texte;
          }
        }
        marquer(p.id, "echec");
        return null;
      };
      const textes = await Promise.all(parties.map(ecrire));
      if (!actif.current) return;
      if (textes.some((t) => t === null)) throw new Error("Une partie du rapport n'a pas pu être rédigée. Réessaie dans un instant.");

      setEtape({ t: "mise-en-page" });
      const pdf = await fetch(`/api/sujets/${subjectId}/tuteur/rapport/pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parties: parties.map((p, i) => ({ id: p.id, exercices: p.exercices, texte: textes[i] })), avecCours: !!cours }),
      });
      if (!pdf.ok) throw new Error("La mise en page du PDF a échoué. Réessaie dans un instant.");
      const octets = new Uint8Array(await pdf.arrayBuffer());
      if (actif.current) setEtape({ t: "pret", pdf: octets });
    } catch (e) {
      if (actif.current) setEtape({ t: "erreur", message: e instanceof Error ? e.message : "Le rapport n'a pas pu être généré." });
    }
  }

  const nomFichier = `Rapport de révision - ${matiere}.pdf`.replace(/[\\/:*?"<>|]/g, "");
  const fichier = (pdf: Uint8Array) => new File([pdf.slice()], nomFichier, { type: "application/pdf" });
  const telecharger = (pdf: Uint8Array) => {
    const lien = document.createElement("a");
    lien.href = URL.createObjectURL(fichier(pdf));
    lien.download = nomFichier;
    document.body.appendChild(lien);
    lien.click();
    lien.remove();
    setTimeout(() => URL.revokeObjectURL(lien.href), 30_000);
  };
  const peutPartager = (pdf: Uint8Array) => {
    try {
      return typeof navigator.canShare === "function" && navigator.canShare({ files: [fichier(pdf)] });
    } catch {
      return false;
    }
  };

  const enCours = etape.t === "redaction" || etape.t === "mise-en-page";
  const faites = etape.t === "redaction" ? Object.values(etape.etats).filter((e) => e === "faite").length : 0;

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-white anim-fade" role="dialog" aria-label="Rapport de révision">
      <div className="flex flex-none items-center gap-2 border-b border-line-3 px-2 pb-2.5" style={{ paddingTop: "calc(10px + var(--safe-top))" }}>
        <button
          onClick={() => window.history.back()}
          disabled={enCours}
          className="press-scale grid h-11 w-11 place-items-center disabled:opacity-30"
          aria-label="Fermer"
        >
          <Icon name="x" size={21} strokeWidth={2} />
        </button>
        <div className="min-w-0 flex-1">
          <div className="text-[15px] font-extrabold leading-tight">Rapport de révision</div>
          <div className="truncate text-[12.5px] text-slate">{matiere}</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-6">
        {etape.t === "intro" && (
          <div className="anim-fade">
            <span className="grid h-16 w-16 place-items-center rounded-[22px] bg-teal-tint text-teal-dark">
              <Icon name="doc" size={30} strokeWidth={1.6} />
            </span>
            <h2 className="mt-4 text-[22px] font-extrabold leading-tight tracking-tight">Tout le sujet, expliqué et corrigé, en un PDF</h2>
            <p className="mt-2 text-[14.5px] leading-relaxed text-slate">
              Le tuteur rédige ton rapport personnel, à garder et à relire avant l&rsquo;examen.
            </p>
            <ul className="mt-5 flex flex-col gap-2.5">
              {[
                ["bulb", "L'essentiel du sujet et les notions clés"],
                ["list", "Chaque exercice : méthode, pièges et corrigé détaillé"],
                ["star", "Les formules à retenir dans un tableau"],
                ...(messages.length || quiz.length ? [["check", "Ton bilan : ce que tu as travaillé et tes résultats aux quiz"]] : []),
                ...(cours ? [["clip", "Les méthodes de ton cours"]] : []),
                ["cal", "Un plan de révision à cocher"],
              ].map(([icone, texte]) => (
                <li key={texte} className="flex items-center gap-3 rounded-2xl bg-surface px-3.5 py-3 text-[14px] font-semibold">
                  <span className="grid h-8 w-8 flex-none place-items-center rounded-xl bg-white text-teal-dark">
                    <Icon name={icone as "bulb"} size={16} strokeWidth={2} />
                  </span>
                  {texte}
                </li>
              ))}
            </ul>
          </div>
        )}

        {etape.t === "redaction" && (
          <div className="anim-fade">
            <div className="text-[19px] font-extrabold tracking-tight">Le tuteur rédige ton rapport…</div>
            <p className="mt-1 text-[13.5px] text-slate">Toutes les parties sont écrites en même temps. Garde cette page ouverte.</p>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-line-3">
              <div
                className="h-full rounded-full bg-teal transition-[width] duration-500"
                style={{ width: `${Math.max(6, (faites / etape.parties.length) * 100)}%` }}
              />
            </div>
            <ul className="mt-5 flex flex-col">
              {etape.parties.map((p) => {
                const e = etape.etats[p.id];
                return (
                  <li key={p.id} className="flex items-center gap-3 border-b border-line-3 py-3 last:border-b-0">
                    <span
                      className={`grid h-7 w-7 flex-none place-items-center rounded-full ${
                        e === "faite" ? "anim-pop bg-[#16a34a] text-white" : e === "echec" ? "bg-[#dc2626] text-white" : "bg-surface"
                      }`}
                    >
                      {e === "faite" ? (
                        <Icon name="check" size={14} strokeWidth={3} />
                      ) : e === "echec" ? (
                        <Icon name="x" size={14} strokeWidth={3} />
                      ) : (
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-light border-t-transparent" />
                      )}
                    </span>
                    <span className={`min-w-0 flex-1 truncate text-[14.5px] ${e === "faite" ? "font-bold" : "font-semibold text-slate"}`}>{p.titre}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {etape.t === "mise-en-page" && (
          <div className="anim-fade flex flex-col items-center pt-16 text-center">
            <span className="h-10 w-10 animate-spin rounded-full border-[3px] border-teal border-t-transparent" />
            <div className="mt-5 text-[17px] font-extrabold">Mise en page du PDF…</div>
            <p className="mt-1 text-[13.5px] text-slate">Couverture, formules, tableaux : encore quelques secondes.</p>
          </div>
        )}

        {etape.t === "pret" && (
          <div className="anim-pop flex flex-col items-center pt-10 text-center">
            <span className="grid h-20 w-20 place-items-center rounded-full bg-[#f0fdf4] text-[#16a34a]">
              <Icon name="check" size={36} strokeWidth={2.4} />
            </span>
            <div className="mt-5 text-[21px] font-extrabold tracking-tight">Ton rapport est prêt</div>
            <p className="mt-1.5 max-w-[300px] text-[14px] leading-relaxed text-slate">
              {Math.max(1, Math.round(etape.pdf.byteLength / 1024))} Ko · à relire avant l&rsquo;examen, sur ton téléphone ou imprimé.
            </p>
          </div>
        )}

        {etape.t === "erreur" && (
          <div className="anim-fade flex flex-col items-center pt-14 text-center">
            <span className="grid h-16 w-16 place-items-center rounded-full bg-warn-tint text-warn-ink">
              <Icon name="warn" size={28} strokeWidth={2} />
            </span>
            <div className="mt-4 text-[17px] font-extrabold">Rapport non généré</div>
            <p className="mt-1.5 max-w-[300px] text-[14px] leading-relaxed text-slate">{etape.message}</p>
          </div>
        )}
      </div>

      <div className="flex flex-none flex-col gap-2 border-t border-line-3 px-4 pt-3" style={{ paddingBottom: "calc(12px + var(--safe-bottom))" }}>
        {(etape.t === "intro" || etape.t === "erreur") && (
          <button
            onClick={() => void generer()}
            className="press-scale flex h-[54px] items-center justify-center gap-2 rounded-2xl bg-teal text-[16px] font-extrabold text-white"
          >
            <Icon name="spark" size={19} strokeWidth={2} />
            {etape.t === "erreur" ? "Réessayer" : "Générer mon rapport"}
          </button>
        )}
        {etape.t === "intro" && <div className="text-center text-[12px] text-slate-light">Environ une minute · 5 rapports par jour</div>}
        {enCours && <div className="py-3 text-center text-[13px] font-semibold text-slate">Ne ferme pas cette page pendant la rédaction.</div>}
        {etape.t === "pret" && (
          <>
            <button
              onClick={() => setLecteur(true)}
              className="press-scale flex h-[54px] items-center justify-center gap-2 rounded-2xl bg-teal text-[16px] font-extrabold text-white"
            >
              <Icon name="full" size={18} strokeWidth={2.2} />
              Ouvrir le rapport
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => telecharger(etape.pdf)}
                className="press-scale flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl border-[1.5px] border-line-4 text-[14.5px] font-bold"
              >
                <Icon name="down" size={17} strokeWidth={2} />
                Télécharger
              </button>
              {peutPartager(etape.pdf) && (
                <button
                  onClick={() => void navigator.share({ files: [fichier(etape.pdf)], title: nomFichier }).catch(() => {})}
                  className="press-scale flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl border-[1.5px] border-line-4 text-[14.5px] font-bold"
                >
                  <Icon name="share" size={17} strokeWidth={2} />
                  Partager
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {lecteur && etape.t === "pret" && (
        <LecteurPdf
          source={etape.pdf}
          titre={`Rapport · ${matiere}`}
          filigrane={filigrane}
          onTelecharger={() => telecharger(etape.pdf)}
          onFermer={() => setLecteur(false)}
        />
      )}
    </div>
  );
}
