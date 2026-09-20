import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-9 text-center">
      <Logo size={72} />
      <div className="mt-6 text-[22px] font-extrabold tracking-tight">Page introuvable</div>
      <p className="mt-2 max-w-xs text-[15px] leading-relaxed text-slate-light">
        Cette page n&rsquo;existe pas ou plus.
      </p>
      <Link
        href="/"
        className="press-scale mt-6 flex h-[54px] items-center rounded-2xl bg-teal px-6 text-[15.5px] font-bold text-white active:bg-teal-press"
      >
        Retour à l&rsquo;accueil
      </Link>
    </div>
  );
}
