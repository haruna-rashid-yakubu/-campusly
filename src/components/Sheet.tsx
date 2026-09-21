"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/components/icons";

export function Sheet({
  open,
  onClose,
  title,
  subtitle,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    // The page behind must not scroll under the sheet on iOS.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  // No `mounted` state needed: every caller starts closed, so the first
  // client render matches the server's (null) and the portal only ever runs
  // after an interaction.
  if (!open || typeof document === "undefined") return null;

  /*
   * Rendered through a portal because every caller sits inside something that
   * creates a stacking context — the sujets filter bar lives in a
   * `sticky z-10` header, so a z-40 sheet rendered in place is still only
   * z-10 against the rest of the page, and the tab bar painted over its lower
   * half. From <body> the sheet competes with the tab bar directly.
   */
  return createPortal(
    <div className="fixed inset-0 z-50">
      <button
        aria-label="Fermer"
        onClick={onClose}
        className="absolute inset-0 bg-ink/45 anim-fade"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        // dvh, not vh: iOS resolves vh against the *largest* viewport, which
        // pushes the bottom of the sheet under the browser chrome.
        className="absolute inset-x-0 bottom-0 flex max-h-[85dvh] flex-col rounded-t-[28px] bg-white anim-up"
      >
        <div className="flex-none px-5 pt-3.5">
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-line-5" />
          <div className="mb-1.5 flex items-center justify-between">
            <div className="text-[19px] font-extrabold tracking-tight">{title}</div>
            <button
              onClick={onClose}
              className="grid h-[38px] w-[38px] place-items-center rounded-full bg-surface press-scale"
              aria-label="Fermer"
            >
              <Icon name="x" size={17} strokeWidth={2.4} />
            </button>
          </div>
          {subtitle && (
            <p className="mb-2.5 text-[13.5px] leading-snug text-slate-light">{subtitle}</p>
          )}
        </div>
        {/* Only the options scroll, so the title stays put in long lists
            (the enseignant picker is already fifteen names deep). */}
        <div
          className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-5"
          style={{ paddingBottom: "calc(28px + var(--safe-bottom))" }}
        >
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}

export function SheetOption({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex min-h-[54px] w-full items-center border-0 border-b border-line-3 bg-transparent px-1 text-[15.5px] active:bg-surface-2"
      style={{ fontWeight: selected ? 800 : 500, color: selected ? "#0A7F77" : "#0F172A" }}
    >
      <span className="flex-1 text-left">{label}</span>
      {selected && <Icon name="check" size={19} strokeWidth={2.4} />}
    </button>
  );
}
