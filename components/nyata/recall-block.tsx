/**
 * RecallBlock — official-source recall citation. DATA-INTEGRITY CRITICAL PATH
 * (specs §6, design-system §9). Republishes OFFICIAL data ONLY: every entry
 * shows the source name, the date, and a working link to the official notice,
 * in neutral factual language ("listed in <source> ... dated <date>"). NEVER a
 * self-authored brand or health accusation. Renders nothing when there are no
 * recalls — absence of a recall is never implied to be a clearance.
 */
import type { Recall } from "@/lib/types";

export function RecallBlock({ recalls }: { recalls: Recall[] }) {
  if (!recalls || recalls.length === 0) return null;
  return (
    <section
      aria-label="Official recall"
      className="rounded-2xl border border-elak bg-elak-bg p-4"
    >
      <h2 className="mb-3 font-mono text-[0.8125rem] uppercase tracking-[0.16em] text-elak">
        AMARAN PENARIKAN BALIK · OFFICIAL RECALL
      </h2>
      <ul className="flex flex-col gap-4">
        {recalls.map((r) => (
          <li key={r.official_url} className="flex flex-col gap-1">
            {/* Neutral factual language — quote the official listing only. */}
            <p className="text-ink">
              Listed in <span className="font-medium">{r.source}</span> recall dated{" "}
              <span className="font-mono">{r.date}</span>.
            </p>
            <p className="font-mono text-sm text-ink-70">{r.title}</p>
            <a
              href={r.official_url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-sm text-ink underline underline-offset-2 break-all"
            >
              {r.official_url}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
