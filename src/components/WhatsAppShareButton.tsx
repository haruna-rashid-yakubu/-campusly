"use client";

export function WhatsAppShareButton({
  text,
  className,
  children,
  "aria-label": ariaLabel,
}: {
  text: string;
  className?: string;
  children: React.ReactNode;
  "aria-label"?: string;
}) {
  return (
    <button
      aria-label={ariaLabel}
      onClick={() => {
        const url = window.location.href;
        window.open(`https://wa.me/?text=${encodeURIComponent(text + " " + url)}`, "_blank", "noopener,noreferrer");
      }}
      className={className}
    >
      {children}
    </button>
  );
}
