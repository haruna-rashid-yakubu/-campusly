import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Campusly — Your campus. One app.",
    short_name: "Campusly",
    description: "L'appli étudiante de l'UCAC Nkolbisson : sujets, logements, pressing, programme.",
    start_url: "/",
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
  };
}
