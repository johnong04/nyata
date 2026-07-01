/**
 * PremiumUpsell — RM9 personal-risk-profile teaser (design-system §6 premium
 * card). The personalized risks stay UNDER a RedactionBar (never revealed in
 * Phase 1 — payments are a later slice), so the redaction signature reads as
 * the paywall itself. CTA is present but inert. No self-authored health claims
 * in the teaser; the redacted copy only names the category, not a verdict.
 */
import { RedactionBar } from "@/components/nyata/redaction-bar";
import { BackgroundGradient } from "@/components/ui/background-gradient";
import { Button } from "@/components/ui/button";

export function PremiumUpsell() {
  return (
    <BackgroundGradient className="rounded-2xl" containerClassName="rounded-2xl">
      <section className="rounded-2xl bg-ink p-5 text-paper">
        <span className="font-mono text-[0.8125rem] uppercase tracking-[0.16em] text-paper/60">
          PROFIL RISIKO PERIBADI · PERSONAL RISK
        </span>
        <h2 className="mt-2 font-display text-2xl font-bold">
          Risiko untuk anda · Your personal risks
        </h2>
        {/* Personalized risks stay redacted until unlocked. glow off inside the
            ink card so the bar reads as a paywall, not the scan reveal. */}
        <div className="mt-4">
          <RedactionBar revealed={false} revealOnMount={false} glow={false} label="TERSEMBUNYI">
            <p className="text-paper/90">
              Allergen &amp; condition-specific flags for your profile.
            </p>
          </RedactionBar>
        </div>
        <Button className="mt-5 w-full rounded-xl bg-ink text-[color:var(--color-reveal)] ring-1 ring-[color:var(--color-reveal)]/40" disabled>
          Buka kunci · Unlock — RM9
        </Button>
        <p className="mt-2 font-mono text-xs text-paper/50">Akan datang · Coming soon</p>
      </section>
    </BackgroundGradient>
  );
}
