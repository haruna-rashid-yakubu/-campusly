"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Icon } from "@/components/icons";
import { preparerCommande, preparerCommandeMenu, repondreSondage, setClasse } from "@/lib/actions";
import type { Widget } from "@/lib/agent/types";

/*
 * What the assistant's tools put on screen, drawn as the app draws them
 * elsewhere: cards to tap, a menu, a receipt. The actions that commit the
 * student — sending an order, voting, changing promo — run here, on their
 * tap, through the same server actions as the pages.
 *
 * `onSuite` asks the assistant the next thing (tapping a shop asks for its
 * menu); `onQuitter` closes it before leaving for another page.
 */
const fcfa = (n: number) => `${n.toLocaleString("fr-FR").replace(/ /g, " ")} FCFA`;
const CARTE = "rounded-[18px] border border-line bg-white";

export function AgentWidget({ widget, onSuite, onQuitter }: { widget: Widget; onSuite: (q: string) => void; onQuitter: () => void }) {
  switch (widget.t) {
    case "sujets":
      return (
        <div className={`${CARTE} overflow-hidden`}>
          {widget.items.map((s) => (
            <div key={s.id} className="flex items-center gap-3 border-b border-line-3 px-3 py-2.5 last:border-b-0">
              <Link href={`/sujets/${s.id}`} onClick={onQuitter} className="press-scale flex min-w-0 flex-1 items-center gap-3">
                <span className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-[#eef0ff] text-[#4f46e5]">
                  <Icon name="doc" size={19} strokeWidth={1.9} />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[14.5px] font-extrabold">{s.matiere}</span>
                  <span className="block text-[12.5px] text-slate">
                    {s.type} · {s.annee} · {s.filiere} {s.niveau}
                    {s.corrige ? " · corrigé" : ""}
                  </span>
                </span>
              </Link>
              <Link
                href={`/sujets/${s.id}?tuteur=1`}
                onClick={onQuitter}
                className="press-scale flex h-8 flex-none items-center gap-1 rounded-full bg-[#4f46e5] px-2.5 text-[11.5px] font-black text-white"
                aria-label={`Réviser ${s.matiere} avec le tuteur IA`}
              >
                <Icon name="spark" size={12} strokeWidth={2.4} />
                Réviser
              </Link>
            </div>
          ))}
        </div>
      );

    case "programme":
      return (
        <div className={`${CARTE} p-3`}>
          <div className="mb-2 flex items-center gap-2 px-0.5 text-[12px] font-black uppercase tracking-[.07em] text-[#0d9488]">
            <Icon name="cal" size={14} strokeWidth={2.2} />
            {widget.titre}
          </div>
          {widget.jours.map((j) => (
            <div key={j.libelle} className="mt-1.5 first:mt-0">
              {widget.jours.length > 1 && <div className="mb-1 px-0.5 text-[13px] font-extrabold">{j.libelle}</div>}
              {j.cours.length === 0 ? (
                <div className="rounded-xl bg-surface px-3 py-2.5 text-[13.5px] text-slate">Pas de cours.</div>
              ) : (
                j.cours.map((c, i) => (
                  <div key={i} className="mb-1.5 flex items-start gap-3 rounded-xl bg-[#e6f7f5]/60 px-3 py-2.5 last:mb-0">
                    <span className="w-[62px] flex-none pt-px text-[13px] font-black tabular-nums text-[#0d9488]">{c.heures}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[14px] font-bold leading-snug">
                        {c.matiere}
                        {c.cc && <span className="ml-1.5 rounded-md bg-[#fef2f2] px-1.5 py-px text-[10.5px] font-black text-[#dc2626]">CC</span>}
                      </span>
                      <span className="block text-[12.5px] text-slate">{[c.salle, c.enseignant].filter(Boolean).join(" · ")}</span>
                    </span>
                  </div>
                ))
              )}
            </div>
          ))}
        </div>
      );

    case "boutiques":
      return (
        <div className="-mx-4 flex gap-2.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
          {widget.items.map((b) => (
            <button
              key={b.slug}
              onClick={() => onSuite(`Montre-moi la carte de ${b.nom}`)}
              className={`press-scale flex w-[150px] flex-none flex-col items-start p-3 text-left ${CARTE}`}
            >
              {b.logo ? (
                <Image src={b.logo} alt="" width={44} height={44} className="h-11 w-11 rounded-[12px] object-cover" />
              ) : (
                <span className="grid h-11 w-11 place-items-center rounded-[12px] bg-[#fdeef4] text-[16px] font-black text-[#c2185b]">{b.nom.charAt(0)}</span>
              )}
              <span className="mt-2 block w-full truncate text-[14px] font-extrabold">{b.nom}</span>
              <span className="mt-0.5 line-clamp-2 block text-[12px] leading-snug text-slate">{b.description ?? "Voir la carte"}</span>
            </button>
          ))}
        </div>
      );

    case "menu":
      return <Carte widget={widget} onSuite={onSuite} onQuitter={onQuitter} />;

    case "commande":
      return <Commande widget={widget} onSuite={onSuite} />;

    case "logements":
      return (
        <div className={`${CARTE} overflow-hidden`}>
          {widget.items.map((l) => (
            <Link key={l.id} href={`/logements/${l.id}`} onClick={onQuitter} className="press-scale flex items-center gap-3 border-b border-line-3 p-2.5 last:border-b-0">
              {l.photo ? (
                <Image src={l.photo} alt="" width={64} height={64} className="h-16 w-16 flex-none rounded-xl object-cover" />
              ) : (
                <span className="grid h-16 w-16 flex-none place-items-center rounded-xl bg-[#fff1e6] text-[#ea580c]">
                  <Icon name="bed" size={22} />
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14.5px] font-extrabold">{l.nom}</span>
                <span className="block text-[12.5px] text-slate">
                  {l.quartier} · {l.distance}
                </span>
                <span className="mt-1 flex flex-wrap items-center gap-1.5">
                  {l.prixMin && <span className="text-[13px] font-extrabold text-[#ea580c]">dès {fcfa(l.prixMin)}/mois</span>}
                  <span className={`rounded-md px-1.5 py-px text-[11px] font-black ${l.disponibles > 0 ? "bg-[#f0fdf4] text-[#16a34a]" : "bg-surface text-slate"}`}>
                    {l.disponibles > 0 ? `${l.disponibles} dispo` : "Complet"}
                  </span>
                </span>
              </span>
              <Icon name="right" size={16} className="flex-none text-slate-light" />
            </Link>
          ))}
        </div>
      );

    case "sondage":
      return <Sondage widget={widget} />;

    case "classe":
      return <ChangerClasse label={widget.label} />;

    case "liens":
      return (
        <div className="flex flex-col gap-2">
          {widget.items.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={onQuitter}
              className="press-scale flex h-12 items-center gap-3 rounded-2xl bg-ink px-4 text-[14.5px] font-extrabold text-white"
            >
              <Icon name={l.icone} size={18} strokeWidth={2} />
              <span className="flex-1">{l.libelle}</span>
              <Icon name="right" size={16} strokeWidth={2.4} />
            </Link>
          ))}
        </div>
      );

    case "notifications":
      return (
        <div className={`${CARTE} overflow-hidden`}>
          {widget.items.map((n, i) => (
            <Link key={i} href={n.href} onClick={onQuitter} className="press-scale flex items-center gap-3 border-b border-line-3 px-3 py-2.5 last:border-b-0">
              <span className="grid h-9 w-9 flex-none place-items-center rounded-xl bg-surface text-slate">
                <Icon name="bell" size={17} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-bold">{n.titre}</span>
                <span className="block truncate text-[12.5px] text-slate">{n.detail}</span>
              </span>
            </Link>
          ))}
        </div>
      );
  }
}

