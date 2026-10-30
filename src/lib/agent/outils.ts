import { eq } from "drizzle-orm";
import { db } from "@/db";
import { vendeurs } from "@/db/schema";
import { venteALUnite, MAX_UNITES } from "@/lib/catalogue";
import { getCitesWithAvailability, getClasses, getNotificationFeed, getProgrammeForWeek, getSubjectsPage } from "@/lib/data";
import { cleEpuise, epuisesDuJour, libelleLigne, lireMenu, trouverItem } from "@/lib/menu";
import { addDays, mondayOf, nowInWAT } from "@/lib/semaine";
import { getMaReponse, getSondageOuvert } from "@/lib/sondage";
import { getCatalogue, getVendeurs } from "@/lib/vendeurs";
import type { Widget } from "@/lib/agent/types";

/*
 * What the agent can do: everything a student does on Campusly, as tools the
 * model calls. Each runs here, on the server, as the signed-in student, and
 * answers twice: a short summary for the model to reason on, and a widget for
 * the screen.
 *
 * Nothing that commits the student happens here. An order is priced and laid
 * out, a change of promo is proposed, a poll is shown: the student's own tap,
 * on the widget, is what sends, changes or votes — through the same server
 * actions the pages use.
 */

export type Contexte = { userId: string; nom: string | null; classe: string | null };
export type Resultat = { pourModele: unknown; widget?: Widget; etape: string };

const PAGES: Record<string, { libelle: string; href: string; icone: "doc" | "cal" | "bed" | "shirt" | "bag" | "bell" | "plus" | "spark" | "inbox" }> = {
  sujets: { libelle: "Anciens sujets", href: "/sujets", icone: "doc" },
  proposer_sujet: { libelle: "Proposer un sujet", href: "/sujets/proposer", icone: "plus" },
  mes_envois: { libelle: "Mes envois", href: "/sujets/mes-envois", icone: "inbox" },
  programme: { libelle: "Programme de la semaine", href: "/programme", icone: "cal" },
  proposer_programme: { libelle: "Proposer l'emploi du temps", href: "/programme/proposer", icone: "plus" },
  logements: { libelle: "Logements", href: "/logements", icone: "bed" },
  pressing: { libelle: "Pressing", href: "/pressing", icone: "shirt" },
  commander: { libelle: "Commander", href: "/commander", icone: "bag" },
  notifications: { libelle: "Notifications", href: "/notifications", icone: "bell" },
};

