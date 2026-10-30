import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BackHeader } from "@/components/BackHeader";
import { Badge } from "@/components/EmptyState";
import { Icon } from "@/components/icons";
import { SujetViewer } from "@/components/SujetViewer";
import { ShareSheet } from "@/components/ShareSheet";
import { ToastButton } from "@/components/ToastButton";
import { getRelatedSubjects, getSubjectById } from "@/lib/data";
import { incrementSubjectDownload } from "@/lib/actions";
import { auth } from "@/auth";
import { SignInButton } from "@/components/SignInButton";
import { ouvrir, QUOTA, type Acces } from "@/lib/acces";
import { lienFichier } from "@/lib/fichiers";
import { jetonFichier } from "@/lib/jeton";
import { lireExtraction, versLecture } from "@/lib/numerisation/lecture";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const subjectId = Number(id);
  if (Number.isNaN(subjectId)) return { title: "Sujet introuvable" };
  const subject = await getSubjectById(subjectId);
  if (!subject) return { title: "Sujet introuvable" };
  return {
    title: `${subject.matiere} — ${subject.filiere} ${subject.niveau} (${subject.annee})`,
    description: `${subject.type} de ${subject.matiere} — ${subject.filiere}, ${subject.niveau}, ${subject.annee}.${subject.enseignant ? ` Enseignant : ${subject.enseignant}.` : ""}${subject.corrige ? " Corrigé disponible." : ""}`,
    alternates: { canonical: `/sujets/${subject.id}` },
  };
}