// A menu, its sections folded after the first; "+" asks the assistant to add the item.
function Carte({ widget, onSuite, onQuitter }: { widget: Extract<Widget, { t: "menu" }>; onSuite: (q: string) => void; onQuitter: () => void }) {
  const [ouverte, setOuverte] = useState(0);
  return (
    <div className={`${CARTE} overflow-hidden`}>
      <div className="flex items-center gap-2.5 border-b border-line-3 px-3 py-2.5">
        {widget.boutique.logo && <Image src={widget.boutique.logo} alt="" width={32} height={32} className="h-8 w-8 rounded-[10px] object-cover" />}
        <span className="flex-1 text-[14.5px] font-extrabold">{widget.boutique.nom}</span>
        <Link href={`/commander/${widget.boutique.slug}`} onClick={onQuitter} className="text-[12.5px] font-bold text-slate underline">
          Ouvrir la page
        </Link>
      </div>
      {widget.sections.map((s, i) => (
        <div key={s.titre} className="border-b border-line-3 last:border-b-0">
          <button onClick={() => setOuverte(ouverte === i ? -1 : i)} className="flex w-full items-center justify-between px-3 py-2.5 text-left text-[13px] font-black uppercase tracking-[.06em] text-slate">
            {s.titre}
            <Icon name="chevD" size={16} strokeWidth={2.2} className={`transition-transform ${ouverte === i ? "rotate-180" : ""}`} />
          </button>
          {ouverte === i &&
            s.items.map((it) => (
              <div key={it.nom} className={`anim-deplie flex items-center gap-3 px-3 pb-2.5 ${it.epuise ? "opacity-45" : ""}`}>
                <span className="min-w-0 flex-1">
                  <span className="block text-[14px] font-bold leading-snug">{it.nom}</span>
                  {it.description && <span className="line-clamp-1 block text-[12px] text-slate">{it.description}</span>}
                </span>
                {it.prix && <span className="flex-none text-[13px] font-extrabold tabular-nums">{it.epuise ? "Épuisé" : it.prix}</span>}
                {!it.epuise && it.prix && (
                  <button
                    onClick={() => onSuite(`Ajoute ${it.nom} à ma commande chez ${widget.boutique.nom}`)}
                    className="press-scale grid h-8 w-8 flex-none place-items-center rounded-full bg-teal text-white"
                    aria-label={`Ajouter ${it.nom}`}
                  >
                    <Icon name="plus" size={16} strokeWidth={2.6} />
                  </button>
                )}
              </div>
            ))}
        </div>
      ))}
    </div>
  );
}

