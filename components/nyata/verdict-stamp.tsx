/**
 * VerdictStamp — the stamped classification (design-system §3/§5).
 * Giant verdict word + score + EN gloss inside a square hard-edged frame
 * (the one non-rounded family). Verdict-ink coloured; consumes the band helper
 * so it never re-derives the band. Turmeric accent lives on the stamp eyebrow.
 */
import { ratingToVerdict } from "@/lib/verdict-ui";

const TEXT_TONE: Record<string, string> = {
  selamat: "text-selamat",
  waspada: "text-waspada",
  elak: "text-elak",
};
const BORDER_TONE: Record<string, string> = {
  selamat: "border-selamat",
  waspada: "border-waspada",
  elak: "border-elak",
};

export function VerdictStamp({ rating }: { rating: number }) {
  const v = ratingToVerdict(rating);
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <span className="type-eyebrow text-[color:var(--color-reveal)]">
        KLASIFIKASI · CLASSIFICATION
      </span>
      {/* Square stamp frame — hard edge (§5), verdict-ink border. */}
      <div
        className={`rounded-none border-2 px-6 py-4 ${TEXT_TONE[v.token]} ${BORDER_TONE[v.token]}`}
        data-token={v.token}
      >
        <span className="type-verdict block">{v.word}</span>
      </div>
      <div className="flex items-baseline gap-3">
        <span className={`font-mono text-2xl font-bold ${TEXT_TONE[v.token]}`}>
          {v.score}
        </span>
        <span className="type-eyebrow">/ 10 · {v.gloss}</span>
      </div>
    </div>
  );
}