const fcfa = (n: number) => `${n.toLocaleString("fr-FR").replace(/ /g, " ")} FCFA`;
const HEURES: Record<number, [number, number]> = { 1: [8, 10], 2: [10, 12], 3: [14, 16], 4: [16, 18] };
const JOURS = ["", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

export const OUTILS = [
  {
    nom: "chercher_sujets",
    description: "Cherche des anciens sujets d'examen (annales) par matière, enseignant, filière, niveau, année ou type d'épreuve.",
    parametres: {
      recherche: { type: "string", description: "Matière ou enseignant, ex. « macroéconomie »" },
      filiere: { type: "string", description: "BME, LEG…" },
      niveau: { type: "string", description: "L1, L2, L3…" },
      annee: { type: "string" },
      type: { type: "string", enum: ["Partiel", "CC", "Examen", "Rattrapage", "TD", "Concours"] },
    },
  },
  {
    nom: "emploi_du_temps",
    description: "Les cours de la promo de l'étudiant : aujourd'hui, demain ou toute la semaine, avec heures, salles et enseignants.",
    parametres: { quand: { type: "string", enum: ["aujourdhui", "demain", "semaine"] } },
    requis: ["quand"],
  },
  {
    nom: "lister_boutiques",
    description: "Les boutiques et restaurants où commander sur le campus.",
    parametres: {},
  },
  {
    nom: "voir_carte",
    description: "La carte d'une boutique : articles, tailles et prix (avec leurs identifiants), modes de remise ; ou ses packs et parfums. À appeler avant preparer_commande.",
    parametres: { boutique: { type: "string", description: "Le slug de la boutique (donné par lister_boutiques)" } },
    requis: ["boutique"],
  },
  {
    nom: "preparer_commande",
    description:
      "Prépare une commande avec ses prix exacts et l'affiche à l'étudiant, qui l'envoie lui-même d'un geste. Restaurant à menu : articles + mode. Boutique à packs : packs avec leurs parfums.",
    parametres: {
      boutique: { type: "string" },
      articles: {
        type: "array",
        description: "Pour un menu : les articles (id de voir_carte), la taille (id), le choix si l'article en demande un, la quantité",
        items: {
          type: "object",
          properties: { id: { type: "string" }, taille: { type: "string" }, choix: { type: "string" }, quantite: { type: "integer" } },
          required: ["id", "quantite"],
        },
      },
      mode: { type: "string", description: "Id du mode de remise (sur place, à emporter, livraison…)" },
      packs: {
        type: "array",
        description: "Pour une boutique à packs : chaque pack (formule_id) et ses parfums (article_id, quantite)",
        items: {
          type: "object",
          properties: {
            formule_id: { type: "integer" },
            parfums: { type: "array", items: { type: "object", properties: { article_id: { type: "integer" }, quantite: { type: "integer" } }, required: ["article_id", "quantite"] } },
          },
          required: ["formule_id", "parfums"],
        },
      },
      precision: { type: "string", description: "Adresse de livraison (cité, chambre) ou précision pour le vendeur" },
    },
    requis: ["boutique"],
  },
  {
    nom: "chercher_logement",
    description: "Les cités et logements vérifiés autour du campus, avec prix et chambres disponibles.",
    parametres: {
      budget_max: { type: "integer", description: "Loyer mensuel maximum en FCFA" },
      distance_max_m: { type: "integer" },
      tri: { type: "string", enum: ["distance", "prix"] },
    },
  },
  { nom: "sondage_du_moment", description: "Le sondage ouvert aux étudiants, pour y répondre.", parametres: {} },
  { nom: "mes_notifications", description: "Les dernières notifications et nouveautés de l'étudiant.", parametres: {} },
  {
    nom: "changer_de_promo",
    description: "Propose de changer la promo (filière · niveau) de l'étudiant ; il confirme d'un geste.",
    parametres: { promo: { type: "string", description: "Le libellé exact, ex. « LEG · L2 »" } },
    requis: ["promo"],
  },
  {
    nom: "ouvrir",
    description:
      "Donne des boutons pour aller sur une page de Campusly : un sujet, le tuteur IA d'un sujet, une boutique, ou une rubrique (sujets, proposer_sujet, mes_envois, programme, proposer_programme, logements, pressing, commander, notifications).",
    parametres: {
      page: { type: "string", enum: [...Object.keys(PAGES), "sujet", "tuteur", "boutique"] },
      sujet_id: { type: "integer" },
      boutique: { type: "string" },
    },
    requis: ["page"],
  },
] as const;

/** The tools in the format of DeepSeek's (OpenAI's) function calling. */
export const outilsPourModele = OUTILS.map((o) => ({
  type: "function" as const,
  function: {
    name: o.nom,
    description: o.description,
    parameters: { type: "object", properties: o.parametres, required: "requis" in o ? [...o.requis] : [] },
  },
}));

type Args = Record<string, unknown>;
const texte = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim().slice(0, 200) : undefined);
const entier = (v: unknown) => (typeof v === "number" && Number.isInteger(v) ? v : typeof v === "string" && /^\d+$/.test(v) ? Number(v) : undefined);

async function vendeurParSlug(slug: string | undefined) {
  if (!slug) return null;
  const [v] = await db.select().from(vendeurs).where(eq(vendeurs.slug, slug)).limit(1);
  return v && v.actif ? v : null;
}

