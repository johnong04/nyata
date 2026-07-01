/**
 * RatingStamp — compact feed variant of the verdict stamp (design-system §3/§5).
 * Square hard-edged frame (the one non-rounded family), verdict-ink coloured,
 * showing score + verdict word. Higher score = worse. Consumes ratingToVerdict
 * so the band math never re-derives here. Verdict colour lives ONLY in stamps
 * like this and recall accents (design-system §2 rule).
 */
import { ratingToVerdict } from "@/lib/verdict-ui";
import { cn } from "@/lib/utils";

const TONE: Record<string, { text: string; border: string; bg: string }> = {
  selamat: {
    text: "text-selamat",
    border: "border-selamat",
    bg: "bg-selamat-bg",
  },
  waspada: {
    text: "text-waspada",
    border: "border-waspada",
    bg: "bg-waspada-bg",
  },
  elak: { text: "text-elak", border: "border-elak", bg: "bg-elak-bg" },
};

export function RatingStamp({ rating }: { rating: number }) {
  const v = ratingToVerdict(rating);
  const tone = TONE[v.token];
  return (
    <div
      className={cn(
        "flex shrink-0 flex-col items-center justify-center rounded-none border-2 px-2.5 py-1.5",
        tone.border,
        tone.bg
      )}
      data-token={v.token}
    >
      <span className={cn("font-mono text-lg font-bold leading-none", tone.text)}>
        {v.score}
      </span>
      <span
        className={cn(
          "mt-1 font-mono text-[0.625rem] font-bold uppercase leading-none tracking-[0.12em]",
          tone.text
        )}
      >
        {v.word}
      </span>
    </div>
  );
}

export default RatingStamp;
