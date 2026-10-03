/*
 * These keys keep the old name on purpose. They are written on the student's
 * phone, not shown to them: renaming them would log every existing user out
 * of their promo and reset their download count, to change a string nobody
 * ever sees.
 */
export const CLASSE_COOKIE = "campusly_classe";
export const DEFAULT_CLASSE = "BME · L2";
export const BANNER_COOKIE = "campusly_banner_dismissed";
// Identifies a browser, nothing more. httpOnly so no script can read it, and
// it holds a random id with nothing derived from the person behind it.
export const DEVICE_COOKIE = "campusly_device";

export const SUBJECT_FILTER_LABELS: Record<string, string> = {
  filiere: "Filière",
  niveau: "Niveau",
  annee: "Année",
  type: "Type d'épreuve",
  enseignant: "Enseignant",
};

export const PROPOSER_LABELS: Record<string, string> = {
  filiere: "Filière",
  niveau: "Niveau",
  matiere: "Matière",
  annee: "Année",
  type: "Type d'épreuve",
};

export const CITE_QUARTIERS = ["Nkolbisson", "Melen", "Biyem-Assi"];
export const CITE_DISTANCE_OPTIONS = [
  { label: "≤ 1 km", value: "1000" },
  { label: "≤ 2 km", value: "2000" },
  { label: "Peu importe", value: "" },
];
export const CITE_PRICE_OPTIONS = [
  { label: "≤ 25 000 FCFA", value: "25000" },
  { label: "≤ 40 000 FCFA", value: "40000" },
  { label: "Peu importe", value: "" },
];

/*
 * The one place the app's public address lives. It used to be hardcoded as
 * "campusly.app" in the three share/install screens — a domain that was never
 * bought and answers with an Apache "Forbidden", so every link a student
 * shared led nowhere. Reading it from the environment means the day a real
 * domain is bought (or the app is renamed), it's one Vercel setting and not a
 * hunt through components.
 */
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://campusly-ucac.vercel.app";
export const APP_DOMAIN = APP_URL.replace(/^https?:\/\//, "");

/*
 * The shape of a week at the UCAC: six days, two fixed blocks a day, and only
 * the subject changes. The hours live here rather than in the database so the
 * day the school shifts to 8h30 one line changes instead of a semester of
 * rows.
 */
export const JOURS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"] as const;

/*
 * The day in two-hour slots. A course is a range over them, so the same
 * structure holds a four-hour block and a morning split between two
 * subjects — both are printed on the faculty's own sheets.
 */
export const CRENEAUX = [
  { i: 1, de: "8h", a: "10h" },
  { i: 2, de: "10h", a: "12h" },
  { i: 3, de: "14h", a: "16h" },
  { i: 4, de: "16h", a: "18h" },
] as const;

/** 1→2 gives "8h–12h"; 1→1 gives "8h–10h". */
export function heuresDe(debut: number, fin: number) {
  const a = CRENEAUX.find((c) => c.i === debut);
  const b = CRENEAUX.find((c) => c.i === fin);
  return a && b ? `${a.de}–${b.a}` : "";
}

/** Slots 1-2 are the morning, 3-4 the afternoon. */
export const DEMI_JOURNEES = [
  { id: "matin", label: "Matin", slots: [1, 2] },
  { id: "apres_midi", label: "Après-midi", slots: [3, 4] },
] as const;

export function momentDuSlot(slot: number) {
  return slot <= 2 ? ("matin" as const) : ("apres_midi" as const);
}
