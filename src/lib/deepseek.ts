/*
 * A DeepSeek answer streamed as plain text: its server-sent events reduced to
 * the words of the answer (the model's reasoning is not sent on). `fin` is
 * appended once the answer is complete, so a reader can tell a finished text
 * from one cut off. Null when DeepSeek cannot be reached.
 */
type Message = { role: "system" | "user" | "assistant"; content: string };

export async function fluxDeepSeek(messages: Message[], maxTokens: number, fin = ""): Promise<ReadableStream<Uint8Array> | null> {
  const cle = process.env.DEEPSEEK_API_KEY;
  if (!cle) return null;
  const reponse = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${cle}`, "Content-Type": "application/json" },
    // Its reasoning counts in max_tokens too (up to ~2000 tokens).
    body: JSON.stringify({ model: "deepseek-flash", stream: true, max_tokens: maxTokens, temperature: 0.4, messages }),
  }).catch(() => null);
  if (!reponse?.ok || !reponse.body) return null;

  const decodeur = new TextDecoder();
  const encodeur = new TextEncoder();
  let reste = "";
  let termine = false;
  return reponse.body.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(morceau, sortie) {
        reste += decodeur.decode(morceau, { stream: true });
        const lignes = reste.split("\n");
        reste = lignes.pop() ?? "";
        for (const ligne of lignes) {
          const donnees = ligne.replace(/^data:\s*/, "").trim();
          if (!ligne.startsWith("data:") || !donnees) continue;
          if (donnees === "[DONE]") continue;
          try {
            const choix = (JSON.parse(donnees) as { choices?: { delta?: { content?: string }; finish_reason?: string | null }[] }).choices?.[0];
            if (choix?.delta?.content) sortie.enqueue(encodeur.encode(choix.delta.content));
            if (choix?.finish_reason === "stop") termine = true;
          } catch {
            /* a keep-alive or a partial line */
          }
        }
      },
      flush(sortie) {
        if (fin && termine) sortie.enqueue(encodeur.encode(fin));
      },
    })
  );
}

/** A whole DeepSeek answer at once; `complet` is false when it was cut off by the token limit. */
export async function reponseDeepSeek(messages: Message[], maxTokens: number): Promise<{ texte: string; complet: boolean } | null> {
  const cle = process.env.DEEPSEEK_API_KEY;
  if (!cle) return null;
  const reponse = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${cle}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "deepseek-flash", max_tokens: maxTokens, temperature: 0.3, messages }),
  }).catch(() => null);
  if (!reponse?.ok) return null;
  const d = (await reponse.json().catch(() => null)) as { choices?: { message?: { content?: string }; finish_reason?: string }[] } | null;
  const choix = d?.choices?.[0];
  return choix?.message?.content ? { texte: choix.message.content.trim(), complet: choix.finish_reason === "stop" } : null;
}
