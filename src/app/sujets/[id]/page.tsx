import Link from "next/link";
import { notFound } from "next/navigation";
import { BackHeader } from "@/components/BackHeader";
import { Badge } from "@/components/EmptyState";
import { Icon } from "@/components/icons";
import { FilePreview } from "@/components/FilePreview";
import { DownloadButton } from "@/components/DownloadButton";
import { WhatsAppShareButton } from "@/components/WhatsAppShareButton";
import { ShareSheet } from "@/components/ShareSheet";
import { ToastButton } from "@/components/ToastButton";
import { getSimilarSubjects, getSubjectById } from "@/lib/data";
import { incrementSubjectDownload } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function SujetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const subjectId = Number(id);
  if (Number.isNaN(subjectId)) notFound();

  const subject = await getSubjectById(subjectId);
  if (!subject) notFound();

  const similaires = await getSimilarSubjects(subject.id, subject.filiere);

  return (
    <div className="relative min-h-dvh pb-[calc(92px+var(--safe-bottom))]">
      <BackHeader
        border
        right={
          <ShareSheet
            trigger={(open) => (
              <button
                onClick={open}
                className="press-scale grid h-11 w-11 place-items-center"
                aria-label="Partager"
              >
                <Icon name="share" size={19} strokeWidth={1.9} />
              </button>
            )}
          />
        }
      />

      <div className="px-5 pt-1">
        <div className="text-[24px] font-extrabold leading-tight tracking-tight">{subject.matiere}</div>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          <Badge tone="neutral">{subject.type}</Badge>
          <Badge tone={subject.corrige ? "teal" : "neutral"}>
            {subject.corrige ? "Corrigé disponible" : "Sans corrigé"}
          </Badge>
          <Badge tone="neutral">
            {subject.filiere} · {subject.niveau}
          </Badge>
        </div>

        <div className="mt-4 overflow-hidden rounded-[20px] border border-line bg-surface-3">
          {subject.fileUrl ? (
            <Link href={`/sujets/${subject.id}/plein`} className="block">
              <FilePreview url={subject.fileUrl} className="h-[360px] w-full border-0" />
            </Link>
          ) : (
            <div className="p-7 text-center">
              <div className="mx-auto mb-1 h-[11px] w-[52%] rounded-md bg-line-4" />
              <div className="mx-auto mt-5 h-2 w-[88%] rounded bg-line-3" />
              <div className="mx-auto mt-2.5 h-2 w-[94%] rounded bg-line-3" />
              <div className="mx-auto mt-2.5 h-2 w-[70%] rounded bg-line-3" />
              <div className="mt-6 text-[13px] font-semibold text-slate-light">
                Aperçu indisponible pour ce contenu de démonstration
              </div>
            </div>
          )}
        </div>

        <div className="mt-[18px] rounded-[20px] border border-line px-3.5">
          {[
            { label: "Année", valeur: subject.annee },
            { label: "Épreuve", valeur: subject.type },
            { label: "Corrigé", valeur: subject.corrige ? "Joint au document" : "Pas encore" },
            { label: "Vérifié le", valeur: subject.createdAt.toLocaleDateString("fr-FR") },
            { label: "Téléchargements", valeur: String(subject.downloads) },
          ].map((row) => (
            <div
              key={row.label}
              className="flex justify-between gap-3 border-b border-line-3 py-3 text-[14px] last:border-b-0"
            >
              <span className="text-slate-light">{row.label}</span>
              <span className="text-right font-bold">{row.valeur}</span>
            </div>
          ))}
        </div>

        {similaires.length > 0 && (
          <>
            <div className="mb-0.5 mt-6 text-[17px] font-extrabold tracking-tight">Dans la même filière</div>
            {similaires.map((s) => (
              <Link
                key={s.id}
                href={`/sujets/${s.id}`}
                className="flex items-center gap-3 border-b border-line-3 py-3.5 active:opacity-60"
              >
                <span className="grid h-[50px] w-[42px] flex-none place-items-center rounded-[10px] bg-surface text-teal-active">
                  <Icon name="doc" size={22} />
                </span>
                <span className="flex-1">
                  <span className="block text-[14.5px] font-bold">{s.matiere}</span>
                  <span className="mt-0.5 block text-[12.5px] text-slate-light">
                    {s.niveau} · {s.annee} · {s.type}
                  </span>
                </span>
                <Icon name="right" size={18} className="text-slate-light" />
              </Link>
            ))}
          </>
        )}

        <ToastButton
          message="Signalement envoyé à l'équipe"
          icon="flag"
          className="press-scale mt-5 flex h-12 w-full items-center justify-center gap-2 border-0 bg-none text-[13.5px] font-bold text-slate-light"
        >
          Signaler un problème sur ce sujet
        </ToastButton>
      </div>

      <div
        className="fixed inset-x-0 z-[4] flex gap-2.5 bg-white px-5 pb-[18px] pt-4"
        style={{ bottom: "calc(76px + var(--safe-bottom))" }}
      >
        <DownloadButton
          fileUrl={subject.fileUrl}
          onRecord={() => incrementSubjectDownload(subject.id)}
        />
        <WhatsAppShareButton
          text={`Regarde ce sujet sur Campusly : ${subject.matiere} (${subject.filiere} · ${subject.niveau})`}
          aria-label="Partager sur WhatsApp"
          className="press-scale grid h-[54px] w-[54px] flex-none place-items-center rounded-2xl border-[1.5px] border-line-4 bg-white active:bg-teal-tint-soft"
        >
          <Icon name="chat" size={19} strokeWidth={1.9} />
        </WhatsAppShareButton>
      </div>
    </div>
  );
}
