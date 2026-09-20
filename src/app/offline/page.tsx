import { Logo } from "@/components/Logo";

export default function OfflinePage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-9 text-center">
      <Logo size={88} />
      <div className="mt-6 text-[22px] font-extrabold tracking-tight">Pas de connexion.</div>
      <p className="mt-2 text-[15px] leading-relaxed text-slate-light">
        Cette page n&rsquo;a pas encore été visitée hors ligne. Reconnecte-toi puis réessaie.
      </p>
    </div>
  );
}
