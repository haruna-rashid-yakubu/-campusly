/*
 * A shop page while it loads: its header, then three menu lines, in the shapes
 * they will have, so nothing jumps when the real page arrives.
 */
export default function Loading() {
  return (
    <div className="min-h-dvh px-5" style={{ paddingTop: "calc(20px + var(--safe-top))" }}>
      <div className="anim-skeleton mb-4 h-7 w-40 rounded-lg bg-line-3" />
      <div className="anim-skeleton h-[220px] rounded-[22px] bg-line-3" />
      <div className="anim-skeleton mt-6 h-6 w-48 rounded-lg bg-line-3" />
      {[0, 1, 2].map((i) => (
        <div key={i} className="mt-3 flex gap-3 rounded-[20px] border border-line p-3">
          <div className="anim-skeleton h-16 w-16 flex-none rounded-[14px] bg-line-3" />
          <div className="flex-1 space-y-2 pt-1">
            <div className="anim-skeleton h-4 w-2/3 rounded bg-line-3" />
            <div className="anim-skeleton h-3 w-1/2 rounded bg-line-3" />
          </div>
        </div>
      ))}
    </div>
  );
}