export default async function SujetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const subjectId = Number(id);
  if (Number.isNaN(subjectId)) notFound();

  const subject = await getSubjectById(subjectId);
  if (!subject) notFound();

  const [{ sameMatiere, sameFiliere }, session, extraction, extractionCorrige] = await Promise.all([
    getRelatedSubjects(subject.id, subject.matiere, subject.filiere),
    auth(),
    lireExtraction(subject.id).catch(() => null),
    subject.correctionUrl ? lireExtraction(subject.id, true).catch(() => null) : null,
  ]);
  // Opening the page is reading the Sujet: it counts against the account's day (lib/acces).
  const acces = await ouvrir(session?.user?.id ?? null, subject.id);
  const jeton = acces.ok ? jetonFichier(acces.userId) : undefined;
  const themes = extraction?.themes ?? [];

  return (
    <div className="relative min-h-dvh pb-[calc(92px+var(--safe-bottom))]">
      <BackHeader
        border
        right={
          <ShareSheet>
            <button
              className="press-scale grid h-11 w-11 place-items-center"
              aria-label="Partager"
            >
              <Icon name="share" size={19} strokeWidth={1.9} />
            </button>
          </ShareSheet>
        }
      />

      <div className="px-5 pt-2">
        <h1 className="text-[25px] font-extrabold leading-[1.15] tracking-tight">{subject.matiere}</h1>
        {/* What the paper is, once: the card and the details below do not say it again. */}
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-[14px] font-semibold text-slate">
          <span>
            {subject.type} · {subject.annee} · {subject.filiere} {subject.niveau}
          </span>
          {subject.corrige && <Badge tone="teal">Avec corrigé</Badge>}
        </div>

        {acces.ok ? (
          <SujetViewer
            subjectId={subject.id}
            matiere={subject.matiere}
            filiere={subject.filiere}
            niveau={subject.niveau}
            type={subject.type}
            annee={subject.annee}
            fileUrl={lienFichier(subject.id, subject.fileUrl, false, jeton)}
            correctionUrl={lienFichier(subject.id, subject.correctionUrl, true, jeton)}
            lectures={{
              sujet: extraction && versLecture(extraction, subject.id),
              correction: extractionCorrige && versLecture(extractionCorrige, subject.id),
            }}
            onRecord={incrementSubjectDownload.bind(null, subject.id)}
          />
        ) : (
          <Verrou raison={acces.raison} />
        )}

        {themes.length > 0 && (
          <div className="mt-7">
            <h2 className="text-[17px] font-extrabold tracking-tight">Thèmes abordés</h2>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {themes.map((t) => (
                <Badge key={t} tone="neutral">
                  {t}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <h2 className="mt-7 text-[17px] font-extrabold tracking-tight">Détails</h2>
        <div className="mt-3 rounded-[20px] border border-line px-3.5">
          {([
            {
              label: "Enseignant",
              valeur: subject.enseignant,
              // Tapping the name is how you find everything this lecturer has
              // given — combine it with the search box to narrow to one course.
              href: subject.enseignant
                ? `/sujets?enseignant=${encodeURIComponent(subject.enseignant)}`
                : undefined,
            },
            {
              label: "Corrigé",
              valeur: subject.correctionUrl
                ? "Disponible séparément"
                : subject.corrige
                ? "Joint au document"
                : "Pas encore",
            },
            { label: "Vérifié le", valeur: subject.createdAt.toLocaleDateString("fr-FR") },
            { label: "Téléchargements", valeur: String(subject.downloads) },
          ] as { label: string; valeur: string | null; href?: string }[])
            .filter((row) => row.valeur)
            .map((row) => (
              <div
                key={row.label}
                className="flex justify-between gap-3 border-b border-line-3 py-3 text-[14px] last:border-b-0"
              >
                <span className="text-slate-light">{row.label}</span>
                {row.href ? (
                  <Link href={row.href} className="text-right font-bold text-teal-dark underline">
                    {row.valeur}
                  </Link>
                ) : (
                  <span className="text-right font-bold">{row.valeur}</span>
                )}
              </div>
            ))}
        </div>

        {sameMatiere.length > 0 && (
          <>
            <div className="mb-0.5 mt-7 text-[17px] font-extrabold tracking-tight">
              Autres documents de {subject.matiere}
            </div>
            {sameMatiere.map((s) => (
              <Link
                key={s.id}
                href={`/sujets/${s.id}`}
                prefetch={false}
                className="flex items-center gap-3 border-b border-line-3 py-3.5 active:opacity-60"
              >
                <span className="grid h-[50px] w-[42px] flex-none place-items-center rounded-[10px] bg-surface text-teal-active">
                  <Icon name={s.type === "TD" ? "inbox" : "doc"} size={22} />
                </span>
                <span className="flex-1">
                  <span className="block text-[14.5px] font-bold">
                    {s.type} · {s.annee}
                  </span>
                  <span className="mt-0.5 block text-[12.5px] text-slate-light">
                    {s.filiere} · {s.niveau}
                    {s.corrige ? " · corrigé" : ""}
                  </span>
                </span>
                <Icon name="right" size={18} className="text-slate-light" />
              </Link>
            ))}
          </>
        )}

        {sameFiliere.length > 0 && (
          <>
            <div className="mb-0.5 mt-7 text-[17px] font-extrabold tracking-tight">Dans la même filière</div>
            {sameFiliere.map((s) => (
              <Link
                key={s.id}
                href={`/sujets/${s.id}`}
                prefetch={false}
                className="flex items-center gap-3 border-b border-line-3 py-3.5 active:opacity-60"
              >
                <span className="grid h-[50px] w-[42px] flex-none place-items-center rounded-[10px] bg-surface text-teal-active">
                  <Icon name={s.type === "TD" ? "inbox" : "doc"} size={22} />
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
    </div>
  );
}

/*
 * In place of the content, for a visitor or an account past its day's limit.
 * The rest of the page — what the paper is, its Thèmes, the others like it —
 * stays, so a shared link still says what it points to.
 */
function Verrou({ raison }: { raison: Exclude<Acces, { ok: true }>["raison"] }) {
  return (
    <div className="mt-4 rounded-[20px] border border-line bg-surface px-5 py-7 text-center">
      <span className="mx-auto mb-4 grid h-[60px] w-[60px] place-items-center rounded-[20px] bg-white text-teal-dark">
        <Icon name="lock" size={26} strokeWidth={1.7} />
      </span>
      {raison === "connexion" ? (
        <>
          <div className="text-[17px] font-extrabold">Connecte-toi pour lire ce sujet</div>
          <p className="mx-auto mt-2 max-w-xs text-[14px] leading-relaxed text-slate">
            Le texte complet, les photos d&rsquo;origine et le PDF sont réservés aux étudiants connectés. C&rsquo;est
            gratuit, avec ton compte Google.
          </p>
          <SignInButton className="press-scale mx-auto mt-5 flex h-[52px] w-full max-w-xs items-center justify-center rounded-2xl border-[1.5px] border-line-4 bg-white text-[15px] font-bold active:bg-surface-3" />
        </>
      ) : (
        <>
          <div className="text-[17px] font-extrabold">Limite du jour atteinte</div>
          <p className="mx-auto mt-2 max-w-xs text-[14px] leading-relaxed text-slate">
            Tu as ouvert {QUOTA} sujets différents en 24 heures. Ceux que tu as déjà ouverts restent accessibles ; les
            autres se débloquent au fil de la journée.
          </p>
        </>
      )}
    </div>
  );
}
