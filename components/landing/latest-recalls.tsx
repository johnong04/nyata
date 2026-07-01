/**
 * Latest Recalls — republished official-source citations (design-system §9).
 * Server component. Each row links its `official_url`; the severity stamp is the
 * only place verdict tokens appear here. Halal is never asserted — the section
 * note frames it as "verify with JAKIM".
 */

import type { LandingRecall } from "@/lib/landing-data";
import type { Severity } from "@/lib/types";

/** Recall severity → verdict token band (design-system §3). */
const SEV: Record<Severity, { cls: string; label: string }> = {
  high: { cls: "bg-elak-bg text-elak", label: "ELAK" },
  med: { cls: "bg-waspada-bg text-waspada", label: "WASPADA" },
  low: { cls: "bg-waspada-bg text-waspada", label: "WASPADA" },
};

export default function LatestRecalls({
  recalls,
}: {
  recalls: LandingRecall[];
}) {
  if (recalls.length === 0) return null;

  return (
    <section className="mx-auto max-w-md px-1 py-14">
      <p className="type-eyebrow">Rekod rasmi · Official record</p>
      <h2 className="mt-2 font-display text-3xl font-bold text-ink">
        Latest recalls
      </h2>
      <p className="type-mono mt-2 text-ink-40">
        Republished from official sources. Halal status? Verify with JAKIM.
      </p>

      <ul className="mt-6 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-card">
        {recalls.map((r) => {
          const sev = SEV[r.severity];
          return (
            <li key={`${r.source}-${r.date}`} className="flex flex-col gap-2 p-5">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 font-mono text-[0.6875rem] font-bold uppercase tracking-wide ${sev.cls}`}
                >
                  {sev.label}
                </span>
                <span className="type-mono text-ink-40">{r.date}</span>
              </div>
              <p className="text-sm font-medium text-ink">{r.title}</p>
              <p className="type-mono text-ink-40">
                {r.brand} · {r.product}
              </p>
              <a
                href={r.official_url}
                target="_blank"
                rel="noopener noreferrer"
                className="type-mono text-ink-70 underline underline-offset-2 hover:text-ink"
              >
                {r.source} — Read source →
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
