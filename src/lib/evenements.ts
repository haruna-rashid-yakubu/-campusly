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

/*
 * Small ads from people on campus — a phone for sale, a room to let — shown
 * in "À la une" for a few days. The card opens the seller's WhatsApp with a
 * first message typed, through /wa, which also counts the taps under `cle`.
 */
type Annonce = {
  cle: string; // counted in notification_clic, like a notification
  nom: string;
  ligne: string;
  prix: string;
  image: string; // 16:9
  whatsapp: string;
  message: string;
  depuis: string;
  jusqua: string;
};

const ANNONCES: Annonce[] = [
  {
    cle: "uneiphone16",
    nom: "iPhone 16 Pro Max",
    ligne: "256 Go · batterie 89 % · Face ID OK",
    prix: "400 000 F",
    image: "/annonces/iphone-16-pro-max.jpg",
    whatsapp: "237680826106",
    message: "Bonjour, je suis intéressé par la vente de ton iPhone 16 Pro Max.",
    depuis: "2026-10-24",
    jusqua: "2026-10-27",
  },
];

export function cartesAnnonces(maintenant = new Date()): CarteUne[] {
  const jour = jourWAT(maintenant);
  return ANNONCES.filter((a) => a.depuis <= jour && jour <= a.jusqua).map((a) => ({
    href: `/wa?n=${a.whatsapp}&t=${encodeURIComponent(a.message)}&notif=${a.cle}`,
    nom: a.nom,
    image: a.image,
    ligne: a.ligne,
    prix: a.prix,
    offre: null,
    badge: "À vendre",
    bouton: "WhatsApp",
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
const HALLOWEEN: Decor = {
  motif: "halloween",
  couleur: "#f97316",
  fond: "radial-gradient(circle at 82% 26%, rgba(249,115,22,.35), transparent 40%), linear-gradient(180deg, #07040d 0%, #1c0f2e 45%, #3b1a4a 75%, rgba(255,255,255,0) 100%)",
  ruban: { texte: "🎃 Joyeux Halloween… si tu oses 👻", fond: "#07040d", encre: "#fb923c" },
};

const SAISONS: { debut: string; fin: string; decor: Decor }[] = [
  { debut: "2026-10-31", fin: "2026-10-31", decor: HALLOWEEN },
  {
    debut: "2026-10-20",
    fin: "2026-10-30",
    decor: { motif: "ruban", couleur: "#e8457c", fond: "linear-gradient(180deg, #fde4ee 0%, #fff4f8 60%, rgba(255,255,255,0) 100%)" },
  },
];

/* A season shown ahead of its day, for checking it on a real phone: /?apercu=halloween. */
export function decorEnApercu(nom: string | undefined) {
  return nom === "halloween" ? HALLOWEEN : null;
}

export function decorDuJour(maintenant = new Date()) {
  const jour = jourWAT(maintenant);
  return SAISONS.find((s) => s.debut <= jour && jour <= s.fin)?.decor ?? null;
}

/*
 * Days the whole app changes colour. Read in the browser, not on the server,
 * so that a page built ahead of time still turns on the right day: the script
 * below runs before the first paint and only sets an attribute on <html>.
 */
const COULEURS_DU_JOUR: Record<string, { nom: string; barre: string }> = {
  "2026-10-21": { nom: "rose", barre: "#e8457c" },
  "2026-10-31": { nom: "halloween", barre: "#07040d" },
};

export function scriptCouleurDuJour() {
  return `(function(){try{var c=${JSON.stringify(COULEURS_DU_JOUR)}[new Date(Date.now()+36e5).toISOString().slice(0,10)];if(!c)return;document.documentElement.setAttribute("data-couleur",c.nom);document.addEventListener("DOMContentLoaded",function(){var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute("content",c.barre)})}catch(e){}})()`;
}