export async function executer(nom: string, args: Args, ctx: Contexte): Promise<Resultat> {
  switch (nom) {
    case "chercher_sujets": {
      const { subjects, total } = await getSubjectsPage(
        { q: texte(args.recherche), filiere: texte(args.filiere), niveau: texte(args.niveau), annee: texte(args.annee), type: texte(args.type) },
        { limit: 6 }
      );
      const items = subjects.map((s) => ({ id: s.id, matiere: s.matiere, type: s.type, annee: s.annee, filiere: s.filiere, niveau: s.niveau, corrige: s.corrige }));
      return {
        etape: `Recherche des sujets${texte(args.recherche) ? ` de « ${texte(args.recherche)} »` : ""}`,
        pourModele: { total, montres: items },
        widget: items.length ? { t: "sujets", items } : undefined,
      };
    }

    case "emploi_du_temps": {
      if (!ctx.classe) return { etape: "Lecture de ton programme", pourModele: { erreur: "L'étudiant n'a pas choisi sa promo." } };
      const classe = (await getClasses()).find((c) => c.label === ctx.classe);
      if (!classe) return { etape: "Lecture de ton programme", pourModele: { erreur: "Promo inconnue." } };
      const maintenant = nowInWAT();
      const quand = args.quand === "demain" ? "demain" : args.quand === "semaine" ? "semaine" : "aujourdhui";
      const cible = quand === "demain" ? addDays(maintenant, 1) : maintenant;
      const programme = await getProgrammeForWeek(classe.id, mondayOf(cible));
      const jourCible = ((cible.getDay() + 6) % 7) + 1;
      const jours = (quand === "semaine" ? [1, 2, 3, 4, 5, 6] : [jourCible])
        .map((j) => ({
          libelle: quand === "semaine" ? JOURS[j] : `${quand === "demain" ? "Demain" : "Aujourd'hui"} · ${JOURS[j] ?? "Dimanche"}`,
          cours: (programme?.creneaux ?? [])
            .filter((c) => c.jour === j)
            .sort((a, b) => a.debut - b.debut)
            .map((c) => ({
              heures: `${HEURES[c.debut]?.[0] ?? "?"}h–${HEURES[c.fin]?.[1] ?? "?"}h`,
              matiere: c.matiere,
              salle: c.salle ?? programme?.salleDefaut ?? null,
              enseignant: c.enseignant,
              cc: c.cc,
            })),
        }))
        .filter((j) => quand !== "semaine" || j.cours.length);
      return {
        etape: quand === "semaine" ? "Lecture de ta semaine" : `Lecture de ton programme ${quand === "demain" ? "de demain" : "du jour"}`,
        pourModele: programme ? { promo: ctx.classe, jours } : { promo: ctx.classe, erreur: "Pas de programme publié pour cette semaine." },
        widget: programme ? { t: "programme", titre: `${ctx.classe} · ${quand === "semaine" ? "cette semaine" : jours[0]?.libelle ?? ""}`, jours } : undefined,
      };
    }

    case "lister_boutiques": {
      const liste = await getVendeurs();
      const items = liste.map((v) => ({ slug: v.slug, nom: v.nom, logo: v.logoCarreUrl, description: v.accroche ?? null }));
      return {
        etape: "Recherche des boutiques ouvertes",
        pourModele: liste.map((v) => ({ slug: v.slug, nom: v.nom, genre: lireMenu(v.menu) ? "menu" : "packs", accroche: v.accroche })),
        widget: items.length ? { t: "boutiques", items } : undefined,
      };
    }

    case "voir_carte": {
      const v = await vendeurParSlug(texte(args.boutique));
      if (!v) return { etape: "Ouverture de la carte", pourModele: { erreur: "Boutique introuvable ou fermée. Utilise lister_boutiques." } };
      const boutique = { slug: v.slug, nom: v.nom, logo: v.logoCarreUrl };
      const menu = lireMenu(v.menu);
      if (menu) {
        const epuises = new Set(epuisesDuJour(v.epuises));
        return {
          etape: `Lecture de la carte de ${v.nom}`,
          pourModele: {
            genre: "menu",
            articles: menu.sections.flatMap((s) =>
              s.items.map((i) => ({
                id: i.id,
                nom: i.nom,
                section: s.titre,
                tailles: i.tailles.map((t) => ({ id: t.id, nom: t.nom, prix: t.prix })),
                choix: i.choix ? { titre: i.choix.titre, options: i.choix.options.filter((o) => !epuises.has(cleEpuise(i.id, o))) } : undefined,
                epuise: epuises.has(i.id),
              }))
            ),
            modes: menu.modes.map((m) => ({ id: m.id, libelle: m.libelle, prix: m.prix, demande_adresse: !!m.adresse, gamelle_par_plat: m.gamelle ? menu.gamelle : 0 })),
          },
          widget: {
            t: "menu",
            boutique,
            sections: menu.sections.map((s) => ({
              titre: s.titre,
              items: s.items.map((i) => ({
                nom: i.nom,
                description: i.description ?? null,
                prix: i.tailles.length > 1 ? `dès ${fcfa(Math.min(...i.tailles.map((t) => t.prix)))}` : fcfa(i.tailles[0].prix),
                epuise: epuises.has(i.id),
              })),
            })),
          },
        };
      }
      const { formules, articles } = await getCatalogue(v.id);
      return {
        etape: `Lecture des packs de ${v.nom}`,
        pourModele: {
          genre: "packs",
          a_l_unite: venteALUnite(formules),
          unite: v.unite ?? "article",
          packs: formules.map((f) => ({ id: f.id, nom: f.nom, nombre: f.taille, prix: f.prix })),
          parfums: articles.map((a) => ({ id: a.id, nom: a.nom, en_rupture: a.enRupture })),
          frais_livraison: v.fraisLivraison,
        },
        widget: {
          t: "menu",
          boutique,
          sections: [
            { titre: "Packs", items: formules.map((f) => ({ nom: f.nom, description: `${f.taille} ${v.unite ?? "article"}${f.taille > 1 ? "s" : ""}`, prix: fcfa(f.prix), epuise: false })) },
            { titre: "Parfums", items: articles.map((a) => ({ nom: a.nom, description: a.description ?? null, prix: "", epuise: a.enRupture })) },
          ],
        },
      };
    }

    case "preparer_commande":
      return preparerCommande(args);

    case "chercher_logement": {
      const cites = await getCitesWithAvailability({
        maxPrice: entier(args.budget_max),
        maxDistanceM: entier(args.distance_max_m),
        sort: args.tri === "prix" ? "prix" : "distance",
      });
      const items = cites.slice(0, 6).map((c) => ({
        id: c.id,
        nom: c.nom,
        quartier: c.quartier,
        distance: c.distanceM < 1000 ? `${c.distanceM} m` : `${(c.distanceM / 1000).toFixed(1).replace(".", ",")} km`,
        prixMin: c.minPrice || null,
        disponibles: c.stock,
        photo: c.photos[0] ?? null,
      }));
      return {
        etape: "Recherche de logements",
        pourModele: { total: cites.length, montres: items.map(({ photo: _photo, ...i }) => i) },
        widget: items.length ? { t: "logements", items } : undefined,
      };
    }

    case "sondage_du_moment": {
      const s = await getSondageOuvert();
      if (!s) return { etape: "Recherche du sondage", pourModele: { aucun: true } };
      const maReponse = await getMaReponse(s.id);
      return {
        etape: "Ouverture du sondage",
        pourModele: { question: s.question, options: s.options, deja_repondu: maReponse !== null },
        widget: { t: "sondage", id: s.id, question: s.question, options: s.options, maReponse },
      };
    }

    case "mes_notifications": {
      const feed = await getNotificationFeed(ctx.userId, 6);
      const items = feed.map((n) => ({ titre: n.title, detail: n.subtitle, href: n.href }));
      return { etape: "Lecture de tes notifications", pourModele: items, widget: items.length ? { t: "notifications", items } : undefined };
    }

    case "changer_de_promo": {
      const voulue = texte(args.promo);
      const classes = await getClasses();
      const trouvee = classes.find((c) => c.label.toLowerCase().replace(/\s/g, "") === voulue?.toLowerCase().replace(/\s/g, ""));
      if (!trouvee) return { etape: "Recherche de la promo", pourModele: { erreur: "Promo inconnue.", promos: classes.map((c) => c.label) } };
      return { etape: "Préparation du changement de promo", pourModele: { propose: trouvee.label }, widget: { t: "classe", label: trouvee.label } };
    }

    case "ouvrir": {
      const page = texte(args.page) ?? "";
      if (page === "sujet" || page === "tuteur") {
        const id = entier(args.sujet_id);
        if (!id) return { etape: "Préparation du lien", pourModele: { erreur: "sujet_id manquant" } };
        return {
          etape: "Préparation du lien",
          pourModele: { ok: true },
          widget: {
            t: "liens",
            items: [
              page === "tuteur"
                ? { libelle: "Réviser ce sujet avec le tuteur IA", href: `/sujets/${id}?tuteur=1`, icone: "spark" }
                : { libelle: "Ouvrir le sujet", href: `/sujets/${id}`, icone: "doc" },
            ],
          },
        };
      }
      if (page === "boutique") {
        const v = await vendeurParSlug(texte(args.boutique));
        if (!v) return { etape: "Préparation du lien", pourModele: { erreur: "Boutique introuvable." } };
        return { etape: "Préparation du lien", pourModele: { ok: true }, widget: { t: "liens", items: [{ libelle: `Ouvrir ${v.nom}`, href: `/commander/${v.slug}`, icone: "bag" }] } };
      }
      const p = PAGES[page];
      if (!p) return { etape: "Préparation du lien", pourModele: { erreur: "Page inconnue." } };
      return { etape: "Préparation du lien", pourModele: { ok: true }, widget: { t: "liens", items: [p] } };
    }
  }
  return { etape: "…", pourModele: { erreur: `Outil inconnu : ${nom}` } };
}

