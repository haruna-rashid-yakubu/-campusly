// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- the file exists only after a build, so expect-error would fail once built
// @ts-ignore: produced by `opennextjs-cloudflare build` (absent before the first build)
import { default as handler } from "./.open-next/worker.js";

/*
 * The OpenNext worker, plus the daily crons Vercel used to fire from
 * vercel.json. Each schedule calls its route exactly as Vercel did — a GET
 * with CRON_SECRET as a bearer token — so the routes themselves are unchanged.
 */
const CRONS: Record<string, string> = {
  "0 19 * * *": "/api/cron/rappel-du-soir",
  "0 7 * * *": "/api/cron/matin",
};

type Env = { CRON_SECRET?: string; NEXT_PUBLIC_APP_URL?: string };

export default {
  // The bare domain goes to www, as it did on Vercel; everything else is the site.
  async fetch(request: Request, env: Env, ctx: unknown) {
    const url = new URL(request.url);
    if (url.hostname === "mycampusly.fr") {
      url.hostname = "www.mycampusly.fr";
      return Response.redirect(url.toString(), 308);
    }
    return handler.fetch(request, env, ctx);
  },

  async scheduled(event: { cron: string }, env: Env, ctx: unknown) {
    const chemin = CRONS[event.cron];
    if (!chemin) return;
    const base = env.NEXT_PUBLIC_APP_URL ?? "https://www.mycampusly.fr";
    const requete = new Request(new URL(chemin, base), {
      headers: { authorization: `Bearer ${env.CRON_SECRET}` },
    });
    const res: Response = await handler.fetch(requete, env, ctx);
    if (!res.ok) throw new Error(`${chemin} : ${res.status} ${await res.text()}`);
  },
};

// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- the file exists only after a build, so expect-error would fail once built
// @ts-ignore: produced by `opennextjs-cloudflare build` (absent before the first build)
export { DOQueueHandler, DOShardedTagCache, BucketCachePurge } from "./.open-next/worker.js";
