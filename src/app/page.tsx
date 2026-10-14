import Image from "next/image";
import Link from "next/link";
import { auth } from "@/auth";
import { Logo } from "@/components/Logo";
import { Icon } from "@/components/icons";
import { ClasseSwitcher } from "@/components/ClasseSwitcher";
import { NotificationBell } from "@/components/NotificationBell";
import { ShareSheet } from "@/components/ShareSheet";
import { InstallNudge } from "@/components/InstallNudge";
import { NotifNudge } from "@/components/NotifNudge";
import { OuvrirDansSafari } from "@/components/OuvrirDansSafari";
import { SignInButton } from "@/components/SignInButton";
import { SignOutButton } from "@/components/SignOutButton";
import {
  getClasseByLabel,
  getClasseLabels,
  getClasses,
  getLatestProgramme,
  getPreferredClasse,
  getRecentCite,
  getRecentSubjects,
  isBannerDismissed,
} from "@/lib/data";
import { dismissInstallBanner } from "@/lib/actions";
import { SondageVote } from "@/components/SondageVote";
import { getMaReponse, getResultats, getSondageOuvert } from "@/lib/sondage";
import { boutiquesRecentes, getCatalogue, getVendeurs } from "@/lib/vendeurs";
import { AlaUne } from "@/components/AlaUne";
import { AccueilServices } from "@/components/AccueilServices";
import { distanceLabel, fcfa, isWithinLastWeek } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AccueilPage() {
  const session = await auth();
  const [classe, classesRows, bannerDismissed, recentSubjects, recentCite] = await Promise.all([
    getPreferredClasse(),
    getClasses(),
    isBannerDismissed(),
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
  const latestProgramme = selectedClasse ? await getLatestProgramme(selectedClasse.id) : null;
  const programmeRecent = latestProgramme && isWithinLastWeek(latestProgramme.publishedAt);

  const firstName = session?.user?.name?.split(" ")[0] ?? null;
  const vendeursOuverts = await getVendeurs();
  const boutiquesAnnoncees = boutiquesRecentes(vendeursOuverts);
  // The newest shop with a photo for it gets the big card, priced from its own catalogue.
  const vedette = boutiquesAnnoncees.find((v) => v.uneImage) ?? null;
  const vedetteCatalogue = vedette ? await getCatalogue(vedette.id) : null;
  const vedettePrix = vedetteCatalogue?.formules.length
    ? Math.min(...vedetteCatalogue.formules.map((f) => f.prix))
    : null;

  // The open poll is answered right here, first thing under the greeting, and
  // stays with its results once answered, so the screen everyone lands on
  // carries the question until it closes.
  const sondage = await getSondageOuvert();
  const [sondageResultats, sondageMaReponse] = sondage
    ? await Promise.all([getResultats(sondage), getMaReponse(sondage.id)])
    : [null, null];


  return (
    <div className="min-h-dvh pb-[calc(92px+var(--safe-bottom))]">
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
            {session?.user ? <SignOutButton /> : <SignInButton />}
          </div>
          <ClasseSwitcher value={classe} classes={classesRows.map((c) => c.label)} />
        </div>
      </div>

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

      {!bannerDismissed && (
        <div className="anim-fade mx-5 mt-5 rounded-[20px] border border-teal-border bg-teal-tint p-4">
          <div className="flex items-start gap-3">
            <span className="block h-10 w-10 flex-none">
              <Logo size={40} />
            </span>
            <div className="flex-1 pr-1.5">
              <div className="text-[15.5px] font-extrabold">Installe Campusly</div>
              <div className="mt-0.5 text-[13.5px] leading-relaxed text-teal-active">
                Sur ton écran d&rsquo;accueil : plus rapide, moins de data.
              </div>
            </div>
            <form action={dismissInstallBanner}>
              <button
                type="submit"
                className="press-scale grid h-8 w-8 flex-none place-items-center text-teal-dark"
                aria-label="Fermer"
              >
                <Icon name="x" size={20} strokeWidth={2} />
              </button>
            </form>
          </div>
          <div className="mt-3.5 flex gap-2.5">
            <Link
              href="/installer"
              className="press-scale flex h-[46px] flex-1 items-center justify-center rounded-[13px] bg-teal text-[14.5px] font-bold text-white active:bg-teal-press"
            >
              Installer
            </Link>
            <Link
              href="/installer"
              className="press-scale flex h-[46px] items-center px-3.5 text-[14px] font-bold text-teal-dark"
            >
              Comment faire ?
            </Link>
          </div>
        </div>
      )}

      {vedette && vedette.uneImage && vedetteCatalogue && vedettePrix !== null && (
        <AlaUne
          href={`/commander/${vedette.slug}`}
          nom={vedette.nom}
          image={vedette.uneImage}
          ligne={vedetteCatalogue.articles.map((a) => a.nom).join(" · ")}
          prix={
            vedette.unite && vedetteCatalogue.formules.length === 1 && vedetteCatalogue.formules[0].taille === 1
              ? `${fcfa(vedettePrix).replace(" FCFA", " F")} ${vedette.unite === "bouteille" ? "la" : "le"} ${vedette.unite}`
              : `À partir de ${fcfa(vedettePrix).replace(" FCFA", " F")}`
          }
          offre={vedette.fraisLivraison === 0 ? "Livraison gratuite" : null}
        />
      )}

      <AccueilServices boutiques={vendeursOuverts.map((v) => ({ nom: v.nom, logo: v.logoCarreUrl }))} />

      <div className="flex items-baseline justify-between px-5 pb-1.5 pt-6">
        <div className="text-lg font-extrabold tracking-tight">Nouveautés</div>
        <Link href="/sujets" className="text-[13.5px] font-bold text-teal-dark">
          Tout voir
        </Link>
      </div>
      <div className="px-5">
        {/* Newly opened shops take the first lines while they are new; the
            latest paper comes back when there is none to announce, and the
            latest residence when only one shop is. */}
        {boutiquesAnnoncees.length > 0 ? (
          boutiquesAnnoncees.map((vendeurAnnonce) => (
            <Link
              key={vendeurAnnonce.slug}
              href={`/commander/${vendeurAnnonce.slug}`}
              className="flex items-center gap-3 border-t border-line-3 py-3 active:opacity-60"
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
            className="flex items-center gap-3 border-t border-line-3 py-3 active:opacity-60"
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
            className="flex items-center gap-3 border-t border-line-3 py-3 active:opacity-60"
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
            className="flex items-center gap-3 border-t border-b border-line-3 py-3 active:opacity-60"
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
        {/* The offer was only on the timetable and on a sent paper, so the
            screen every opening lands on never made it. Of 537 devices this
            week, 163 put Campusly on their home screen and 126 can be
            reached -- the gap is mostly people who were never asked. It sits
            under the week rather than above it, for the same reason as
            everywhere else: the thing it offers has to be on screen first. */}
        <NotifNudge
          compact
          titre="Ton programme de demain, chaque soir"
          detail="À 20h, tes cours du lendemain avec les salles. Et un mot quand de nouvelles épreuves arrivent."
        />
        <InstallNudge />

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