// An order priced exactly as the shop's own page and server action will price it.
async function preparerCommande(args: Args): Promise<Resultat> {
  const etape = "Préparation de ta commande";
  const v = await vendeurParSlug(texte(args.boutique));
  if (!v) return { etape, pourModele: { erreur: "Boutique introuvable ou fermée." } };
  const boutique = { id: v.id, slug: v.slug, nom: v.nom, logo: v.logoCarreUrl };
  const precision = texte(args.precision);
  const menu = lireMenu(v.menu);

  if (menu) {
    const demandes = Array.isArray(args.articles) ? (args.articles as Args[]) : [];
    if (!demandes.length) return { etape, pourModele: { erreur: "Aucun article. Appelle voir_carte puis donne les articles." } };
    const mode = menu.modes.find((m) => m.id === texte(args.mode)) ?? (menu.modes.length === 1 ? menu.modes[0] : undefined);
    if (!mode) return { etape, pourModele: { erreur: "Demande à l'étudiant comment il récupère sa commande.", modes: menu.modes.map((m) => ({ id: m.id, libelle: m.libelle, prix: m.prix })) } };
    if (mode.adresse && !precision) return { etape, pourModele: { erreur: "Demande l'adresse de livraison (cité, chambre) avant de préparer." } };
    const epuises = new Set(epuisesDuJour(v.epuises));
    const lignes: { libelle: string; quantite: number; montant: number }[] = [];
    const envoi: { item: string; taille: string; choix?: string; quantite: number }[] = [];
    let plats = 0;
    for (const d of demandes) {
      const item = trouverItem(menu, texte(d.id) ?? "");
      if (!item) return { etape, pourModele: { erreur: `Article inconnu : ${String(d.id)}. Utilise les id de voir_carte.` } };
      const taille = item.tailles.find((t) => t.id === texte(d.taille)) ?? (item.tailles.length === 1 ? item.tailles[0] : undefined);
      if (!taille) return { etape, pourModele: { erreur: `Choisis une taille pour ${item.nom}.`, tailles: item.tailles } };
      const quantite = Math.min(Math.max(entier(d.quantite) ?? 1, 1), 20);
      const choix = texte(d.choix);
      if (item.choix && (!choix || !item.choix.options.includes(choix))) {
        return { etape, pourModele: { erreur: `Demande à l'étudiant : ${item.choix.titre} pour ${item.nom}.`, options: item.choix.options } };
      }
      if (epuises.has(item.id) || (choix && epuises.has(cleEpuise(item.id, choix)))) {
        return { etape, pourModele: { erreur: `${item.nom} est épuisé aujourd'hui.` } };
      }
      if (item.plat) plats += quantite;
      lignes.push({ libelle: libelleLigne(item, taille, item.choix ? choix : undefined), quantite, montant: taille.prix * quantite });
      envoi.push({ item: item.id, taille: taille.id, ...(item.choix ? { choix } : {}), quantite });
    }
    const frais = [
      ...(mode.gamelle && plats ? [{ libelle: `Gamelle${plats > 1 ? "s" : ""} (${plats})`, montant: plats * menu.gamelle }] : []),
      ...(mode.prix > 0 ? [{ libelle: mode.libelle, montant: mode.prix }] : []),
    ];
    const total = lignes.reduce((n, l) => n + l.montant, 0) + frais.reduce((n, f) => n + f.montant, 0);
    return {
      etape,
      pourModele: { prete: true, total, remise: mode.libelle, note: "Affichée à l'étudiant : il l'envoie lui-même au vendeur d'un geste." },
      widget: { t: "commande", boutique, lignes, frais, total, remise: mode.libelle, envoi: { genre: "menu", vendeurId: v.id, lignes: envoi, mode: mode.id, precision } },
    };
  }

  const packs = Array.isArray(args.packs) ? (args.packs as Args[]) : [];
  if (!packs.length) return { etape, pourModele: { erreur: "Aucun pack. Appelle voir_carte puis donne les packs et leurs parfums." } };
  const { formules, articles } = await getCatalogue(v.id);
  const unite = venteALUnite(formules);
  const lignes: { libelle: string; quantite: number; montant: number }[] = [];
  const panier: { formuleId: number; parfums: Record<number, number> }[] = [];
  for (const p of packs.slice(0, 10)) {
    const formule = formules.find((f) => f.id === entier(p.formule_id));
    if (!formule) return { etape, pourModele: { erreur: "Pack inconnu. Utilise les id de voir_carte." } };
    const parfums: Record<number, number> = {};
    const noms: string[] = [];
    let compte = 0;
    for (const q of Array.isArray(p.parfums) ? (p.parfums as Args[]) : []) {
      const article = articles.find((a) => a.id === entier(q.article_id));
      const n = entier(q.quantite) ?? 0;
      if (!article) return { etape, pourModele: { erreur: "Parfum inconnu." } };
      if (article.enRupture) return { etape, pourModele: { erreur: `${article.nom} est en rupture.` } };
      if (n <= 0) continue;
      parfums[article.id] = (parfums[article.id] ?? 0) + n;
      noms.push(`${n} ${article.nom}`);
      compte += n;
    }
    if (unite ? compte < 1 || compte > MAX_UNITES : compte !== formule.taille) {
      return { etape, pourModele: { erreur: unite ? `Entre 1 et ${MAX_UNITES} articles.` : `Le ${formule.nom} doit contenir exactement ${formule.taille} parfums au total.` } };
    }
    lignes.push({ libelle: `${unite ? `${compte} à l'unité` : formule.nom} : ${noms.join(", ")}`, quantite: 1, montant: unite ? formule.prix * compte : formule.prix });
    panier.push({ formuleId: formule.id, parfums });
  }
  const frais = v.fraisLivraison > 0 ? [{ libelle: "Livraison", montant: v.fraisLivraison }] : [];
  const total = lignes.reduce((n, l) => n + l.montant, 0) + frais.reduce((n, f) => n + f.montant, 0);
  return {
    etape,
    pourModele: { prete: true, total, note: "Affichée à l'étudiant : il l'envoie lui-même au vendeur d'un geste." },
    widget: { t: "commande", boutique, lignes, frais, total, remise: null, envoi: { genre: "packs", vendeurId: v.id, panier, precision } },
  };
}

/** A line the model reads back on the next turn: what was shown, so "le deuxième" means something. */
export function resumeWidget(w: Widget): string {
  switch (w.t) {
    case "sujets":
      return `Sujets montrés : ${w.items.map((s, i) => `${i + 1}. #${s.id} ${s.matiere} (${s.type} ${s.annee}, ${s.filiere} ${s.niveau})`).join(" ; ")}`;
    case "boutiques":
      return `Boutiques montrées : ${w.items.map((b) => `${b.nom} [${b.slug}]`).join(", ")}`;
    case "logements":
      return `Logements montrés : ${w.items.map((l, i) => `${i + 1}. ${l.nom} (${l.quartier})`).join(" ; ")}`;
    case "commande":
      return `Commande préparée chez ${w.boutique.nom} : ${w.lignes.map((l) => `${l.quantite}× ${l.libelle}`).join(", ")} — total ${w.total} FCFA (pas encore envoyée)`;
    case "menu":
      return `Carte affichée : ${w.boutique.nom}`;
    case "programme":
      return `Programme affiché : ${w.titre}`;
    case "sondage":
      return `Sondage affiché : ${w.question}`;
    case "classe":
      return `Changement de promo proposé : ${w.label}`;
    default:
      return "";
  }
}
