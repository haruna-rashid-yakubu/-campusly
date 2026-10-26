"use client";

import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import { noterVuePressing, preparerPressing } from "@/lib/actions";
import { Icon, type IconName } from "@/components/icons";
import { separerEmoji } from "@/lib/emoji";
import {
  PRESSING_CONDITIONS,
  PRESSING_RESUME,
  PRESSING_WHATSAPP,
} from "@/lib/pressing";

/*
 * Ordering is gated on the terms because the terms carry real obligations in
 * both directions — what gets refunded, what has to be declared, what happens
 * to laundry nobody collects. The summary sits above the button so the three
 * things that decide an order are visible without opening anything; the full
 * text is one tap away and the box cannot be ticked past it.
 */
export function PressingCommande({ nom }: { nom?: string | null }) {
  const [ouvert, setOuvert] = useState(false);
  const [accepte, setAccepte] = useState(false);

  const configure = PRESSING_WHATSAPP.length > 0;
  const actif = accepte && configure;

  const [envoi, startEnvoi] = useTransition();

  useEffect(() => {
    void noterVuePressing();
  }, []);

  // The reference is drawn on the server, which records the order at the same
  // time, so the service can match each WhatsApp message to Campusly.
  const commander = () =>
    startEnvoi(async () => {
      const { reference } = await preparerPressing();
      const message = [
        `Bonjour 👋 Je souhaite commander un service de pressing via Campusly (${reference}).`,
        "J'ai lu et accepté les conditions du service.",
        `Nom : ${nom?.trim() ?? ""}.`,
        "Liste des articles : ",
        "Lieu de récupération : ",
      ].join(" ");
      window.location.href = `https://wa.me/${PRESSING_WHATSAPP}?text=${encodeURIComponent(message)}`;
    });

  return (
    <div>
      <div className="rounded-[22px] border border-line p-4">
        <div className="flex items-start gap-3">
          <Image
            src="/pressing/logo.png"
            alt=""
            width={56}
            height={56}
            className="h-14 w-14 flex-none rounded-[16px]"
          />
          <div className="min-w-0 flex-1">
            <div className="text-[17px] font-extrabold tracking-tight">Pressing Campusly</div>
            <div className="mt-0.5 text-[13px] text-slate-light">
              Récupération et livraison sur le campus et aux alentours
            </div>
          </div>
        </div>

        <ul className="mt-3.5 border-t border-line-3 pt-3">
          {PRESSING_RESUME.map((ligne) => (
            <li key={ligne} className="flex items-start gap-2.5 py-1.5 text-[14px] leading-snug">
              <span className="mt-[3px] flex-none text-teal-dark">
                <Icon name="check" size={16} strokeWidth={2.6} />
              </span>
              <span>{ligne}</span>
            </li>
          ))}
        </ul>

        <button
          onClick={() => setOuvert((o) => !o)}
          aria-expanded={ouvert}
          className="mt-2 flex h-11 w-full items-center justify-between text-[14px] font-bold text-teal-dark"
        >
          {ouvert ? "Masquer les conditions" : "Lire les conditions"}
          <span
            className="transition-transform"
            style={{ transform: ouvert ? "rotate(180deg)" : "none" }}
          >
            <Icon name="chevD" size={18} strokeWidth={2.2} />
          </span>
        </button>

        {ouvert && (
          <div className="anim-fade mt-1 max-h-[46vh] overflow-y-auto rounded-[16px] bg-surface-2 p-3.5">
            {/* Shown exactly as written: these are the terms someone is about
                to accept, not a summary of them. */}
            <div className="text-[13.5px] leading-relaxed text-slate">
              {/* A line opening on an emoji is a section heading: drawn with its icon. */}
              {PRESSING_CONDITIONS.split("\n").map((ligne, i) => {
                const { icone, texte } = separerEmoji(ligne);
                if (!ligne.trim()) return <div key={i} className="h-2" />;
                return icone || texte !== ligne ? (
                  <div key={i} className="mt-2 flex items-center gap-1.5 font-extrabold text-ink first:mt-0">
                    {icone && <Icon name={icone as IconName} size={15} strokeWidth={2} className="flex-none text-teal-dark" />}
                    {texte}
                  </div>
                ) : (
                  <p key={i}>{ligne}</p>
                );
              })}
            </div>
          </div>
        )}

        <label className="mt-3 flex cursor-pointer items-start gap-3 border-t border-line-3 pt-3.5">
          <input
            type="checkbox"
            checked={accepte}
            onChange={(e) => setAccepte(e.target.checked)}
            className="sr-only"
          />
          <span
            aria-hidden
            className="mt-[1px] grid h-[22px] w-[22px] flex-none place-items-center rounded-[7px] border-[1.5px] transition-colors"
            style={{
              borderColor: accepte ? "var(--color-teal)" : "#CBD5E1",
              backgroundColor: accepte ? "var(--color-teal)" : "transparent",
              color: "#fff",
            }}
          >
            {accepte && <Icon name="check" size={15} strokeWidth={3} />}
          </span>
          <span className="text-[14px] font-semibold leading-snug">
            J&rsquo;ai lu et j&rsquo;accepte les conditions du service
          </span>
        </label>
      </div>

      {configure ? (
        <button
          onClick={commander}
          disabled={!actif || envoi}
          className="press-scale mt-3.5 flex h-[54px] w-full items-center justify-center gap-2.5 rounded-2xl text-[15.5px] font-bold transition-colors"
          style={
            actif
              ? { backgroundColor: "var(--color-teal)", color: "#fff" }
              : { backgroundColor: "#E2E8F0", color: "#94A3B8" }
          }
        >
          <Icon name="chat" size={20} strokeWidth={2} />
          {envoi ? "Ouverture…" : "Commander sur WhatsApp"}
        </button>
      ) : (
        /* Better an honest notice than a button opening a conversation with
           nobody — the dead campusly.app link taught that once already. */
        <div className="mt-3.5 rounded-2xl border-[1.5px] border-dashed border-line-2 p-4 text-center text-[13.5px] leading-snug text-slate-light">
          Le numéro WhatsApp du service n&rsquo;est pas encore configuré.
        </div>
      )}

      {!accepte && configure && (
        <p className="mt-2 text-center text-[12.5px] text-slate-light">
          Coche la case pour activer la commande.
        </p>
      )}
    </div>
  );
}
