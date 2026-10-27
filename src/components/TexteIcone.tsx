import { Icon, type IconName } from "@/components/icons";
import { sansEmoji, separerEmoji } from "@/lib/emoji";

/*
 * Text that may open on an emoji ("🛵 Livraison 500 F"): drawn with the
 * matching line icon instead, in the text's own colour. An emoji with no
 * icon of its own is simply dropped.
 */
export function TexteIcone({
  texte,
  size = 16,
  className = "",
}: {
  texte: string;
  size?: number;
  className?: string;
}) {
  const { icone, texte: reste } = separerEmoji(texte);
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      {icone && <Icon name={icone as IconName} size={size} strokeWidth={1.9} className="flex-none" />}
      {/* Any emoji left further on ("… si tu oses 👻") is dropped. */}
      <span>{sansEmoji(reste)}</span>
    </span>
  );
}

/** The icon for an emoji stored on its own (a menu section, a reward), or the fallback. */
export function IconeEmoji({
  emoji,
  fallback = "utensils",
  size = 18,
  className,
}: {
  emoji: string | null | undefined;
  fallback?: IconName | null;
  size?: number;
  className?: string;
}) {
  const icone = (emoji ? separerEmoji(emoji).icone : null) ?? fallback;
  return icone ? <Icon name={icone as IconName} size={size} strokeWidth={1.9} className={className} /> : null;
}
