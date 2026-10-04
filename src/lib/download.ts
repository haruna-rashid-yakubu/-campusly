/*
 * Hands the file to the browser by pointing at it and letting the store say
 * "attachment", rather than fetching the bytes and re-serving them from a
 * blob: URL.
 *
 * The fetch-then-blob route breaks on iPhones in two ways that never show up
 * on a desktop. Safari ties a download to the tap that asked for it, and the
 * tap is spent by the time an await on the network has come back, so the
 * click that should save the file is simply ignored. And revoking the object
 * URL on the next line can cut the download off before the browser has
 * finished reading it.
 *
 * Going straight at the URL keeps the click inside the tap, and costs one
 * transfer instead of two — which on a phone paying for its data is the
 * difference that matters.
 */
export function downloadFile(url: string) {
  // Vercel Blob answers `?download=1` with Content-Disposition: attachment.
  // The `download` attribute cannot do this job: browsers ignore it across
  // origins, and the file lives on the store's domain, not ours.
  const separateur = url.includes("?") ? "&" : "?";
  const a = document.createElement("a");
  a.href = `${url}${separateur}download=1`;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
}
