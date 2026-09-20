import Link from "next/link";
import { auth } from "@/auth";
import { Logo } from "@/components/Logo";
import { Icon } from "@/components/icons";
import { ClasseSwitcher } from "@/components/ClasseSwitcher";
import { NotificationBell } from "@/components/NotificationBell";
import { ShareSheet } from "@/components/ShareSheet";
import {
  getClasseByLabel,
  getClasses,
  getLatestProgramme,
  getPreferredClasse,
  getRecentCite,
  getRecentSubjects,
  isBannerDismissed,
} from "@/lib/data";
import { dismissInstallBanner } from "@/lib/actions";
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

  const selectedClasse = await getClasseByLabel(classe);
  const latestProgramme = selectedClasse ? await getLatestProgramme(selectedClasse.id) : null;
  const programmeRecent = latestProgramme && isWithinLastWeek(latestProgramme.publishedAt);

  const firstName = session?.user?.name?.split(" ")[0] ?? null;

  const modules = [
    { href: "/sujets", titre: "Sujets", sous: "Anciens sujets", icon: "doc" as const },
    { href: "/logements", titre: "Logements", sous: "Cités vérifiées", icon: "bed" as const },
    { href: "/pressing", titre: "Pressing", sous: "Autour du campus", icon: "shirt" as const },
    { href: "/programme", titre: "Programme", sous: "De la semaine", icon: "cal" as const },
  ];

  return (
    <div className="min-h-dvh pb-[calc(92px+var(--safe-bottom))]">
      <div className="px-5" style={{ paddingTop: "calc(20px + var(--safe-top))" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Logo size={36} />
            <span className="text-xl font-extrabold tracking-tight">Campusly</span>
          </div>
          <div className="flex items-center">
            {session?.user?.role === "admin" && (
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
          <div className="text-[26px] font-extrabold leading-tight tracking-tight">
            {firstName ? `Salut ${firstName},` : "Salut,"}
          </div>
          <ClasseSwitcher value={classe} classes={classesRows.map((c) => c.label)} />
        </div>
      </div>

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

      <div className="grid grid-cols-2 gap-3 px-5 pt-5">
        {modules.map((m) => (
          <Link
            key={m.href}
            href={m.href}
            className="press-scale flex min-h-[100px] flex-col items-start justify-between rounded-[20px] border border-line bg-white p-3.5 active:bg-surface-3"
          >
            <span className="grid h-[42px] w-[42px] place-items-center rounded-[13px] bg-teal-tint text-teal-dark">
              <Icon name={m.icon} size={21} />
            </span>
            <span>
              <span className="block text-[15.5px] font-extrabold">{m.titre}</span>
              <span className="mt-px block text-[12.5px] text-slate-light">{m.sous}</span>
            </span>
          </Link>
        ))}
      </div>

      <div className="flex items-baseline justify-between px-5 pb-1.5 pt-6">
        <div className="text-lg font-extrabold tracking-tight">Nouveautés</div>
        <Link href="/sujets" className="text-[13.5px] font-bold text-teal-dark">
          Tout voir
        </Link>
      </div>
      <div className="px-5">
        {recentSubjects[0] && (
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
        {recentCite && (
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
