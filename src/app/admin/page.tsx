import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { BackHeader } from "@/components/BackHeader";
import { SignInRequired } from "@/components/SignInRequired";
import { EmptyState, Badge } from "@/components/EmptyState";
import { Icon } from "@/components/icons";
import { ModerationCard } from "@/components/admin/ModerationCard";
import { StockControl } from "@/components/admin/StockControl";
import { CiteForm } from "@/components/admin/CiteForm";
import { DelegueForm } from "@/components/admin/DelegueForm";
import { PropositionCard } from "@/components/admin/PropositionCard";
import {
  cellKey,
  halfKey,
  ProgrammeGridForm,
  type Cell,
} from "@/components/admin/ProgrammeGridForm";
import { DEMI_JOURNEES } from "@/lib/constants";
import {
  getCitesWithAvailability,
  getClasseByLabel,
  getClasseLabels,
  getClasses,
  getDelegations,
  getClassesWithoutRecentProgramme,
  getModerationQueue,
  getPreferredClasse,
  getProgrammeForWeek,
  getAudience,
  getCouverture,
  getJournalNotifications,
  getProposerFacets,
  getPropositionsProgramme,
  getSubjects,
} from "@/lib/data";
import { addDays, mondayOf, nowInWAT, toISODate, weekRangeLabel } from "@/lib/semaine";
import { distanceLabel, fcfa } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Administration",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const TABS = [
  { id: "sujets", label: "Envois" },
  { id: "publies", label: "Publiés" },
  { id: "prog", label: "Programme" },
  { id: "monde", label: "Audience" },
  { id: "cites", label: "Cités" },
  { id: "delegues", label: "Délégués" },
] as const;

type TabId = (typeof TABS)[number]["id"];

/*
 * A délégué is handed the two jobs the role exists for and nothing else. The
 * promos list, the audience figures and the cités belong to whoever runs the
 * whole app, and a screen that showed them greyed out would only invite the
 * question of why.
 */
