import Image from "next/image";

export function FilePreview({ url, className }: { url: string; className?: string }) {
  const isPdf = /\.pdf(\?|$)/i.test(url);
  if (isPdf) {
    return <iframe src={url} className={className} title="Document" />;
  }
  return (
    <div className={`relative ${className ?? ""}`}>
      <Image src={url} alt="Document" fill className="object-contain" />
    </div>
  );
}
