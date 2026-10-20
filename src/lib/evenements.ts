import type { CarteUne } from "@/components/AlaUne";
import type { Decor } from "@/components/DecorSaison";
import { jourWAT } from "@/lib/menu";

/*
 * Campus events relayed on the home screen, written here by hand while there
 * are few of them. Each one shows in "À la une" from `depuis` to the end of its
 * day, Yaoundé time, then disappears on its own: an event announced after it
 * happened is worse than one never announced.
 */
type Evenement = {
  id: string; // its page, /evenement/<id>
  nom: string;
  ligne: string;
  image: string; // 16:9 crop for the carousel
  affiche: string; // the full poster, opened on a tap
  jour: string; // "2026-10-21"
  jourLabel: string; // "mercredi 21 octobre"
  depuis: string;
  detail: string;
  // The day's colour on the home screen, with the line shown above the carousel.
  ruban?: { couleur: string; texte: string };
};

const EVENEMENTS: Evenement[] = [
  {
    id: "pink-october",
    nom: "Pink October",
    ligne: "Club Mode × JML",
    image: "/evenements/pink-october-une.jpg",
    affiche: "/evenements/pink-october.jpg",
    jour: "2026-10-21",
    jourLabel: "mercredi 21 octobre",
    depuis: "2026-10-20",
    detail: "Contre le cancer du sein",
    ruban: { couleur: "#e8457c", texte: "🎀 Aujourd'hui, on vient en rose" },
  },
];

export function getEvenement(id: string) {
  return EVENEMENTS.find((e) => e.id === id) ?? null;
}

function enCours(maintenant: Date) {
  const jour = jourWAT(maintenant);
  return EVENEMENTS.filter((e) => e.depuis <= jour && jour <= e.jour);
}

export function cartesEvenements(maintenant = new Date()): CarteUne[] {
  const jour = jourWAT(maintenant);
  return enCours(maintenant).map((e) => ({
    // The poster opens in the app's own viewer, with a way back: opened as a
    // bare image, an installed app has no back button to leave it.
    href: `/evenement/${e.id}`,
    nom: e.nom,
    image: e.image,
    ligne: e.ligne,
    prix: e.detail,
    offre: null,
    badge: e.jour === jour ? "Aujourd'hui" : e.jourLabel,
    bouton: "L'affiche",
    affiche: true,
  }));
}

/* The event whose day it is, if it gives the home screen a colour. */
export function rubanDuJour(maintenant = new Date()) {
  const jour = jourWAT(maintenant);
  return EVENEMENTS.find((e) => e.jour === jour && e.ruban)?.ruban ?? null;
}

/*
 * Seasons that dress the top of the home screen, between two days inclusive.
 * Kept to moments the campus marks itself, and never more than a wash and a
 * few motifs: the programme and the orders must read exactly as on any day.
 */
const SAISONS: { debut: string; fin: string; decor: Decor }[] = [
  {
    debut: "2026-10-20",
    fin: "2026-10-31",
    decor: { motif: "ruban", couleur: "#e8457c", fond: "linear-gradient(180deg, #fde4ee 0%, #fff4f8 60%, rgba(255,255,255,0) 100%)" },
  },
];

export function decorDuJour(maintenant = new Date()) {
  const jour = jourWAT(maintenant);
  return SAISONS.find((s) => s.debut <= jour && jour <= s.fin)?.decor ?? null;
}
