import type { Metadata } from "next";

/*
 * Page metadata, with the share card pointing at the page itself.
 *
 * The root layout declares openGraph once, with the home page's url, title and
 * description. A sub-page that sets only `title` and `description` overrides
 * the document title and nothing else, so Next merges its own generic
 * openGraph underneath — and every link a student sent, whatever they were
 * looking at, previewed in WhatsApp as the home page. One paper shared out of
 * a group chat is how this app spreads, and it was the one thing the card
 * never showed.
 *
 * `url` is relative on purpose: metadataBase in the layout resolves it, so
 * the day a real domain is bought nothing here has to change.
 */
export function pageMetadata({
  title,
  description,
  path,
  robots,
}: {
  title: string;
  description: string;
  path: string;
  robots?: Metadata["robots"];
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      locale: "fr_FR",
      siteName: "Campusly",
      url: path,
      title,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    ...(robots ? { robots } : {}),
  };
}
