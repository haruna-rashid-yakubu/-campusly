export const CLASSE_COOKIE = "campusly_classe";
export const DEFAULT_CLASSE = "BME · L2";
export const BANNER_COOKIE = "campusly_banner_dismissed";

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
