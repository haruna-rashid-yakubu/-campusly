import { Icon } from "@/components/icons";
import { SignInButton } from "@/components/SignInButton";

/*
 * Signed out, the loyalty card shrinks to its point: one line saying what
 * signing in brings. The full empty card stood between the student and the
 * menu, a screen's height to scroll past before the first dish.
 */
export function FideliteInvite({ texte }: { texte: string }) {
  return (
    <div className="mt-3 flex items-center gap-2.5 rounded-[14px] bg-[var(--v-doux,#fff6f9)] px-3.5 py-2.5 text-[13px] text-ink-soft">
      <Icon name="gift" size={17} strokeWidth={1.9} className="flex-none text-[var(--v-fonce,#c2185b)]" />
      <span className="min-w-0 flex-1 leading-snug">{texte}</span>
      <SignInButton className="flex-none text-[13px] font-extrabold text-[var(--v-fonce,#c2185b)] disabled:opacity-60" />
    </div>
  );
}
