import type { MetadataRoute } from "next";
import { getSubjects, getCitesWithAvailability } from "@/lib/data";
import { APP_URL as SITE_URL } from "@/lib/constants";

/*
 * Rebuilt every six hours instead of frozen at build time.
 *
 * Two things were wrong with prerendering it. A paper published through the
 * admin screen did not appear in the sitemap until the next deployment, and
 * papers are published most days — so the file described an app that no
 * longer existed. And because the query ran during `next build`, the build
 * itself needed a reachable database: the day Postgres is suspended or over
 * quota is the day no fix can be shipped either, which is exactly the wrong
 * moment to lose the ability to deploy.
 */
export const revalidate = 21600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  /*
   * A sitemap is a convenience for crawlers, not a page a student opens. If
   * the database cannot be reached it is far better to serve the six routes we
   * know by heart than to fail the request — or, when this runs at build
   * time, the whole deployment.
   */
  let subjects: Awaited<ReturnType<typeof getSubjects>> = [];
  let cites: Awaited<ReturnType<typeof getCitesWithAvailability>> = [];
  try {
    [subjects, cites] = await Promise.all([getSubjects(), getCitesWithAvailability()]);
  } catch {
    /* les routes fixes suffisent : mieux vaut un plan partiel que pas de plan */
  }

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
