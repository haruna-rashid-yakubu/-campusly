"use client";

import { useState } from "react";
import { Icon } from "@/components/icons";
import { InstallButton } from "@/components/InstallButton";
import { CopyLinkButton } from "@/components/CopyLinkButton";
import type { InstallTab, Plateforme } from "@/lib/ua";
import { APP_DOMAIN, APP_URL } from "@/lib/constants";

const TABS: { id: InstallTab; label: string }[] = [
  { id: "Android", label: "Android" },
  { id: "iPhone", label: "iPhone" },
  { id: "Autre", label: "Autre appli" },
];

const ANDROID_STEPS = [
  { n: "1", texte: "Ouvre le menu de ton navigateur, en haut à droite.", visuel: "⋮", align: "flex-end" },
  { n: "2", texte: "Touche « Ajouter à l'écran d'accueil ».", visuel: "Ajouter à l'écran d'accueil", align: "flex-start" },
  { n: "3", texte: "Valide : l'icône Campusly apparaît sur ton écran.", visuel: "Installer", align: "center" },
];

const IPHONE_STEPS = [
  { n: "1", texte: `Ouvre ${APP_DOMAIN} dans Safari.`, visuel: APP_DOMAIN, align: "flex-start" },
  { n: "2", texte: "Touche le bouton Partager, en bas de l'écran.", visuel: "⬆︎", align: "center" },
  { n: "3", texte: "Choisis « Sur l'écran d'accueil », puis Ajouter.", visuel: "Sur l'écran d'accueil", align: "flex-start" },
];

export function InstallTabs({
  defaultTab,
  plateforme,
}: {
  defaultTab: InstallTab;
  plateforme: Plateforme;
}) {
  const [tab, setTab] = useState<InstallTab>(defaultTab);
  /*
   * "Autre appli" means an embedded browser, which exists on both phones —
   * Instagram and Facebook carry their own on Android too. It used to send
   * everyone to Safari, so an Android student was told to open an app their
   * phone does not have, and had no way out of the page at all.
   */
  const surIPhone = plateforme === "iPhone";
  const steps =
    tab === "Autre" ? (surIPhone ? IPHONE_STEPS : ANDROID_STEPS) : tab === "Android" ? ANDROID_STEPS : IPHONE_STEPS;
  const navigateur = surIPhone ? "Safari" : "Chrome";

  return (
    <div className="px-5 pb-12 pt-2">
      <div className="flex gap-1.5 rounded-2xl bg-surface-2 p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="h-[42px] flex-1 rounded-xl text-[13.5px] font-bold"
            style={{
              background: tab === t.id ? "#fff" : "transparent",
              color: tab === t.id ? "#0F172A" : "#64748B",
              boxShadow: tab === t.id ? "0 1px 3px rgba(15,23,42,.12)" : "none",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "Autre" ? (
        <>
          <div className="mt-4 rounded-[20px] border-[1.5px] border-teal bg-teal-tint-soft p-5">
            <span className="grid h-[52px] w-[52px] place-items-center rounded-[17px] bg-teal-tint text-teal-dark">
              <Icon name="safari" size={24} strokeWidth={1.7} />
            </span>
            <div className="mt-4 text-xl font-extrabold tracking-tight">
              Ouvre ce lien dans {navigateur}
            </div>
            <p className="mt-2 text-[14.5px] leading-relaxed text-slate">
              {surIPhone
                ? "Le menu Partager de cette appli n'a pas « Sur l'écran d'accueil » : seul Safari l'a. Copie le lien, ouvre Safari et colle-le."
                : "Le navigateur de cette appli ne sait pas installer Campusly. Copie le lien, ouvre Chrome et colle-le."}
            </p>
            <CopyLinkButton url={`${APP_URL}/installer`} />
          </div>
          <div className="mb-3 mt-6 text-base font-extrabold">Puis, dans {navigateur}</div>
        </>
      ) : (
        <>
          <div className="mt-4 flex items-center gap-2 rounded-2xl bg-teal-tint px-3.5 py-3 text-[13.5px] font-bold text-teal-active">
            <Icon name="check" size={18} strokeWidth={2.3} />
            {tab === "Android" ? "On a détecté un téléphone Android" : "On a détecté iPhone · Safari"}
          </div>
          {tab === "Android" && <InstallButton />}
          <div className="mb-3 mt-6 text-base font-extrabold">À la main, en 3 étapes</div>
        </>
      )}

      {steps.map((s) => (
        <div key={s.n} className="mb-3 flex gap-3.5 rounded-[20px] border border-line p-3.5">
          <span className="grid h-[30px] w-[30px] flex-none place-items-center rounded-[11px] bg-teal text-[14px] font-extrabold text-white">
            {s.n}
          </span>
          <div className="flex-1">
            <div className="text-[14.5px] font-semibold leading-snug">{s.texte}</div>
            <div
              className="mt-2.5 flex h-11 items-center rounded-xl px-3.5 font-extrabold"
              style={{
                background: s.n === "3" ? "#E6F7F5" : "#F2F6F7",
                color: s.n === "3" ? "#0A7F77" : "#334155",
                justifyContent: s.align,
              }}
            >
              {s.visuel}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
