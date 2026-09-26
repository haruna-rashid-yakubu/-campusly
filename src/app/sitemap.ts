import type { MetadataRoute } from "next";
import { getSubjects, getCitesWithAvailability } from "@/lib/data";
import { APP_URL as SITE_URL } from "@/lib/constants";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [subjects, cites] = await Promise.all([getSubjects(), getCitesWithAvailability()]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/sujets`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/logements`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/pressing`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${SITE_URL}/programme`, changeFrequency: "daily", priority: 0.7 },
    { url: `${SITE_URL}/installer`, changeFrequency: "monthly", priority: 0.4 },
  ];

  const subjectRoutes: MetadataRoute.Sitemap = subjects.map((s) => ({
    url: `${SITE_URL}/sujets/${s.id}`,
    lastModified: s.createdAt,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const citeRoutes: MetadataRoute.Sitemap = cites.map((c) => ({
    url: `${SITE_URL}/logements/${c.id}`,
    lastModified: c.createdAt,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...subjectRoutes, ...citeRoutes];
}
