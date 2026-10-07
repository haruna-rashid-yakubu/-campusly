import { Icon } from "@/components/icons";

export function Chip({
  label,
  active,
  onClick,
  purpose,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  /*
   * What the chip filters, for a screen reader. Once a value is picked the
   * label becomes the value itself -- "≤ 2 km" -- which says nothing about
   * what it narrows. Sighted readers get that from the row of chips; a reader
   * announcing one button at a time does not.
   */
  purpose?: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={purpose ? `${purpose} : ${label}` : undefined}
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
