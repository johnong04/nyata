/**
 * HazardPanel — the AI breakdown (design-system §6: bento-grid + glowing-effect).
 * Each flagged additive/nutrient is an evidence tile: E-number in mono, name,
 * bilingual note, and a severity accent on the verdict scale. This is the
 * content that sits UNDER the RedactionBar and is exposed by the un-redaction.
 */
import type { Flag } from "@/lib/types";
import { splitFlagsBySeverity, severityToToken } from "@/lib/verdict-ui";
import { BentoGrid } from "@/components/ui/bento-grid";
import { GlowingEffect } from "@/components/ui/glowing-effect";

const SEV_ACCENT: Record<string, string> = {
  elak: "text-elak",
  waspada: "text-waspada",
  selamat: "text-selamat",
};
const SEV_LABEL: Record<string, string> = {
  elak: "TINGGI · HIGH",
  waspada: "SEDERHANA · MED",
  selamat: "RENDAH · LOW",
};

export function HazardPanel({ flags }: { flags: Flag[] }) {
  if (!flags || flags.length === 0) {
    return (
      <section aria-label="AI breakdown">
        <h2 className="type-eyebrow mb-3">HURAI AI · AI BREAKDOWN</h2>
        <p className="rounded-2xl border border-line bg-surface-2 p-4 text-ink-70">
          Tiada bahan tambahan berisiko dikesan. · No risky additives detected.
        </p>
      </section>
    );
  }

  const { elak, waspada, selamat } = splitFlagsBySeverity(flags);
  const ordered = [...elak, ...waspada, ...selamat];

  return (
    <section aria-label="AI breakdown">
      <h2 className="type-eyebrow mb-3">HURAI AI · AI BREAKDOWN</h2>
      <BentoGrid className="grid-cols-1 gap-3 sm:grid-cols-2 md:auto-rows-auto md:grid-cols-2">
        {ordered.map((f, i) => {
          const token = severityToToken(f.severity);
          return (
            <div
              key={`${f.kind}-${f.e_number ?? f.name}-${i}`}
              className="relative overflow-hidden rounded-2xl border border-line bg-surface-2 p-4"
            >
              <GlowingEffect disabled={false} glow spread={40} borderWidth={2} />
              <div className="relative flex items-baseline gap-2">
                {f.e_number && (
                  <span className="font-mono text-sm font-bold text-ink">{f.e_number}</span>
                )}
                <span className="font-medium text-ink">{f.name}</span>
              </div>
              <p className="relative mt-1 text-sm text-ink-70">{f.note_en}</p>
              <p className="relative mt-0.5 text-sm text-ink-40">{f.note_bm}</p>
              {f.jurisdiction && (
                <div className="relative mt-2 border-l-2 border-reveal pl-2">
                  <span className="block font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-reveal">
                    LINTAS SEMPADAN · CROSS-BORDER
                  </span>
                  <p className="mt-0.5 text-sm text-ink">{f.jurisdiction.jurisdiction}</p>
                  <p className="mt-1 font-mono text-xs text-ink-70">
                    &ldquo;{f.jurisdiction.verbatim_quote}&rdquo;
                  </p>
                  <a
                    href={f.jurisdiction.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 block font-mono text-xs text-ink-40 underline underline-offset-2 break-all"
                  >
                    {f.jurisdiction.authority} · {f.jurisdiction.source_url}
                  </a>
                </div>
              )}
              <span
                className={`relative mt-2 block font-mono text-xs uppercase tracking-[0.16em] ${SEV_ACCENT[token]}`}
              >
                {SEV_LABEL[token]}
              </span>
            </div>
          );
        })}
      </BentoGrid>
    </section>
  );
}
