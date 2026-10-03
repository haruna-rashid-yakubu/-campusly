/*
 * Light on purpose: without it this route would inherit the root launch
 * screen, and a full splash on a tab switch reads as the app restarting.
 */
export default function Loading() {
  return (
    <div className="min-h-dvh px-5" style={{ paddingTop: "calc(20px + var(--safe-top))" }}>
      <div className="mb-4 h-8 w-44 rounded-lg bg-line-3 anim-skeleton" />
      <div className="mb-3 h-[120px] rounded-[20px] bg-line-3 anim-skeleton" />
      <div className="mb-3 h-[120px] rounded-[20px] bg-line-3 anim-skeleton" />
    </div>
  );
}
