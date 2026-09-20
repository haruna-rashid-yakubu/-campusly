import { auth } from "@/auth";
import { BackHeader } from "@/components/BackHeader";
import { SignInRequired } from "@/components/SignInRequired";
import { Badge, EmptyState } from "@/components/EmptyState";
import { getUserSubmissions } from "@/lib/data";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  en_attente: "En attente",
  publie: "Publié",
  refuse: "Refusé",
};

const STATUS_TONE: Record<string, "teal" | "danger" | "warn"> = {
  publie: "teal",
  refuse: "danger",
  en_attente: "warn",
};

export default async function MesEnvoisPage() {
  const session = await auth();
  if (!session?.user) {
    return <SignInRequired backHref="/sujets" title="Mes envois" />;
  }

  const submissions = await getUserSubmissions(session.user.id);

  return (
    <div className="min-h-dvh pb-[calc(92px+var(--safe-bottom))]">
      <BackHeader title="Mes envois" fallbackHref="/sujets" border />
      <div className="px-5 pt-4">
        {submissions.length === 0 ? (
          <EmptyState icon="inbox" title="Aucun envoi pour l'instant" body="Les sujets que tu proposes apparaissent ici avec leur statut." />
        ) : (
          submissions.map((s) => (
            <div key={s.id} className="mb-3 rounded-[20px] border border-line p-[15px]">
              <div className="flex items-start justify-between gap-2.5">
                <div>
                  <div className="text-[15.5px] font-extrabold">{s.matiere}</div>
                  <div className="mt-0.5 text-[12.5px] text-slate-light">
                    {s.niveau} · {s.annee} · {s.type}
                  </div>
                </div>
                <Badge tone={STATUS_TONE[s.status]}>{STATUS_LABEL[s.status]}</Badge>
              </div>
              <div className="mt-[11px] border-t border-line-3 pt-[11px] text-[13px] leading-relaxed text-slate-light">
                {s.status === "refuse" && s.note
                  ? s.note
                  : s.status === "publie"
                  ? `En ligne depuis le ${s.reviewedAt?.toLocaleDateString("fr-FR") ?? ""}`
                  : `Envoyé le ${s.createdAt.toLocaleDateString("fr-FR")} · vérification sous 48 h`}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
