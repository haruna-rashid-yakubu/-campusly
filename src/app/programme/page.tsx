import Link from "next/link";
import Image from "next/image";
import { ClasseSwitcher } from "@/components/ClasseSwitcher";
import { ShareSheet } from "@/components/ShareSheet";
import { ToastButton } from "@/components/ToastButton";
import { DownloadButton } from "@/components/DownloadButton";
import { Icon } from "@/components/icons";
import { getClasseByLabel, getClasses, getLatestProgramme, getPreferredClasse } from "@/lib/data";

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
          <div className="px-5 pt-3">
            <Link
              href="/programme/plein"
              className="press-scale relative block h-[420px] overflow-hidden rounded-[20px] bg-line-3"
            >
              <Image src={programme.photoUrl} alt="Programme de la semaine" fill className="object-cover" />
              <span className="absolute bottom-3 right-3 flex h-10 items-center gap-1.5 rounded-[13px] bg-ink/80 px-3.5 text-[12.5px] font-bold text-white">
                <Icon name="full" size={18} strokeWidth={2} />
                Plein écran
              </span>
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
          <ToastButton
            message="On te prévient dès la publication"
            icon="bell"
            className="press-scale mx-auto mt-5 flex h-[50px] items-center gap-2.5 rounded-2xl border-[1.5px] border-teal px-5 text-[14.5px] font-bold text-teal-dark"
          >
            Me prévenir
          </ToastButton>
        </div>
      )}
    </div>
  );
}