const TABS_DELEGUE: TabId[] = ["sujets", "prog"];

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string }>;
}) {
  const session = await auth();
  if (!session?.user) return <SignInRequired backHref="/" title="Administration" />;

  const estAdmin = session.user.role === "admin";
  const mesPromos = estAdmin
    ? []
    : (await getClasseLabels(session.user.delegations ?? [])).map((c) => c.label);

  if (!estAdmin && mesPromos.length === 0) {
    return (
      <div className="min-h-dvh">
        <BackHeader title="Administration" fallbackHref="/" border />
        <EmptyState icon="lock" title="Réservé à l'équipe Campusly" body="Ton compte n'a pas les droits d'administration." />
      </div>
    );
  }

  const onglets = estAdmin ? TABS : TABS.filter((t) => TABS_DELEGUE.includes(t.id));
  const { tab: rawTab, q } = await searchParams;
  const tab = onglets.some((t) => t.id === rawTab) ? (rawTab as TabId) : onglets[0].id;

  return (
    <div className="min-h-dvh">
      <BackHeader
        title={estAdmin ? "Administration" : "Espace délégué"}
        fallbackHref="/"
        right={
          <span className="grid h-[38px] w-[38px] flex-none place-items-center rounded-full bg-teal text-[15px] font-extrabold text-white">
            {session.user.name?.[0]?.toUpperCase() ?? "?"}
          </span>
        }
      />
      <div className="mb-4 px-5">
        <div className="flex gap-1.5 rounded-2xl bg-surface-2 p-1">
          {onglets.map((t) => (
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
        {tab === "sujets" && <ModerationTab promos={estAdmin ? undefined : mesPromos} />}
        {tab === "publies" && <PubliesTab q={q} />}
        {tab === "cites" && <CitesTab />}
        {tab === "prog" && <ProgrammeTab promos={estAdmin ? undefined : mesPromos} />}
        {tab === "monde" && <AudienceTab />}
        {tab === "delegues" && <DeleguesTab />}
      </div>
    </div>
  );
}

async function ModerationTab({ promos }: { promos?: string[] }) {
  const queue = await getModerationQueue(promos);
  return (
    <>
      <div className="mb-3 text-[13px] text-slate-light">
        {queue.length} sujet{queue.length > 1 ? "s" : ""} en attente
        {promos ? ` · ${promos.join(", ")}` : ""}
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
      {cites.length === 0 && (
        <p className="mb-3.5 text-[14px] leading-snug text-slate-light">
          Aucune cité référencée. La première que tu ajoutes apparaîtra aussitôt dans Logements.
        </p>
      )}
      <CiteForm />
    </>
  );
}

// The grid is keyed on a Monday, so the editor always opens on the week that
// is running — the one a correction is most likely to be about.
type CreneauRow = {
  jour: number;
  debut: number;
  fin: number;
  matiere: string;
  abrege: string | null;
  enseignant: string | null;
  salle: string | null;
  seance: number | null;
  seances: number | null;
  cc: boolean;
};

function toCells(programme: { creneaux: CreneauRow[] } | undefined) {
  const cells: Record<string, Cell> = {};
  // A half-day counts as split when its course does not span both slots —
  // that is what tells the editor to open it as two fields rather than one.
  const divise: string[] = [];
  for (const c of programme?.creneaux ?? []) {
    cells[cellKey(c.jour, c.debut)] = {
      matiere: c.matiere,
      abrege: c.abrege ?? "",
      enseignant: c.enseignant ?? "",
      salle: c.salle ?? "",
      seance: c.seance ? String(c.seance) : "",
      seances: c.seances ? String(c.seances) : "",
      cc: c.cc,
    };
    if (c.debut === c.fin) {
      const demi = DEMI_JOURNEES.find((d) => (d.slots as readonly number[]).includes(c.debut));
      if (demi) {
        const k = halfKey(c.jour, demi.id);
        if (!divise.includes(k)) divise.push(k);
      }
    }
  }
  return { cells, divise };
}

async function ProgrammeTab({ promos }: { promos?: string[] }) {
  const [toutes, preferee, manquantes, propositions] = await Promise.all([
    getClasses(),
    getPreferredClasse(),
    promos ? Promise.resolve([]) : getClassesWithoutRecentProgramme(),
    getPropositionsProgramme(promos),
  ]);

  // A délégué fills the grid for their own promos; the picker simply has
  // nothing else in it, so there is no wrong promo to choose by accident.
  const labels = promos ?? toutes.map((c) => c.label);
  const classe = labels.includes(preferee) ? preferee : labels[0];

  const semaine = mondayOf(new Date());
  const classeRow = await getClasseByLabel(classe);
  const [courante, precedente, facets] = await Promise.all([
    classeRow ? getProgrammeForWeek(classeRow.id, semaine) : Promise.resolve(undefined),
    classeRow
      ? getProgrammeForWeek(classeRow.id, addDays(semaine, -7))
      : Promise.resolve(undefined),
    getProposerFacets(),
  ]);

  const actuelle = toCells(courante);
  const derniere = toCells(precedente);

  return (
    <>
      {/* The queue comes first: answering a photo someone already took beats
          typing the same week in by hand. */}
      {propositions.length > 0 && (
        <>
          <div className="mb-2.5 text-base font-extrabold">
            {propositions.length} photo{propositions.length > 1 ? "s" : ""} du tableau à valider
          </div>
          {propositions.map((p) => (
            <PropositionCard
              key={p.id}
              proposition={{
                id: p.id,
                classeLabel: p.classeLabel,
                semaineLabel: `Semaine ${weekRangeLabel(p.semaine)}`,
                photoUrl: p.photoUrl,
                note: p.note,
                auteur: p.auteur,
              }}
            />
          ))}
          <div className="mb-3.5 mt-6 border-t border-line-3" />
        </>
      )}

      <ProgrammeGridForm
        classes={labels}
        defaultClasse={classe}
        semaine={toISODate(semaine)}
        semaineLabel={`Semaine ${weekRangeLabel(semaine)}`}
        initial={actuelle.cells}
        initialDivise={actuelle.divise}
        initialWeekLabel={courante?.weekLabel ?? ""}
        initialSalle={courante?.salleDefaut ?? ""}
        previous={derniere.cells}
        previousDivise={derniere.divise}
        matieres={facets.matiere ?? []}
      />
      {manquantes.length > 0 && (
        <div className="mb-1 mt-7 text-base font-extrabold">Classes sans programme récent</div>
      )}
      {manquantes.map(({ classe: c, manquant }) => (
        <div key={c.id} className="flex items-center justify-between border-t border-line-3 py-3.5">
          <span className="text-[14.5px] font-semibold">{c.label}</span>
          <Badge tone={manquant ? "danger" : "teal"}>{manquant ? "Manquant" : "Publié"}</Badge>
        </div>
      ))}
    </>
  );
}


function Chiffre({ valeur, legende }: { valeur: number; legende: string }) {
  return (
    <div className="rounded-[18px] border border-line p-3.5">
      <div className="text-[26px] font-extrabold leading-none tracking-tight tabular-nums">
        {valeur}
      </div>
      <div className="mt-1 text-[12px] leading-snug text-slate-light">{legende}</div>
    </div>
  );
}

const LIBELLE_ENVOI: Record<string, string> = {
  programme: "Programme publié",
  rappel: "Rappel du soir",
  admin: "Alerte équipe",
  delegue: "Alerte délégué",
  delegation: "Nomination",
  etudiant: "Réponse à un étudiant",
  test: "Test",
  tous: "Tout le monde",
};

async function JournalNotifications() {
  const envois = await getJournalNotifications(30);
  if (envois.length === 0) {
    return (
      <p className="mb-6 text-[13.5px] leading-snug text-slate-light">
        Aucune notification enregistrée pour l&rsquo;instant. Les envois partis avant aujourd&rsquo;hui
        ne figurent pas ici : le journal commence maintenant.
      </p>
    );
  }
  return (
    <div className="mb-7">
      {envois.map((e) => (
        <div key={e.id} className="border-b border-line-3 py-3">
          <div className="flex items-baseline gap-2">
            <span className="text-[14.5px] font-bold">
              {LIBELLE_ENVOI[e.type] ?? e.type}
              {e.classeLabel ? ` · ${e.classeLabel}` : ""}
            </span>
            <span className="ml-auto flex-none text-[12.5px] tabular-nums text-slate-light">
              {e.createdAt.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })}{" "}
              {e.createdAt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
          <div className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-slate">{e.corps}</div>
          {/* Zero is the number worth seeing: it means the message rang nowhere. */}
          <div
            className="mt-1 text-[12.5px] font-bold tabular-nums"
            style={{ color: e.atteints === 0 ? "#B4231F" : "#0A7F77" }}
          >
            {e.atteints} appareil{e.atteints > 1 ? "s" : ""} atteint
            {e.atteints > 1 ? "s" : ""}
            {e.vises !== e.atteints ? ` sur ${e.vises} visé${e.vises > 1 ? "s" : ""}` : ""}
          </div>
        </div>
      ))}
    </div>
  );
}

async function AudienceTab() {
  const a = await getAudience();
  const maxJour = Math.max(1, ...a.parJour.map((j) => j.appareils));

  return (
    <>
      {/* First, because it answers the question that was being asked of the
          database by hand: did the last notification reach anybody. */}
      <div className="mb-2 text-base font-extrabold tracking-tight">Notifications envoyées</div>
      <JournalNotifications />

      <div className="grid grid-cols-2 gap-2.5">
        <Chiffre valeur={a.aujourdhui} legende="Appareils aujourd'hui" />
        <Chiffre valeur={a.sept_jours} legende="Appareils ces 7 jours" />
        <Chiffre valeur={a.total} legende="Appareils depuis le début" />
        <Chiffre valeur={a.fideles} legende="Revenus un autre jour" />
        <Chiffre valeur={a.installes_sept_jours} legende="Ouvrent depuis l'écran d'accueil" />
      </div>

      <p className="mt-3 text-[12.5px] leading-snug text-slate-light">
        « Revenus un autre jour » est le seul chiffre qui dit si l&rsquo;appli tient : le reste
        mesure surtout si le lien a été cliqué. {a.nouveaux_sept_jours} nouvel
        {a.nouveaux_sept_jours > 1 ? "s" : ""} appareil
        {a.nouveaux_sept_jours > 1 ? "s" : ""} cette semaine, {a.ouvertures_sept_jours} ouverture
        {a.ouvertures_sept_jours > 1 ? "s" : ""} au total.
      </p>

      <div className="mb-2 mt-7 text-base font-extrabold tracking-tight">14 derniers jours</div>
      {a.parJour.length === 0 ? (
        <p className="text-[14px] text-slate-light">Aucune visite enregistrée pour l&rsquo;instant.</p>
      ) : (
        <div className="flex h-[120px] items-end gap-1.5">
          {a.parJour.map((j) => (
            <div key={j.jour} className="flex flex-1 flex-col items-center gap-1">
              <div
                className="w-full rounded-t-[5px] bg-teal"
                style={{ height: `${Math.round((j.appareils / maxJour) * 92)}px`, minHeight: 3 }}
                title={`${j.jour} — ${j.appareils}`}
              />
              <span className="text-[9.5px] tabular-nums text-slate-light">
                {j.jour.slice(8)}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="mb-1 mt-7 text-base font-extrabold tracking-tight">
        Par promo, ces 7 jours
      </div>
      {a.parClasse.length === 0 ? (
        <p className="mt-2 text-[14px] text-slate-light">Rien à afficher.</p>
      ) : (
        a.parClasse.map((c) => (
          <div
            key={c.classe}
            className="flex items-center justify-between border-t border-line-3 py-3"
          >
            <span className="text-[14.5px] font-semibold">{c.classe}</span>
            <span className="text-[14.5px] font-extrabold tabular-nums">{c.appareils}</span>
          </div>
        ))
      )}

      <p className="mt-6 text-[12px] leading-snug text-slate-light">
        On compte des appareils, pas des personnes : le même étudiant sur son téléphone et sur un
        ordinateur compte deux fois, et effacer les données du navigateur en crée un troisième.
        Installer l&rsquo;appli sur l&rsquo;écran d&rsquo;accueil après l&rsquo;avoir ouverte dans
        le navigateur en crée un de plus. À lire comme un ordre de grandeur et une tendance.
      </p>

      <CouvertureSection />
    </>
  );
}

/*
 * The table to read before diffusing a link. Audience says who came;
 * this says what they found.
 */
async function CouvertureSection() {
  const semaine = mondayOf(nowInWAT());
  const { classes, notifs } = await getCouverture(semaine);
  const muets = notifs.total - notifs.joignables;
  const vides = classes.filter((c) => !c.programme && c.annales === 0);

  return (
    <>
      <div className="mb-2 mt-9 text-base font-extrabold tracking-tight">Notifications</div>
      <div className="grid grid-cols-2 gap-2.5">
        <Chiffre valeur={notifs.total} legende="Appareils abonnés" />
        <Chiffre valeur={notifs.joignables} legende="Rattachés à une promo" />
      </div>
      <p className="mt-3 text-[12.5px] leading-snug text-slate-light">
        {muets === 0
          ? "Tous les abonnés sont rattachés à une promo : le programme et le rappel de 20h les atteignent."
          : `${muets} abonné${muets > 1 ? "s ne sont" : " n'est"} rattaché${
              muets > 1 ? "s" : ""
            } à aucune promo. Ni le programme ni le rappel de 20h ne ${
              muets > 1 ? "leur" : "lui"
            } parvient — ça se répare tout seul à la prochaine ouverture.`}
      </p>

      <div className="mb-1 mt-7 text-base font-extrabold tracking-tight">
        Ce que chaque promo trouve
      </div>
      <p className="mb-2 text-[12.5px] leading-snug text-slate-light">
        Semaine du {weekRangeLabel(semaine)}.
      </p>

      <div className="flex items-center gap-2 border-b border-line-3 pb-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-light">
        <span className="flex-1">Promo</span>
        <span className="w-11 text-right">7 j</span>
        <span className="w-11 text-right">Notif</span>
        <span className="w-14 text-right">Prog.</span>
        <span className="w-14 text-right">Annales</span>
      </div>
      {classes.map((c) => {
        const vide = !c.programme && c.annales === 0;
        return (
          <div
            key={c.classe}
            className="flex items-center gap-2 border-b border-line-3 py-2.5 text-[14px] tabular-nums"
            style={{ color: vide ? "#B91C1C" : undefined }}
          >
            <span className="flex-1 font-semibold">{c.classe}</span>
            <span className="w-11 text-right">{c.appareils}</span>
            <span className="w-11 text-right">{c.abonnes}</span>
            <span className="w-14 text-right font-bold">{c.programme ? "oui" : "—"}</span>
            <span className="w-14 text-right">{c.annales}</span>
          </div>
        );
      })}

      <p className="mt-4 text-[12.5px] leading-snug text-slate-light">
        {vides.length === 0
          ? "Chaque promo a de quoi lire."
          : `${vides.length} promo${vides.length > 1 ? "s" : ""} en rouge : ni programme cette ` +
            `semaine, ni annales. Un étudiant qui choisit cette promo tombe sur une appli vide.`}
      </p>
    </>
  );
}

async function DeleguesTab() {
  const [delegues, classes] = await Promise.all([getDelegations(), getClasses()]);
  return (
    <DelegueForm
      classes={classes.map((c) => c.label)}
      delegues={delegues.map((d) => ({
        id: d.id,
        email: d.email,
        classeLabel: d.classeLabel,
        nommePar: d.nommePar,
      }))}
    />
  );
}
