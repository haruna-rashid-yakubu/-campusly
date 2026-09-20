import { Icon } from "@/components/icons";

export function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={
        "press-scale flex h-10 flex-none items-center gap-1.5 whitespace-nowrap rounded-[13px] px-3.5 text-[13.5px] font-bold " +
        (active ? "bg-teal text-white" : "bg-surface-2 text-slate")
      }
    >
      {label}
      <Icon name="chevD" size={15} strokeWidth={2.2} />
    </button>
  );
}

export function FieldButton({
  value,
  onClick,
}: {
  value: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex h-[52px] w-full items-center justify-between rounded-2xl border-[1.5px] border-line-2 bg-white px-3.5 text-[15px] font-semibold active:border-teal"
    >
      {value}
      <Icon name="chevD" size={18} strokeWidth={2} />
    </button>
  );
}
