export function PageHeader({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div
      className="sticky top-0 z-10 bg-white px-5 pb-3"
      style={{ paddingTop: "calc(20px + var(--safe-top))" }}
    >
      <div className="text-[24px] font-extrabold tracking-tight">{title}</div>
      {subtitle && <div className="mt-1 text-[13.5px] text-slate-light">{subtitle}</div>}
      {children}
    </div>
  );
}
