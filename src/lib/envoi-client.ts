/** Sends a file to /api/envoi, which keeps it in R2, and returns its address. */
export async function envoyerFichier(fichier: File, dossier: "submissions" | "sujets"): Promise<{ url: string }> {
  const data = new FormData();
  data.set("fichier", fichier);
  data.set("dossier", dossier);
  const res = await fetch("/api/envoi", { method: "POST", body: data });
  const corps = (await res.json().catch(() => null)) as { url?: string; error?: string } | null;
  if (!res.ok || !corps?.url) throw new Error(corps?.error ?? "L'envoi du fichier a échoué.");
  return { url: corps.url };
}
