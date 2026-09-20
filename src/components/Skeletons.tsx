export function SubjectCardSkeleton() {
  return (
    <div className="mb-3 flex gap-3 rounded-[20px] border border-line p-3.5 anim-skeleton">
      <span className="h-[58px] w-12 flex-none rounded-[10px] bg-line-3" />
      <span className="flex-1">
        <span className="block h-[15px] w-[62%] rounded-[7px] bg-line-3" />
        <span className="mt-2 block h-[11px] w-[44%] rounded-md bg-surface-3" />
        <span className="mt-3 block h-[22px] w-[36%] rounded-lg bg-surface-3" />
      </span>
    </div>
  );
}

export function CiteCardSkeleton() {
  return (
    <div className="mb-3.5 overflow-hidden rounded-[22px] border border-line anim-skeleton">
      <div className="h-[150px] bg-line-3" />
      <div className="p-3.5">
        <div className="h-4 w-[62%] rounded-[7px] bg-line-3" />
        <div className="mt-2.5 h-3 w-[40%] rounded-md bg-surface-3" />
      </div>
    </div>
  );
}