// The receipt, and the one button that sends it to the shop on WhatsApp.
function Commande({ widget, onSuite }: { widget: Extract<Widget, { t: "commande" }>; onSuite: (q: string) => void }) {
  const [envoi, setEnvoi] = useState<{ etat: "pret" } | { etat: "envoye"; reference: string } | { etat: "erreur"; message: string }>({ etat: "pret" });
  const [enCours, demarrer] = useTransition();

  const envoyer = () =>
    demarrer(async () => {
      const e = widget.envoi;
      const r =
        e.genre === "menu"
          ? await preparerCommandeMenu({ vendeurId: e.vendeurId, lignes: e.lignes, mode: e.mode, precision: e.precision })
          : await preparerCommande({ vendeurId: e.vendeurId, panier: e.panier, precision: e.precision });
      if (!r.ok) return setEnvoi({ etat: "erreur", message: r.message });
      setEnvoi({ etat: "envoye", reference: r.reference });
      window.location.href = r.url;
    });

  return (
    <div className={`${CARTE} overflow-hidden`}>
      <div className="flex items-center gap-2.5 bg-surface px-3.5 py-3">
        {widget.boutique.logo ? (
          <Image src={widget.boutique.logo} alt="" width={36} height={36} className="h-9 w-9 rounded-[11px] object-cover" />
        ) : (
          <span className="grid h-9 w-9 place-items-center rounded-[11px] bg-white text-teal-dark">
            <Icon name="bag" size={18} />
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="block text-[11.5px] font-black uppercase tracking-[.07em] text-slate">Ta commande</span>
          <span className="block truncate text-[15px] font-extrabold">{widget.boutique.nom}</span>
        </span>
        {widget.remise && <span className="rounded-full bg-white px-2.5 py-1 text-[11.5px] font-bold">{widget.remise}</span>}
      </div>
      <div className="px-3.5 py-2.5">
        {widget.lignes.map((l, i) => (
          <div key={i} className="flex items-start justify-between gap-3 py-1 text-[14px]">
            <span className="min-w-0">
              <span className="font-extrabold">{l.quantite} ×</span> {l.libelle}
            </span>
            <span className="flex-none font-semibold tabular-nums">{fcfa(l.montant)}</span>
          </div>
        ))}
        {widget.frais.map((f) => (
          <div key={f.libelle} className="flex justify-between py-1 text-[13px] text-slate">
            <span>{f.libelle}</span>
            <span className="tabular-nums">{fcfa(f.montant)}</span>
          </div>
        ))}
        <div className="mt-1.5 flex items-baseline justify-between border-t border-dashed border-line-4 pt-2.5">
          <span className="text-[14px] font-extrabold">Total</span>
          <span className="text-[19px] font-black tabular-nums">{fcfa(widget.total)}</span>
        </div>
      </div>
      <div className="flex flex-col gap-2 px-3.5 pb-3.5">
        {envoi.etat === "envoye" ? (
          <div className="flex items-center gap-2 rounded-2xl bg-[#f0fdf4] px-3.5 py-3 text-[14px] font-bold text-[#166534]">
            <Icon name="check" size={18} strokeWidth={2.6} />
            Envoyée sur WhatsApp · réf. {envoi.reference}
          </div>
        ) : (
          <>
            {envoi.etat === "erreur" && <div className="rounded-xl bg-warn-tint px-3 py-2 text-[13px] font-semibold text-warn-ink">{envoi.message}</div>}
            <button
              onClick={envoyer}
              disabled={enCours}
              className="press-scale flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#25d366] text-[15px] font-extrabold text-white disabled:opacity-60"
            >
              {enCours ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Icon name="chat" size={18} strokeWidth={2.2} />}
              Envoyer la commande sur WhatsApp
            </button>
            <button onClick={() => onSuite("Je veux modifier ma commande")} className="press-scale h-10 text-[13.5px] font-bold text-slate">
              Modifier
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function Sondage({ widget }: { widget: Extract<Widget, { t: "sondage" }> }) {
  const [choix, setChoix] = useState<number | null>(widget.maReponse);
  const [message, setMessage] = useState<string | null>(null);
  const [enCours, demarrer] = useTransition();
  return (
    <div className={`${CARTE} p-3.5`}>
      <div className="mb-1 flex items-center gap-1.5 text-[11.5px] font-black uppercase tracking-[.08em] text-teal-dark">
        <Icon name="ballot" size={14} strokeWidth={2.2} />
        Sondage
      </div>
      <div className="text-[15px] font-extrabold leading-snug">{widget.question}</div>
      <div className="mt-2.5 flex flex-col gap-2">
        {widget.options.map((o, i) => (
          <button
            key={o}
            disabled={enCours}
            onClick={() =>
              demarrer(async () => {
                const r = await repondreSondage(widget.id, i);
                if (r.ok) {
                  setChoix(i);
                  setMessage("Réponse enregistrée, merci !");
                } else setMessage(r.message);
              })
            }
            className={`press-scale flex min-h-12 items-center gap-2.5 rounded-xl border-[1.5px] px-3 text-left text-[14px] font-semibold ${
              choix === i ? "border-teal bg-teal-tint text-teal-dark" : "border-line-4 bg-white"
            }`}
          >
            <span className={`grid h-5 w-5 flex-none place-items-center rounded-full border-2 ${choix === i ? "border-teal bg-teal text-white" : "border-line-4"}`}>
              {choix === i && <Icon name="check" size={11} strokeWidth={3.4} />}
            </span>
            {o}
          </button>
        ))}
      </div>
      {message && <div className="anim-deplie mt-2 text-[13px] font-semibold text-slate">{message}</div>}
    </div>
  );
}

function ChangerClasse({ label }: { label: string }) {
  const router = useRouter();
  const [fait, setFait] = useState(false);
  const [enCours, demarrer] = useTransition();
  return (
    <div className={`${CARTE} p-3.5`}>
      <div className="text-[15px] font-extrabold">Passer en {label} ?</div>
      <p className="mt-0.5 text-[13px] text-slate">Ton programme, tes sujets et tes rappels suivront cette promo.</p>
      {fait ? (
        <div className="mt-3 flex items-center gap-2 text-[14px] font-bold text-[#166534]">
          <Icon name="check" size={17} strokeWidth={2.6} />
          C&rsquo;est fait.
        </div>
      ) : (
        <button
          disabled={enCours}
          onClick={() =>
            demarrer(async () => {
              await setClasse(label);
              setFait(true);
              router.refresh();
            })
          }
          className="press-scale mt-3 flex h-11 w-full items-center justify-center rounded-2xl bg-teal text-[14.5px] font-extrabold text-white disabled:opacity-60"
        >
          Confirmer
        </button>
      )}
    </div>
  );
}
