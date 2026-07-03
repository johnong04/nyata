"use client";

/**
 * ProfilePanel — the personal file (specs §2 feat 5). Condition toggles +
 * premium status + personal-risk flags. When !is_premium the flags sit under
 * the signature RedactionBar (stamped TERSEMBUNYI) — the bar IS the paywall
 * (design-system §1). `revealed={false}` keeps them locked (the bar otherwise
 * auto-reveals on mount). Flags are informational, not medical advice (§9).
 */

import type { Profile } from "@/lib/types";
import { RedactionBar } from "@/components/nyata/redaction-bar";
import { MembersPanel } from "./members-panel";
import { PremiumBadge } from "./premium-badge";

const RISK_FLAGS = [
  {
    bm: "Mengandungi kacang — risiko alahan",
    en: "Contains peanut — allergy risk",
  },
  {
    bm: "Gula tinggi — perhatian diabetik",
    en: "High sugar — diabetic caution",
  },
];

export function ProfilePanel({ initial }: { initial: Profile }) {
  const isPremium = initial.is_premium;

  return (
    <div className="flex flex-col gap-8">
      <MembersPanel initial={initial.members} />

      <PremiumBadge isPremium={isPremium} />

      <section className="flex flex-col gap-3">
        <p className="type-eyebrow">FLAG RISIKO PERIBADI · PERSONAL RISK FLAGS</p>
        <div className="flex flex-col gap-2">
          {RISK_FLAGS.map((f, i) =>
            isPremium ? (
              <div
                key={i}
                className="rounded-xl border border-line bg-card p-4 text-sm text-ink"
              >
                {f.bm} · {f.en}
              </div>
            ) : (
              <RedactionBar
                key={i}
                label="TERSEMBUNYI"
                revealed={false}
                className="rounded-xl"
              >
                <div className="rounded-xl border border-line bg-card p-4 text-sm text-ink">
                  {f.bm} · {f.en}
                </div>
              </RedactionBar>
            )
          )}
        </div>
      </section>
    </div>
  );
}

export default ProfilePanel;
