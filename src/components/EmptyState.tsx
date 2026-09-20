import type { IconName } from "@/components/icons";
import { Icon } from "@/components/icons";

export function EmptyState({
  icon,
  title,
  body,
  children,
}: {
  icon: IconName;
  title: string;
  body: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="anim-fade px-4 py-12 text-center">
      <span className="mx-auto mb-[18px] grid h-[74px] w-[74px] place-items-center rounded-[24px] bg-surface text-slate-light">
        <Icon name={icon} size={32} strokeWidth={1.5} />
      </span>
      <div className="text-lg font-extrabold">{title}</div>
      <p className="mx-auto mt-2 max-w-xs text-[14.5px] leading-relaxed text-slate-light">{body}</p>
      {children}
    </div>
  );
}

export function Badge({
  tone,
  children,
}: {
  tone: "teal" | "neutral" | "danger" | "warn";
  children: React.ReactNode;
}) {
  const tones: Record<typeof tone, string> = {
    teal: "bg-teal-tint text-teal-active",
    neutral: "bg-surface text-ink-soft",
    danger: "bg-danger-tint text-danger",
    warn: "bg-warn-tint text-warn-ink",
  };
  return (
    <span
      className={
        "inline-flex h-[26px] flex-none items-center rounded-[9px] px-2.5 text-[11.5px] font-extrabold " +
        tones[tone]
      }
    >
      {children}
    </span>
  );
}

