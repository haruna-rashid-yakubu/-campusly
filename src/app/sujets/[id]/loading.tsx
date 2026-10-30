// A Sujet's page while it loads: its header and title, the PDF card, the text.
export default function Loading() {
  return (
    <div className="min-h-dvh">
      <div className="border-b border-line-3 px-3.5 pb-2" style={{ paddingTop: "calc(20px + var(--safe-top))" }}>
        <div className="h-11" />
      </div>
      <div className="px-5 pt-3">
        <div className="h-7 w-3/4 rounded-lg bg-line-3 anim-skeleton" />
        <div className="mt-3 h-4 w-1/2 rounded bg-line-3 anim-skeleton" />
        <div className="mt-5 h-[190px] rounded-[22px] bg-line-3 anim-skeleton" />
        <div className="mt-7 h-5 w-40 rounded bg-line-3 anim-skeleton" />
        <div className="mt-3 h-[260px] rounded-[20px] bg-line-3 anim-skeleton" />
      </div>
    </div>
  );
}
