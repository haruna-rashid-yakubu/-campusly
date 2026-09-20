"use client";

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
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40">
      <button
        aria-label="Fermer"
        onClick={onClose}
        className="absolute inset-0 bg-ink/45 anim-fade"
      />
      <div
        className="no-scrollbar absolute inset-x-0 bottom-0 max-h-[75vh] overflow-y-auto rounded-t-[28px] bg-white px-5 pb-8 pt-3.5 anim-up"
        style={{ paddingBottom: "calc(28px + var(--safe-bottom))" }}
      >
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
        {subtitle && <p className="mb-2.5 text-[13.5px] leading-snug text-slate-light">{subtitle}</p>}
        {children}
      </div>
    </div>
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
