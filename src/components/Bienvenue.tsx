"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Icon } from "@/components/icons";
import { Logo } from "@/components/Logo";
import { SignInButton } from "@/components/SignInButton";
import { ChoixClasseListe, peutCouvrir } from "@/components/ChoixClasseRequis";
import { enregistrerProfil, terminerOnboarding } from "@/lib/actions";

type Etape = "classe" | "nom" | "whatsapp" | "compte";

// Same rule as the server's normaliserTelephone: a Cameroonian mobile, or a full international number.
function telephoneValide(brut: string) {
  const chiffres = brut.replace(/\D/g, "").replace(/^00/, "");
  return (chiffres.length === 9 && chiffres.startsWith("6")) || (chiffres.length >= 11 && chiffres.length <= 15);
}

/*
 * The first opening, in three short steps: the promo (the only one that cannot
 * be skipped — every screen depends on it), the name, the WhatsApp; then an
 * offer to sign in so all of it follows the student to another phone.
 *
 * A device that already has its promo starts at the name, once: that is how
 * existing students get asked without seeing the promo question again.
 */
export function Bienvenue({
  classes,
  depart,
  prenomGoogle,
  nomGoogle,
  connecte,
}: {
  classes: string[];
  depart: "classe" | "nom";
  prenomGoogle: string | null;
  nomGoogle: string | null;
  connecte: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [etape, setEtape] = useState<Etape>(depart);
  const [ferme, setFerme] = useState(false);
  const [prenom, setPrenom] = useState(prenomGoogle ?? "");
  const [nom, setNom] = useState(nomGoogle ?? "");
  const [telephone, setTelephone] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, startTransition] = useTransition();

  const affiche = !ferme && peutCouvrir(pathname) && classes.length > 0;

  useEffect(() => {
    if (!affiche) return;
    const precedent = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = precedent;
    };
  }, [affiche]);

  if (!affiche) return null;

  const etapes: Etape[] = ["classe", "nom", "whatsapp", "compte"];
  const rang = etapes.indexOf(etape);

  const finir = () =>
    startTransition(async () => {
      await terminerOnboarding();
      setFerme(true);
      router.refresh();
    });

  const apresWhatsapp = () => (connecte ? finir() : setEtape("compte"));

  const validerNom = () => {
    if (!prenom.trim()) return;
    startTransition(async () => {
      await enregistrerProfil({ prenom, nom });
      setEtape("whatsapp");
    });
  };

  const validerTelephone = () => {
    if (!telephoneValide(telephone)) {
      setErreur("Ce numéro ne semble pas complet : 9 chiffres, commençant par 6.");
      return;
    }
    setErreur(null);
    startTransition(async () => {
      await enregistrerProfil({ telephone });
      apresWhatsapp();
    });
  };

  const champ =
    "h-[54px] w-full rounded-2xl border-[1.5px] border-line-4 bg-white px-4 text-[16px] font-semibold outline-none focus:border-teal";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="choix-classe-titre"
      className="anim-fade fixed inset-0 z-[25] overflow-y-auto bg-white"
      style={{ paddingTop: "calc(24px + var(--safe-top))", paddingBottom: "calc(28px + var(--safe-bottom))" }}
    >
      <div className="mx-auto w-full max-w-[460px] px-6">
        <div className="mb-6 flex gap-1.5" aria-hidden>
          {etapes.map((e, i) => (
            <span key={e} className="h-1.5 flex-1 overflow-hidden rounded-full bg-line-3">
              <span
                className="block h-full rounded-full bg-teal transition-[width] duration-[var(--duree-entree)] ease-[var(--courbe)]"
                style={{ width: i <= rang ? "100%" : "0%" }}
              />
            </span>
          ))}
        </div>

        {/* Each step slides in from the right, keyed so it replays on every change. */}
        <div key={etape} className="anim-push">
        {etape === "classe" && <ChoixClasseListe classes={classes} onChoisi={() => setEtape("nom")} />}

        {etape === "nom" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              validerNom();
            }}
          >
            <span className="mx-auto block w-fit">
              <Logo size={52} />
            </span>
            <h1 id="choix-classe-titre" className="mt-4 text-center text-[24px] font-extrabold tracking-tight">
              Comment tu t&rsquo;appelles&nbsp;?
            </h1>
            <p className="mx-auto mt-1.5 max-w-[320px] text-center text-[14.5px] leading-snug text-slate">
              Pour te saluer, et pour que les vendeurs sachent à qui ils livrent.
            </p>
            <label className="mt-6 block text-[13.5px] font-bold text-ink-soft">
              Prénom
              <input
                autoFocus
                autoComplete="given-name"
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                maxLength={60}
                className={`mt-1.5 ${champ}`}
              />
            </label>
            <label className="mt-4 block text-[13.5px] font-bold text-ink-soft">
              Nom <span className="font-medium text-slate">(facultatif)</span>
              <input
                autoComplete="family-name"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                maxLength={60}
                className={`mt-1.5 ${champ}`}
              />
            </label>
            <button
              type="submit"
              disabled={!prenom.trim() || enCours}
              className="press-scale mt-6 flex h-[54px] w-full items-center justify-center rounded-2xl bg-teal text-[16px] font-bold text-white active:bg-teal-press disabled:bg-line-3 disabled:text-slate"
            >
              Continuer
            </button>
            <button
              type="button"
              onClick={() => setEtape("whatsapp")}
              className="mt-2 flex h-11 w-full items-center justify-center text-[14.5px] font-bold text-slate"
            >
              Passer
            </button>
          </form>
        )}

        {etape === "whatsapp" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              validerTelephone();
            }}
          >
            <span className="mx-auto grid h-[60px] w-[60px] place-items-center rounded-[18px] bg-teal-tint text-teal-dark">
              <Icon name="chat" size={28} />
            </span>
            <h1 id="choix-classe-titre" className="mt-4 text-center text-[24px] font-extrabold tracking-tight">
              Ton WhatsApp
            </h1>
            <p className="mx-auto mt-1.5 max-w-[320px] text-center text-[14.5px] leading-snug text-slate">
              Pour que le vendeur ou le pressing te recontacte, rien d&rsquo;autre.
            </p>
            <div className="mt-6 flex gap-2">
              <span className="flex h-[54px] items-center rounded-2xl bg-surface px-4 text-[16px] font-bold text-ink-soft">
                +237
              </span>
              <input
                autoFocus
                type="tel"
                inputMode="tel"
                autoComplete="tel-national"
                placeholder="6 90 00 00 00"
                value={telephone}
                onChange={(e) => {
                  setTelephone(e.target.value);
                  setErreur(null);
                }}
                aria-invalid={!!erreur}
                className={champ}
              />
            </div>
            {erreur && <p className="mt-2 text-[13.5px] font-semibold text-danger">{erreur}</p>}
            <button
              type="submit"
              disabled={!telephone.trim() || enCours}
              className="press-scale mt-6 flex h-[54px] w-full items-center justify-center rounded-2xl bg-teal text-[16px] font-bold text-white active:bg-teal-press disabled:bg-line-3 disabled:text-slate"
            >
              Continuer
            </button>
            <button
              type="button"
              onClick={apresWhatsapp}
              className="mt-2 flex h-11 w-full items-center justify-center text-[14.5px] font-bold text-slate"
            >
              Passer
            </button>
          </form>
        )}

        {etape === "compte" && (
          <div>
            <span className="mx-auto grid h-[60px] w-[60px] place-items-center rounded-[18px] bg-teal-tint text-teal-dark">
              <Icon name="lock" size={28} />
            </span>
            <h1 id="choix-classe-titre" className="mt-4 text-center text-[24px] font-extrabold tracking-tight">
              {prenom.trim() ? `C'est noté, ${prenom.trim()}` : "C'est noté"}
            </h1>
            <p className="mx-auto mt-1.5 max-w-[320px] text-center text-[14.5px] leading-snug text-slate">
              Connecte-toi avec Google pour garder tout ça sur tous tes appareils.
            </p>
            <div className="mt-6 flex">
              <SignInButton className="press-scale flex h-[54px] flex-1 items-center justify-center rounded-2xl bg-teal text-[16px] font-bold text-white active:bg-teal-press disabled:opacity-60" />
            </div>
            <button
              onClick={finir}
              disabled={enCours}
              className="mt-2 flex h-11 w-full items-center justify-center text-[14.5px] font-bold text-slate"
            >
              Plus tard
            </button>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
