import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { BackHeader } from "@/components/BackHeader";
import { SignInRequired } from "@/components/SignInRequired";
import { EmptyState, Badge } from "@/components/EmptyState";
import { Icon } from "@/components/icons";
import { ModerationCard } from "@/components/admin/ModerationCard";
import { StockControl } from "@/components/admin/StockControl";
import { ProgrammeGridForm, type Cell } from "@/components/admin/ProgrammeGridForm";
import {
  getCitesWithAvailability,
  getClasseByLabel,
  getClasses,
  getClassesWithoutRecentProgramme,
  getModerationQueue,
  getPreferredClasse,
  getProgrammeForWeek,
  getProposerFacets,
  getSubjects,
} from "@/lib/data";
import { addDays, mondayOf, toISODate, weekRangeLabel } from "@/lib/semaine";
import { distanceLabel, fcfa } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Administration",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const TABS = [
  { id: "sujets", label: "Envois" },
  { id: "publies", label: "Publiés" },
  { id: "cites", label: "Cités" },
  { id: "prog", label: "Programme" },
] as const;

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string }>;
}) {
  const session = await auth();
  if (!session?.user) return <SignInRequired backHref="/" title="Administration" />;
  if (session.user.role !== "admin") {
    return (
      <div className="min-h-dvh">
        <BackHeader title="Administration" fallbackHref="/" border />
        <EmptyState icon="lock" title="Réservé à l'équipe Campusly" body="Ton compte n'a pas les droits d'administration." />
      </div>
    );
  }

  const { tab: rawTab, q } = await searchParams;
  const tab = TABS.some((t) => t.id === rawTab) ? (rawTab as (typeof TABS)[number]["id"]) : "sujets";

  return (
    <div className="min-h-dvh">
      <BackHeader
        title="Administration"
        fallbackHref="/"
        right={
          <span className="grid h-[38px] w-[38px] flex-none place-items-center rounded-full bg-teal text-[15px] font-extrabold text-white">
            {session.user.name?.[0]?.toUpperCase() ?? "?"}
          </span>
        }
      />
      <div className="mb-4 px-5">
        <div className="flex gap-1.5 rounded-2xl bg-surface-2 p-1">
          {TABS.map((t) => (
            <Link
              key={t.id}
              href={`/admin?tab=${t.id}`}
              className="h-[42px] flex-1 rounded-xl text-center text-[12.5px] font-bold leading-[42px]"
              style={{
                background: tab === t.id ? "#fff" : "transparent",
                color: tab === t.id ? "#0F172A" : "#64748B",
                boxShadow: tab === t.id ? "0 1px 3px rgba(15,23,42,.12)" : "none",
              }}
            >
              {t.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="px-5 pb-12">
        {tab === "sujets" && <ModerationTab />}
        {tab === "publies" && <PubliesTab q={q} />}
        {tab === "cites" && <CitesTab />}
        {tab === "prog" && <ProgrammeTab />}
      </div>
    </div>
  );
}

async function ModerationTab() {
  const queue = await getModerationQueue();
  return (
    <>
      <div className="mb-3 text-[13px] text-slate-light">
        {queue.length} sujet{queue.length > 1 ? "s" : ""} en attente
      </div>
      {queue.length === 0 ? (
        <EmptyState icon="check" title="File vide" body="Tout est traité. Les nouveaux envois arrivent ici." />
      ) : (
        queue.map((s) => <ModerationCard key={s.id} submission={s} />)
      )}
    </>
  );
}

async function PubliesTab({ q }: { q?: string }) {
  const subjects = await getSubjects(q ? { q } : {});

  return (
    <>
      <form action="/admin" className="mb-3.5">
        <input type="hidden" name="tab" value="publies" />
        <div className="flex h-12 items-center gap-2.5 rounded-2xl bg-surface-2 px-3.5">
          <span className="flex-none text-slate-light">
            <Icon name="search" size={19} strokeWidth={2} />
          </span>
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Matière ou enseignant"
            className="min-w-0 flex-1 border-0 bg-transparent text-[15px] text-ink outline-none"
          />
        </div>
      </form>

      <div className="mb-2 text-[13px] text-slate-light">
        {subjects.length} sujet{subjects.length > 1 ? "s" : ""} en ligne
      </div>

      {subjects.length === 0 ? (
        <EmptyState icon="doc" title="Aucun sujet" body="Rien ne correspond à cette recherche." />
      ) : (
        subjects.map((s) => (
          <Link
            key={s.id}
            href={`/admin/sujets/${s.id}`}
            prefetch={false}
            className="flex items-center gap-3 border-b border-line-3 py-3 active:bg-surface-3"
          >
            <span className="grid h-[46px] w-[38px] flex-none place-items-center rounded-[9px] bg-surface text-teal-active">
              <Icon name={s.type === "TD" ? "inbox" : "doc"} size={20} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[14.5px] font-bold">{s.matiere}</span>
              <span className="mt-0.5 block truncate text-[12.5px] text-slate-light">
                {s.niveau} · {s.annee} · {s.type}
                {s.enseignant ? ` · ${s.enseignant}` : ""}
              </span>
            </span>
            <Icon name="right" size={18} className="flex-none text-slate-light" />
          </Link>
        ))
      )}
    </>
  );
}

async function CitesTab() {
  const cites = await getCitesWithAvailability();
  return (
    <>
      {cites.map((c) => (
        <div key={c.id} className="mb-3.5 rounded-[20px] border border-line p-3.5">
          <div className="flex items-center gap-3">
            <span className="grid h-[58px] w-[58px] flex-none place-items-center rounded-[14px] bg-line-3 text-[10.5px] font-semibold text-slate-light">
              photo
            </span>
            <div className="flex-1">
              <div className="text-[16px] font-extrabold">{c.nom}</div>
              <div className="mt-0.5 text-[12.5px] text-slate-light">
                {c.quartier} · {distanceLabel(c.distanceM)} · à partir de {fcfa(c.minPrice)}
              </div>
            </div>
          </div>
          <div className="mt-3 border-t border-line-3 pt-1.5">
            {c.roomTypes.map((r) => (
              <div key={r.id} className="flex items-center justify-between py-2.5">
                <div>
                  <div className="text-[14.5px] font-bold">{r.type}</div>
                  <div className="text-[12px] tabular-nums text-slate-light">{fcfa(r.prixMensuel)}</div>
                </div>
                <StockControl roomTypeId={r.id} initialStock={r.stock} />
              </div>
            ))}
          </div>
        </div>
      ))}
      <div className="flex h-[54px] w-full items-center justify-center gap-2.5 rounded-2xl border-[1.5px] border-dashed border-teal-border bg-teal-tint-soft text-[15px] font-bold text-teal-dark">
        L&rsquo;ajout de nouvelles cités se fait pour l&rsquo;instant hors de l&rsquo;appli — contacte l&rsquo;équipe technique.
      </div>
    </>
  );
}

// The grid is keyed on a Monday, so the editor always opens on the week that
// is running — the one a correction is most likely to be about.
function toCells(programme: { creneaux: { jour: number; moment: string; matiere: string; enseignant: string | null; salle: string | null; seance: number | null; seances: number | null; cc: boolean }[] } | undefined) {
  const cells: Record<string, Cell> = {};
  for (const c of programme?.creneaux ?? []) {
    cells[`${c.jour}-${c.moment}`] = {
      matiere: c.matiere,
      enseignant: c.enseignant ?? "",
      salle: c.salle ?? "",
      seance: c.seance ? String(c.seance) : "",
      seances: c.seances ? String(c.seances) : "",
      cc: c.cc,
    };
  }
  return cells;
}

async function ProgrammeTab() {
  const [classes, classe, manquantes] = await Promise.all([
    getClasses(),
    getPreferredClasse(),
    getClassesWithoutRecentProgramme(),
  ]);

  const semaine = mondayOf(new Date());
  const classeRow = await getClasseByLabel(classe);
  const [courante, precedente, facets] = await Promise.all([
    classeRow ? getProgrammeForWeek(classeRow.id, semaine) : Promise.resolve(undefined),
    classeRow
      ? getProgrammeForWeek(classeRow.id, addDays(semaine, -7))
      : Promise.resolve(undefined),
    getProposerFacets(),
  ]);

  return (
    <>
      <ProgrammeGridForm
        classes={classes.map((c) => c.label)}
        defaultClasse={classe}
        semaine={toISODate(semaine)}
        semaineLabel={`Semaine ${weekRangeLabel(semaine)}`}
        initial={toCells(courante)}
        initialWeekLabel={courante?.weekLabel ?? ""}
        initialSalle={courante?.salleDefaut ?? ""}
        previous={toCells(precedente)}
        matieres={facets.matiere ?? []}
      />
      <div className="mb-1 mt-7 text-base font-extrabold">Classes sans programme récent</div>
      {manquantes.map(({ classe: c, manquant }) => (
        <div key={c.id} className="flex items-center justify-between border-t border-line-3 py-3.5">
          <span className="text-[14.5px] font-semibold">{c.label}</span>
          <Badge tone={manquant ? "danger" : "teal"}>{manquant ? "Manquant" : "Publié"}</Badge>
        </div>
      ))}
    </>
  );
}
