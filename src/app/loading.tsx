import { Logo } from "@/components/Logo";

/*
 * The launch screen. Opening the app from the home screen used to show a bare
 * white page until the server answered — long enough on a slow connection to
 * look broken rather than loading. It is the same white, with the app on it:
 * the mark, the name, the line that says what it is for.
 *
 * It is also the boundary every route without its own loading file falls back
 * to, so the siblings each carry a light skeleton instead — a full splash on
 * a tab switch would feel like the app restarting.
 */
export default function Loading() {
  return (
    <div className="anim-fade grid min-h-dvh place-items-center bg-white px-8">
      <div className="-mt-12 text-center">
        <span className="mx-auto block w-fit">
          <Logo size={76} />
        </span>
        <div className="mt-4 text-[26px] font-extrabold tracking-tight">Campusly</div>
        <p className="mt-1 text-[14.5px] leading-snug text-slate-light">
          Ton campus dans une appli
        </p>
        <span
          className="anim-skeleton mx-auto mt-6 block h-1 w-16 rounded-full bg-line-3"
          aria-hidden
        />
      </div>
    </div>
  );
}
