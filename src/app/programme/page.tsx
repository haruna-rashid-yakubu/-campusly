import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ClasseSwitcher } from "@/components/ClasseSwitcher";
import { ShareSheet } from "@/components/ShareSheet";
import { ToastButton } from "@/components/ToastButton";
import { DownloadButton } from "@/components/DownloadButton";
import { ProgrammeGrid } from "@/components/ProgrammeGrid";
import { NotifNudge } from "@/components/NotifNudge";
import { Icon } from "@/components/icons";
import { getClasseByLabel, getClasses, getLatestProgramme, getPreferredClasse } from "@/lib/data";

export const metadata: Metadata = {
  title: "Programme de la semaine",
  description: "Le programme de cours de la semaine, par classe, pour l'UCAC Nkolbisson.",
  alternates: { canonical: "/programme" },
};

export const dynamic = "force-dynamic";

export default async function ProgrammePage() {
  const [classe, classesRows] = await Promise.all([getPreferredClasse(), getClasses()]);
  const classeRow = await getClasseByLabel(classe);
  const programme = classeRow ? await getLatestProgramme(classeRow.id) : null;

  return (
    <div className="min-h-dvh pb-[calc(92px+var(--safe-bottom))]">
      <div className="sticky top-0 z-10 bg-white px-5" style={{ paddingTop: "calc(20px + var(--safe-top))" }}>
        <div className="pb-3">
          <div className="text-[24px] font-extrabold tracking-tight">Programme</div>
          <ClasseSwitcher value={classe} classes={classesRows.map((c) => c.label)} variant="field" />
          <div className="mt-2.5 text-[13px] text-slate-light">
            {programme
              ? `${programme.weekLabel} — mis à jour le ${programme.publishedAt.toLocaleDateString("fr-FR")} à ${programme.publishedAt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`
              : "Aucune publication pour cette classe pour l'instant"}
          </div>
        </div>
      </div>

      {programme ? (
        <>
          {/* The photograph leads. It is the document students recognise from
              the noticeboard, so seeing it first is what tells them this is
              their week; the grid underneath is what they then read. */}
          <div className="px-5 pt-3">
            {programme.photoUrl && (
              <Link
                href="/programme/plein"
                className="press-scale relative mb-4 block h-[360px] overflow-hidden rounded-[20px] bg-line-3"
              >
                <Image
                  src={programme.photoUrl}
                  alt="Programme de la semaine"
                  fill
                  priority
                  className="object-cover"
                />
                <span className="absolute bottom-3 right-3 flex h-10 items-center gap-1.5 rounded-[13px] bg-ink/80 px-3.5 text-[12.5px] font-bold text-white">
                  <Icon name="full" size={18} strokeWidth={2} />
                  Plein écran
                </span>
              </Link>
            )}

            <ProgrammeGrid
              creneaux={programme.creneaux}
              salleDefaut={programme.salleDefaut}
            />

            {/* Offered here because the week it is about is on screen: there
                is nothing to explain. */}
            <NotifNudge
              titre="Tu veux qu'on te le rappelle ?"
              detail="Chaque soir à 20h, tes cours du lendemain et les CC qui approchent."
            />

            {programme.creneaux.length === 0 && !programme.photoUrl && (
              <p className="py-6 text-center text-[14.5px] text-slate-light">
                Rien d&rsquo;enregistré pour cette semaine.
              </p>
            )}

            {/* The week on screen can be last week's, or wrong. Whoever walks
                past the board can fix that in one photograph. */}
            <Link
              href="/programme/proposer"
              className="press-scale mb-2 flex h-[50px] w-full items-center justify-center gap-2 rounded-2xl border-[1.5px] border-line-4 bg-white text-[14.5px] font-bold text-ink-soft active:bg-surface-2"
            >
              <Icon name="cal" size={18} strokeWidth={1.9} />
              Envoyer la photo du tableau
            </Link>
          </div>

          <div className="fixed inset-x-0 z-[4] flex gap-2.5 bg-white px-5 pb-[18px] pt-4" style={{ bottom: "calc(76px + var(--safe-bottom))" }}>
            <DownloadButton fileUrl={programme.photoUrl} />
            <ShareSheet>
              <button
                className="press-scale grid h-[54px] w-[54px] flex-none place-items-center rounded-2xl border-[1.5px] border-line-4 bg-white active:bg-teal-tint-soft"
                aria-label="Partager"
              >
                <Icon name="share" size={19} strokeWidth={1.9} />
              </button>
            </ShareSheet>
          </div>
        </>
      ) : (
        <div className="anim-fade px-8 pt-16 text-center">
          <span className="mx-auto mb-[18px] grid h-[78px] w-[78px] place-items-center rounded-[26px] bg-surface text-slate-light">
            <Icon name="cal" size={34} strokeWidth={1.5} />
          </span>
          <div className="text-lg font-extrabold leading-snug">
            Programme pas encore disponible pour cette semaine.
          </div>
          <p className="mx-auto mt-2.5 max-w-xs text-[14.5px] leading-relaxed text-slate-light">
            Dès que la photo est affichée aux valves, on la met ici.
          </p>
          <Link
            href="/programme/proposer"
            className="press-scale mx-auto mt-5 flex h-[52px] w-full max-w-xs items-center justify-center gap-2.5 rounded-2xl bg-teal text-[15px] font-bold text-white active:bg-teal-press"
          >
            <Icon name="cal" size={19} strokeWidth={1.9} />
            Envoyer la photo du tableau
          </Link>
          <ToastButton
            message="On te prévient dès la publication"
            icon="bell"
            className="press-scale mx-auto mt-2.5 flex h-[50px] items-center gap-2.5 rounded-2xl px-5 text-[14.5px] font-bold text-teal-dark"
          >
            Me prévenir
          </ToastButton>
        </div>
      )}
    </div>
  );
}
