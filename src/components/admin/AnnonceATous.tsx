"use client";

import { useState, useTransition } from "react";
import { Icon } from "@/components/icons";
import { useToast } from "@/components/Toast";
import { annoncerATous } from "@/lib/actions";

/*
 * The one notification that answers no event. Everything else the app sends is
 * triggered by something that happened — a week published, papers online, a
 * submission accepted — and can be reasoned about afterwards. This one is a
 * decision, so it is written down in front of whoever takes it: the text is
 * visible and editable before it goes, and the second tap is a real
 * confirmation rather than a formality.
 *
 * It reports the devices actually reached, not the number subscribed, because
 * "envoyé à tout le monde" is the kind of sentence that gets believed.
 */
/*
 * Where the notification lands when it is tapped. It is a choice and not a
 * free text field because a push whose tap opens nothing is worse than one
 * that opens the home screen, and because these five are the only pages an
 * announcement has ever been about.
 */
const CIBLES = [
  { url: "/pressing", label: "Pressing" },
  { url: "/logements", label: "Logements" },
  { url: "/sujets", label: "Annales" },
  { url: "/programme", label: "Programme" },
  { url: "/", label: "Accueil" },
] as const;

const TITRE = "Tes habits veulent te parler 👕";
const CORPS =
  "« On n\u2019en peut plus », signé : la pile dans le coin de la chambre. Campusly Pressing s\u2019en occupe.";

export function AnnonceATous() {
  const [titre, setTitre] = useState(TITRE);
  const [corps, setCorps] = useState(CORPS);
  const [cible, setCible] = useState<string>("/pressing");
  const [confirme, setConfirme] = useState(false);
  const [envoye, setEnvoye] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();
  const { show } = useToast();

  const envoyer = () =>
    startTransition(async () => {
      const r = await annoncerATous(titre, corps, cible);
      if (!r.ok) {
        show(r.message, "warn");
        setConfirme(false);
        return;
      }
      setEnvoye(r.appareils);
      show(`Annonce reçue sur ${r.appareils} appareil${r.appareils > 1 ? "s" : ""}`, "success");
    });

  return (
    <section className="mt-6 rounded-[18px] border-[1.5px] border-line-4 bg-white p-4">
      <h2 className="flex items-center gap-2 text-[15px] font-bold">
        <Icon name="shirt" size={18} strokeWidth={1.9} />
        Annonce à tout le monde
      </h2>
      <p className="mt-1 text-[12.5px] leading-snug text-slate-light">
        Part vers tous les appareils abonnés, toutes promos confondues, sans passer par les
        réglages par type. À garder rare.
      </p>

      {envoye !== null ? (
        <div className="mt-3 flex items-center justify-center gap-2 text-[13px] font-bold text-teal-dark">
          <Icon name="check" size={16} strokeWidth={2.4} />
          {envoye > 0
            ? `Envoyée sur ${envoye} appareil${envoye > 1 ? "s" : ""}`
            : "Aucun appareil joignable"}
        </div>
      ) : (
        <>
          <input
            value={titre}
            onChange={(e) => {
              setTitre(e.target.value);
              setConfirme(false);
            }}
            placeholder="Titre"
            className="mt-3 h-[46px] w-full rounded-[12px] border-[1.5px] border-line-4 px-3 text-[14.5px]"
          />
          <textarea
            value={corps}
            onChange={(e) => {
              setCorps(e.target.value);
              setConfirme(false);
            }}
            rows={3}
            placeholder="Message"
            className="mt-2 w-full rounded-[12px] border-[1.5px] border-line-4 p-3 text-[14.5px] leading-snug"
          />
          <div className="mt-2.5">
            <div className="text-[12px] font-bold text-slate-light">Le tap ouvre</div>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {CIBLES.map((c) => (
                <button
                  key={c.url}
                  onClick={() => {
                    setCible(c.url);
                    setConfirme(false);
                  }}
                  className={`press-scale h-[34px] rounded-full px-3 text-[12.5px] font-bold ${
                    cible === c.url
                      ? "bg-teal text-white"
                      : "border-[1.5px] border-line-4 bg-white text-slate"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={() => (confirme ? envoyer() : setConfirme(true))}
            disabled={pending || !titre.trim() || !corps.trim()}
            className={`press-scale mt-2 flex h-[48px] w-full items-center justify-center gap-2 rounded-[14px] text-[14.5px] font-bold disabled:opacity-60 ${
              confirme ? "bg-warn-tint text-warn-ink" : "border-[1.5px] border-line-4 bg-white"
            }`}
          >
            <Icon name={confirme ? "warn" : "chat"} size={18} strokeWidth={1.9} />
            {pending
              ? "Envoi…"
              : confirme
                ? "Confirmer — ça part à tout le monde"
                : "Envoyer à tout le monde"}
          </button>
        </>
      )}
    </section>
  );
}
