import { and, eq, gt } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { evenements, users } from "@/db/schema";
import { executer, outilsPourModele, resumeWidget, type Contexte } from "@/lib/agent/outils";
import type { Evenement } from "@/lib/agent/types";
import { getPreferredClasse } from "@/lib/data";

/*
 * The home screen's assistant: the student says what they want, the model
 * picks among the tools (lib/agent/outils) — search papers, read the week,
 * open a shop's menu, price an order, find a room… — runs them as this
 * student, and answers. Each step is streamed as it happens (one JSON object
 * per line): what it is doing, the widgets its tools produced, its words.
 *
 * At most TOURS rounds of tools per request; MESSAGES_JOUR requests a day.
 */
export const maxDuration = 120;

const TOURS = 6;
const MESSAGES_JOUR = 40;

type MessageModele =
  | { role: "system" | "user"; content: string }
  | { role: "assistant"; content: string | null; tool_calls?: { id: string; type: "function"; function: { name: string; arguments: string } }[] }
  | { role: "tool"; tool_call_id: string; content: string };

function consigne(ctx: Contexte) {
  const maintenant = new Date().toLocaleString("fr-FR", { timeZone: "Africa/Douala", weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
  return `Tu es l'assistant de Campusly, l'application des étudiants de l'UCAC à Yaoundé (Nkolbisson). Tu agis pour l'étudiant : tu fais à sa place tout ce qu'il peut faire sur Campusly, avec tes outils.

L'étudiant : ${ctx.nom ?? "inconnu"}, promo ${ctx.classe ?? "non choisie"}. Nous sommes ${maintenant} (heure de Yaoundé).

Règles :
- Utilise toujours tes outils pour les informations réelles (sujets, cours, boutiques, prix, logements) : n'invente jamais un sujet, un prix ou un horaire.
- Enchaîne les outils toi-même quand il le faut : pour commander, voir_carte puis preparer_commande. Ne pose une question que s'il manque une information indispensable (taille, choix, mode de remise, adresse de livraison) et propose alors les options.
- Tu ne peux pas envoyer une commande, voter ou changer la promo toi-même : tu prépares, l'étudiant confirme d'un geste sur l'écran. Dis-le simplement (« Vérifie et touche Envoyer »).
- Ce que tes outils affichent (listes, carte, commande, programme) est déjà à l'écran sous forme de cartes : ne le recopie pas, résume en une phrase et guide vers la suite.
- Pour réviser un sujet ou poser une question sur son contenu, propose le tuteur IA du sujet (outil ouvrir, page « tuteur »).
- Réponds en français (ou en anglais si l'étudiant écrit en anglais), en 1 à 3 phrases, chaleureux et direct. **Gras** pour l'essentiel, pas d'emoji.
- Termine par une ligne « [[suggestions: … | … | …]] » : 2 ou 3 suites courtes (moins de 6 mots), écrites comme l'étudiant les dirait.`;
}

export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ erreur: "connexion" }, { status: 401 });

  const [compte] = await db.select({ role: users.role }).from(users).where(eq(users.id, userId));
  if (compte?.role !== "admin") {
    const faits = await db
      .select({ id: evenements.id })
      .from(evenements)
      .where(and(eq(evenements.type, "message_agent"), eq(evenements.userId, userId), gt(evenements.createdAt, new Date(Date.now() - 24 * 60 * 60 * 1000))));
    if (faits.length >= MESSAGES_JOUR) return NextResponse.json({ erreur: "quota", limite: MESSAGES_JOUR }, { status: 429 });
  }

  const corps = (await request.json().catch(() => null)) as { messages?: { role: string; content: string }[] } | null;
  const historique = (corps?.messages ?? [])
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
    .slice(-16)
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content.slice(0, 3000) }));
  if (historique.at(-1)?.role !== "user") return NextResponse.json({ erreur: "message" }, { status: 400 });

  const cle = process.env.DEEPSEEK_API_KEY;
  if (!cle) return NextResponse.json({ erreur: "indisponible" }, { status: 503 });

  await db.insert(evenements).values({ type: "message_agent", cible: "app", userId });
  const ctx: Contexte = { userId, nom: session.user?.name ?? null, classe: await getPreferredClasse() };

  const encodeur = new TextEncoder();
  const flux = new ReadableStream<Uint8Array>({
    async start(sortie) {
      const envoyer = (e: Evenement) => sortie.enqueue(encodeur.encode(`${JSON.stringify(e)}\n`));
      const messages: MessageModele[] = [{ role: "system", content: consigne(ctx) }, ...historique];
      const resumes: string[] = [];
      try {
        for (let tour = 0; tour < TOURS; tour++) {
          const reponse = await fetch("https://api.deepseek.com/chat/completions", {
            method: "POST",
            headers: { Authorization: `Bearer ${cle}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              model: "deepseek-flash",
              // Choosing a tool is quick work; without the reasoning a round takes a second or two.
              thinking: { type: "disabled" },
              max_tokens: 2000,
              temperature: 0.3,
              tools: outilsPourModele,
              messages,
            }),
          });
          if (!reponse.ok) throw new Error(`DeepSeek ${reponse.status}`);
          const d = (await reponse.json()) as { choices: { message: { content: string | null; tool_calls?: { id: string; type: "function"; function: { name: string; arguments: string } }[] } }[] };
          const message = d.choices[0].message;

          if (!message.tool_calls?.length) {
            envoyer({ t: "texte", texte: message.content ?? "" });
            break;
          }
          messages.push({ role: "assistant", content: message.content ?? null, tool_calls: message.tool_calls });
          for (const appel of message.tool_calls) {
            let args: Record<string, unknown> = {};
            try {
              args = JSON.parse(appel.function.arguments || "{}") as Record<string, unknown>;
            } catch {
              /* malformed arguments: the tool reports what is missing */
            }
            const resultat = await executer(appel.function.name, args, ctx).catch((e: unknown) => ({
              etape: "…",
              pourModele: { erreur: e instanceof Error ? e.message : "Erreur" },
              widget: undefined,
            }));
            envoyer({ t: "etape", texte: resultat.etape });
            if (resultat.widget) {
              envoyer({ t: "widget", widget: resultat.widget });
              const r = resumeWidget(resultat.widget);
              if (r) resumes.push(r);
            }
            messages.push({ role: "tool", tool_call_id: appel.id, content: JSON.stringify(resultat.pourModele).slice(0, 12000) });
          }
          if (tour === TOURS - 1) envoyer({ t: "texte", texte: "Voilà ce que j'ai trouvé." });
        }
        if (resumes.length) envoyer({ t: "contexte", texte: resumes.join("\n") });
      } catch {
        envoyer({ t: "erreur", message: "L'assistant ne répond pas pour le moment. Réessaie dans un instant." });
      }
      envoyer({ t: "fin" });
      sortie.close();
    },
  });
  return new Response(flux, { headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" } });
}
