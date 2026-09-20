import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Campusly — Your campus. One app.",
    short_name: "Campusly",
    description: "L'appli étudiante de l'UCAC Nkolbisson : sujets, logements, pressing, programme.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#14B8AC",
    orientation: "portrait",
    lang: "fr",
    icons: [
      { src: "/icon-192", sizes: "192x192", type: "image/png" },
      { src: "/icon-512", sizes: "512x512", type: "image/png" },
      { src: "/icon-512-maskable", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      {
        name: "Anciens sujets",
        short_name: "Sujets",
        description: "Retrouve les anciens sujets d'examens",
        url: "/sujets",
        icons: [{ src: "/icon-192", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Programme de la semaine",
        short_name: "Programme",
        description: "Voir le programme de la semaine",
        url: "/programme",
        icons: [{ src: "/icon-192", sizes: "192x192", type: "image/png" }],
      },
    ],
  };
}
