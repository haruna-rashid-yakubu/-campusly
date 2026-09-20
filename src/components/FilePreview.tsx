import Image from "next/image";

export function FilePreview({ url, className }: { url: string; className?: string }) {
  const isPdf = /\.pdf(\?|$)/i.test(url);
  if (isPdf) {
    // Google's viewer scales the page to the iframe's width instead of the
    // browser's native PDF plugin, which can render the page at native size
    // and force horizontal scrolling/cropping inside a fixed-width preview.
    return (
      <iframe
        src={`https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`}
        className={`bg-white ${className ?? ""}`}
        title="Document"
      />
    );
  }
  return (
    <div className={`relative ${className ?? ""}`}>
      <Image src={url} alt="Document" fill className="object-contain" />
    </div>
  );
}
