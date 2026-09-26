import type { MetadataRoute } from "next";
import { APP_URL } from "@/lib/constants";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/sujets/proposer", "/sujets/mes-envois", "/notifications"],
    },
    sitemap: `${APP_URL}/sitemap.xml`,
  };
}
