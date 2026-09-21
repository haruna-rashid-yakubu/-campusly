export const CLASSE_COOKIE = "campusly_classe";
export const DEFAULT_CLASSE = "Génie informatique · L2";
export const BANNER_COOKIE = "campusly_banner_dismissed";

export const SUBJECT_FILTER_LABELS: Record<string, string> = {
  filiere: "Filière",
  niveau: "Niveau",
  annee: "Année",
  type: "Type d'épreuve",
  enseignant: "Enseignant",
};

export const PROPOSER_FACETS: Record<string, string[]> = {
  filiere: ["Génie informatique", "Génie civil", "Gestion", "Droit"],
  niveau: ["L1", "L2", "L3", "M1"],
  matiere: [
    "Analyse numérique",
    "Base de données",
    "Algorithmique",
    "Réseaux informatiques",
    "Autre matière",
  ],
  annee: ["2024", "2023", "2022", "2021"],
  type: ["Partiel", "Examen", "Rattrapage"],
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
