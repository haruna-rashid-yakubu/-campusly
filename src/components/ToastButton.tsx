"use client";

import type { IconName } from "@/components/icons";
import { Icon } from "@/components/icons";
import { useToast } from "@/components/Toast";

export function ToastButton({
  message,
  icon,
  className,
  children,
}: {
  message: string;
  icon?: IconName;
  className?: string;
  children: React.ReactNode;
}) {
  const { show } = useToast();
  return (
    <button onClick={() => show(message)} className={className}>
      {icon && <Icon name={icon} size={18} strokeWidth={1.9} />}
      {children}
    </button>
  );
}
