import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { auth } from "@/auth";
import { Logo } from "@/components/Logo";
import { Icon } from "@/components/icons";
import { ClasseSwitcher } from "@/components/ClasseSwitcher";
import { NotificationBell } from "@/components/NotificationBell";
import { ShareSheet } from "@/components/ShareSheet";
import { InvitationAccueil } from "@/components/InvitationAccueil";
import { getProfilCourant } from "@/lib/actions";
import { OuvrirDansSafari } from "@/components/OuvrirDansSafari";
import { SignInButton } from "@/components/SignInButton";
import {
  getClasseByLabel,
  getClasseLabels,
  getClasses,
  getLatestProgramme,
  getPreferredClasse,
  getRecentCite,
  getRecentSubjects,
} from "@/lib/data";
import { SondageVote } from "@/components/SondageVote";
import { getMaReponse, getResultats, getSondageOuvert } from "@/lib/sondage";
import { boutiquesRecentes, cartesALaUne, getVendeurs } from "@/lib/vendeurs";
import { AlaUne } from "@/components/AlaUne";
import { cartesAnnonces, cartesEvenements, decorDuJour, rubanDuJour } from "@/lib/evenements";
import { DecorSaison } from "@/components/DecorSaison";
import { MaJournee } from "@/components/MaJournee";
import { getJourneeEtudiant } from "@/lib/journee";
import { AccueilServices } from "@/components/AccueilServices";
import { distanceLabel, fcfa, isWithinLastWeek } from "@/lib/utils";
import { TexteIcone } from "@/components/TexteIcone";

export const dynamic = "force-dynamic";

