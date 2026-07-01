/**
 * PremiumBadge — premium status (design-system §2: premium cards are ink).
 * Active = ink surface. Locked = quiet card with the RM9 one-time pitch; the
 * actual paywall is the RedactionBar over the risk flags, not this badge, so
 * this stays calm and never uses a turmeric fill (turmeric = reveal/stamp only).
 */

import { cn } from "@/lib/utils";

export function PremiumBadge({ isPremium }: { isPremium: boolean }) {
  return (
    <section
      className={cn(
        "rounded-2xl p-5",
        isPremium ? "bg-ink text-paper" : "border border-line bg-card"
      )}
    >
      <p
        className={cn(
          "type-eyebrow",
          isPremium ? "text-paper/70" : undefined
        )}
      >
        {isPremium ? "PREMIUM · AKTIF" : "PREMIUM · TERKUNCI"}
      </p>
      <p className="type-display mt-2 text-xl leading-tight">
        {isPremium
          ? "Premium aktif · Premium active"
          : "Buka flag peribadi · Unlock personal flags"}
      </p>
      {!isPremium && (
        <p className="mt-2 text-sm text-ink-70">
          RM9 sekali bayar · one-time. Flag risiko khas untuk keadaan anda —
          personal risk flags, just for you.
        </p>
      )}
    </section>
  );
}

export default PremiumBadge;
