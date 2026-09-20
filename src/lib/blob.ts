import { put } from "@vercel/blob";

const MAX_UPLOAD_BYTES = 15 * 1024 * 1024; // 15 MB

export async function uploadFile(file: File, folder: string) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error(
      "BLOB_READ_WRITE_TOKEN is not configured — set it in .env to enable uploads."
    );
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("Fichier trop lourd (15 Mo max). Compresse-le avant d'envoyer.");
  }
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const blob = await put(`${folder}/${Date.now()}-${safeName}`, file, {
    access: "public",
    addRandomSuffix: true,
  });
  return { url: blob.url, name: file.name };
}