export default async function AccueilPage() {
  const session = await auth();
  const [classe, classesRows, recentSubjects, recentCite] = await Promise.all([
    getPreferredClasse(),
    getClasses(),
    getRecentSubjects(1),
    getRecentCite(),
  ]);

  // Belt and braces on the délégué alert: someone may be named while their
  // notifications are off, and would then never learn of it. The app says so
  // itself, every time they open it, until they have been on the screen.
  const mesPromosDeleguees = (await getClasseLabels(session?.user?.delegations ?? []))
    .map((c) => c.label)
    .join(" et ");

  const selectedClasse = await getClasseByLabel(classe);
  const [latestProgramme, journee] = selectedClasse
    ? await Promise.all([getLatestProgramme(selectedClasse.id), getJourneeEtudiant(selectedClasse.id)])
    : [null, null];
  const programmeRecent = latestProgramme && isWithinLastWeek(latestProgramme.publishedAt);

  // The name given at onboarding first, then Google's.
  const profil = await getProfilCourant();
  const firstName = profil.prenom ?? session?.user?.name?.split(" ")[0] ?? null;
  const vendeursOuverts = await getVendeurs();
  const boutiquesAnnoncees = boutiquesRecentes(vendeursOuverts);
  // The pressing is a Campusly service, not a shop in the list, but it has its own card here.
  // A campus event of the day goes first: it is gone tomorrow, the shops are not.
  const cartesUne = [...cartesEvenements(), ...cartesAnnonces(), ...(await cartesALaUne(await getVendeurs({ inclureInternes: true })))];
  const ruban = rubanDuJour();
  const decor = decorDuJour();

  // The open poll is answered right here, first thing under the greeting, and
  // stays with its results once answered, so the screen everyone lands on
  // carries the question until it closes.
  const sondage = await getSondageOuvert();
  const [sondageResultats, sondageMaReponse] = sondage
    ? await Promise.all([getResultats(sondage), getMaReponse(sondage.id)])
    : [null, null];


  return (
    <div className="relative isolate min-h-dvh pb-[calc(112px+var(--safe-bottom))]">
      {decor && <DecorSaison decor={decor} />}
      <div className="px-5" style={{ paddingTop: "calc(20px + var(--safe-top))" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Logo size={36} />
            <span className="text-xl font-extrabold tracking-tight">Campusly</span>
          </div>
          <div className="flex items-center">
            {(session?.user?.role === "admin" ||
              (session?.user?.delegations?.length ?? 0) > 0) && (
              <Link
                href="/admin"
                className="press-scale grid h-11 w-11 place-items-center text-ink-soft"
                aria-label="Administration"
              >
                <Icon name="shield" size={21} />
              </Link>
            )}
            <NotificationBell />
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between gap-2">
            <div className="text-[26px] font-extrabold leading-tight tracking-tight">
              {firstName ? `Salut ${firstName},` : "Salut,"}
            </div>
            {session?.user || profil.prenom ? (
              <Link
                href="/profil"
                aria-label="Mon profil"
                className="press-scale grid h-11 w-11 flex-none place-items-center rounded-full bg-teal-tint text-[17px] font-extrabold text-teal-dark"
              >
                {(firstName ?? "?").charAt(0).toUpperCase()}
              </Link>
            ) : (
              <SignInButton />
            )}
          </div>
          <ClasseSwitcher value={classe} classes={classesRows.map((c) => c.label)} />
        </div>
      </div>

      <MaJournee journee={journee} classe={classe} />

      {sondage && sondageResultats && (
        <section className="anim-fade mx-5 mt-5 rounded-[20px] border-[1.5px] border-teal-border bg-teal-tint-soft p-4">
          <div className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wide text-teal-dark">
            <Icon name="chat" size={15} strokeWidth={2} />
            Sondage · anonyme
          </div>
          <div className="mb-3 mt-1 text-[17px] font-extrabold leading-snug tracking-tight">
            {sondage.question}
          </div>
          <SondageVote
            sondageId={sondage.id}
            options={sondage.options}
            parOption={sondageResultats.parOption}
            maReponse={sondageMaReponse}
            ouvert
          />
        </section>
      )}

      {mesPromosDeleguees && (
        <Link
          href="/admin"
          className="anim-fade press-scale mx-5 mt-5 flex items-center gap-3 rounded-[20px] border border-teal-border bg-teal-tint-soft p-4 active:bg-teal-tint"
        >
          <span className="grid h-10 w-10 flex-none place-items-center rounded-[13px] bg-teal-tint text-teal-dark">
            <Icon name="check" size={19} strokeWidth={2.2} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[15px] font-extrabold">
              Tu es délégué de {mesPromosDeleguees}
            </span>
            <span className="mt-0.5 block text-[13.5px] leading-snug text-slate">
              Publie l&rsquo;emploi du temps de ta promo et valide les anciens sujets qu&rsquo;elle
              envoie.
            </span>
          </span>
          <Icon name="right" size={18} className="flex-none text-slate-light" />
        </Link>
      )}

      {ruban && (
        <div
          className="mx-5 mt-5 rounded-[14px] px-4 py-2.5 text-center text-[13.5px] font-extrabold text-white"
          style={{ background: ruban.couleur }}
        >
          <TexteIcone texte={ruban.texte} size={16} />
        </div>
      )}
      {cartesUne.length > 0 && <AlaUne cartes={cartesUne} />}

      <AccueilServices boutiques={vendeursOuverts.map((v) => ({ nom: v.nom, logo: v.logoCarreUrl }))} />

      <div className="flex items-baseline justify-between px-5 pb-1.5 pt-6">
        <div className="text-lg font-extrabold tracking-tight">Nouveautés</div>
        <Link href="/notifications" className="text-[13.5px] font-bold text-teal-dark">
          Tout voir
        </Link>
      </div>
      <div className="px-5">
        {/* Newly opened shops take the first lines while they are new; the
            latest paper comes back when there is none to announce, and the
            latest residence when only one shop is. */}
        {boutiquesAnnoncees.length > 0 ? (
          boutiquesAnnoncees.map((vendeurAnnonce, i) => (
            <Link
              key={vendeurAnnonce.slug}
              href={`/commander/${vendeurAnnonce.slug}`}
              style={{ "--i": i } as CSSProperties}
              className="anim-fade flex items-center gap-3 border-t border-line-3 py-3 active:opacity-60"
            >
              {vendeurAnnonce.logoCarreUrl ? (
                <Image
                  src={vendeurAnnonce.logoCarreUrl}
                  alt=""
                  width={46}
                  height={46}
                  className="h-[46px] w-[46px] flex-none rounded-[14px] bg-black object-cover"
                />
              ) : (
                <span className="grid h-[46px] w-[46px] flex-none place-items-center rounded-[14px] bg-surface text-teal-dark">
                  <Icon name="bag" size={20} />
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5">
                  <span className="text-[14.5px] font-bold">{vendeurAnnonce.nom}</span>
                  <span className="rounded-full bg-[#fde7ef] px-2 py-px text-[11px] font-extrabold text-[#c2185b]">
                    Nouveau
                  </span>
                </span>
                <span className="mt-0.5 block truncate text-[12.5px] text-slate-light">
                  {vendeurAnnonce.accroche ?? "À commander sur Campusly"}
                </span>
              </span>
              <Icon name="right" size={18} className="text-slate-light" />
            </Link>
          ))
        ) : recentSubjects[0] && (
          <Link
            href={`/sujets/${recentSubjects[0].id}`}
            className="anim-fade flex items-center gap-3 border-t border-line-3 py-3 active:opacity-60"
          >
            <span className="grid h-[46px] w-[46px] flex-none place-items-center rounded-[14px] bg-surface text-teal-dark">
              <Icon name="doc" size={20} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[14.5px] font-bold">
                {recentSubjects[0].matiere} · {recentSubjects[0].annee}
              </span>
              <span className="mt-0.5 block text-[12.5px] text-slate-light">
                Nouveau sujet · {recentSubjects[0].type.toLowerCase()}
                {recentSubjects[0].corrige ? " · corrigé" : ""}
              </span>
            </span>
            <Icon name="right" size={18} className="text-slate-light" />
          </Link>
        )}
        {recentCite && boutiquesAnnoncees.length < 2 && (
          <Link
            href={`/logements/${recentCite.id}`}
            style={{ "--i": 2 } as CSSProperties}
            className="anim-fade flex items-center gap-3 border-t border-line-3 py-3 active:opacity-60"
          >
            <span className="grid h-[46px] w-[46px] flex-none place-items-center rounded-[14px] bg-surface text-teal-dark">
              <Icon name="bed" size={20} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[14.5px] font-bold">{recentCite.nom}</span>
              <span className="mt-0.5 block text-[12.5px] text-slate-light">
                Logement · {distanceLabel(recentCite.distanceM)} · à partir de{" "}
                {fcfa(recentCite.minPrice)}
              </span>
            </span>
            <Icon name="right" size={18} className="text-slate-light" />
          </Link>
        )}
        {programmeRecent && (
          <Link
            href="/programme"
            style={{ "--i": 3 } as CSSProperties}
            className="anim-fade flex items-center gap-3 border-t border-b border-line-3 py-3 active:opacity-60"
          >
            <span className="grid h-[46px] w-[46px] flex-none place-items-center rounded-[14px] bg-surface text-teal-dark">
              <Icon name="cal" size={20} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[14.5px] font-bold">Programme {classe} publié</span>
              <span className="mt-0.5 block text-[12.5px] text-slate-light">
                Mis à jour le {latestProgramme!.publishedAt.toLocaleDateString("fr-FR")}
              </span>
            </span>
            <Icon name="right" size={18} className="text-slate-light" />
          </Link>
        )}
      </div>

      <div className="px-5 pb-7 pt-5">
        {/* After the screen has done its job, never before it. */}
        <OuvrirDansSafari />
        {/* One request at a time, the most useful first (see InvitationAccueil). */}
        <InvitationAccueil connecte={!!session?.user} profilIncomplet={!profil.prenom || !profil.telephone} />

        <ShareSheet>
          <button className="press-scale flex h-[52px] w-full items-center justify-center gap-2.5 rounded-2xl border-[1.5px] border-teal bg-white text-[15px] font-bold text-teal-dark active:bg-teal-tint-soft">
            <Icon name="share" size={19} strokeWidth={1.9} />
            Partager Campusly
          </button>
        </ShareSheet>
      </div>
    </div>
  );
}
