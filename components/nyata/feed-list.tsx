"use client";

/**
 * FeedList — the "Hidden Ingredients" feed island (S6). Holds the filter state,
 * re-queries the `getFeed(filter)` seam on tab switch, and renders product cards
 * (rating stamp + flagged count → product detail) plus standalone official-recall
 * cards. All data is official-source / verdict-derived; recall cards fail closed
 * (getFeedRecalls drops any lacking official_url) and always link out.
 *
 * Filter chips reuse the Aceternity animated-pill idiom (motion `layoutId`, the
 * same technique as @aceternity/tabs), recoloured to ink tokens — the stock Tabs
 * component is a 3D card-stack carousel, not filter chips, so its shell is
 * unsuitable here (deviation flagged). Feed cards reuse the card-hover-effect
 * hover-glow (layoutId background) with feed-specific bodies.
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { FeedFilter, FeedItem, Recall } from "@/lib/types";
import { getFeed, getFeedRecalls } from "@/lib/api";
import { RatingStamp } from "@/components/nyata/rating-stamp";
import { cn } from "@/lib/utils";

type Chip = { value: FeedFilter; label: string; sub: string };

// PREFLIGHT #4: 3 tabs (Additive dropped). Feed→worst, Newest→newest, Recalled.
const CHIPS: Chip[] = [
  { value: "worst", label: "Feed", sub: "Teruk" },
  { value: "newest", label: "Newest", sub: "Terkini" },
  { value: "recalled", label: "Recalled", sub: "Ditarik" },
];

export function FeedList({
  initialItems,
  initialRecalls,
}: {
  initialItems: FeedItem[];
  initialRecalls: Recall[];
}) {
  const [filter, setFilter] = useState<FeedFilter>("worst");
  const [items, setItems] = useState<FeedItem[]>(initialItems);
  const recalls = initialRecalls;
  const reduce = useReducedMotion();

  useEffect(() => {
    let active = true;
    getFeed(filter).then((next) => {
      if (active) setItems(next);
    });
    return () => {
      active = false;
    };
  }, [filter]);

  const showRecalls = filter === "recalled";
  // In the Recalled view, standalone official-recall cards lead; product items
  // flagged recalled follow. Elsewhere, only product cards.
  const products = showRecalls ? items.filter((i) => i.recalled) : items;

  return (
    <div>
      {/* Filter chips — ink pill slides between tabs (animated-tabs idiom). */}
      <div
        role="tablist"
        aria-label="Feed filter"
        className="flex gap-1 rounded-full border border-line bg-surface-2 p-1"
      >
        {CHIPS.map((chip) => {
          const isActive = filter === chip.value;
          return (
            <button
              key={chip.value}
              role="tab"
              aria-selected={isActive}
              onClick={() => setFilter(chip.value)}
              className="relative flex-1 rounded-full px-3 py-2 text-center outline-none focus-visible:ring-2 focus-visible:ring-ink"
            >
              {isActive && (
                <motion.span
                  layoutId="feed-chip"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                  className="absolute inset-0 rounded-full bg-ink"
                />
              )}
              <span
                className={cn(
                  "relative block font-mono text-xs font-bold uppercase tracking-[0.08em] transition-colors",
                  isActive ? "text-paper" : "text-ink-70"
                )}
              >
                {chip.label}
              </span>
              <span
                className={cn(
                  "relative block text-[0.625rem] transition-colors",
                  isActive ? "text-paper/60" : "text-ink-40"
                )}
              >
                {chip.sub}
              </span>
            </button>
          );
        })}
      </div>

      {/* List */}
      <div className="mt-5 flex flex-col gap-3">
        {showRecalls &&
          recalls.map((r, i) => (
            <RecallCard key={r.official_url} recall={r} index={i} reduce={reduce} />
          ))}

        {products.map((item, i) => (
          <ProductCard
            key={item.barcode}
            item={item}
            index={showRecalls ? recalls.length + i : i}
            reduce={reduce}
          />
        ))}

        {products.length === 0 && !showRecalls && <EmptyState />}
        {showRecalls && recalls.length === 0 && products.length === 0 && (
          <EmptyState />
        )}
      </div>
    </div>
  );
}

/** Fade-up stagger 40ms (design-system §7); instant under reduced motion. */
function stagger(index: number, reduce: boolean | null) {
  if (reduce) return { initial: false as const };
  return {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.28, delay: index * 0.04, ease: "easeOut" as const },
  };
}

function ProductCard({
  item,
  index,
  reduce,
}: {
  item: FeedItem;
  index: number;
  reduce: boolean | null;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <motion.div {...stagger(index, reduce)} className="relative">
      <Link
        href={`/product/${item.barcode}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="relative block rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-ink"
      >
        <AnimatePresence>
          {hovered && (
            <motion.span
              layoutId="feed-hover"
              className="absolute inset-0 -z-0 block rounded-2xl bg-surface-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: 0.15 } }}
              exit={{ opacity: 0, transition: { duration: 0.15, delay: 0.1 } }}
            />
          )}
        </AnimatePresence>
        <div className="relative z-10 flex items-center gap-3 rounded-2xl border border-line bg-card p-3 shadow-[0_1px_2px_rgba(23,20,15,.05),0_8px_24px_rgba(23,20,15,.06)]">
          {/* Product thumbnail — mono placeholder (document artifact). */}
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-surface-2">
            <span className="font-mono text-[0.625rem] text-ink-40">
              {item.brand.slice(0, 3).toUpperCase()}
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <p className="font-mono text-[0.625rem] uppercase tracking-[0.12em] text-ink-40">
              {item.brand}
            </p>
            <p className="truncate font-display font-bold leading-tight text-ink">
              {item.name}
            </p>
            <p className="mt-1 font-mono text-xs text-ink-70">
              {item.flagged_count > 0
                ? `${item.flagged_count} flagged as risky · ${item.flagged_count} ditanda`
                : "No flags · Tiada tanda"}
            </p>
          </div>

          <div className="flex flex-col items-end gap-1.5">
            <RatingStamp rating={item.rating} />
            <span className="font-mono text-[0.625rem] uppercase tracking-[0.08em] text-ink-40">
              Details →
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

/**
 * RecallCard — ink/black official-recall card (design-system §9 legal path).
 * Neutral factual copy ("listed in {source} recall dated {date}"), source badge,
 * and a direct outbound link to the official notice. Never rendered without an
 * official_url (getFeedRecalls fails closed upstream).
 */
function RecallCard({
  recall,
  index,
  reduce,
}: {
  recall: Recall;
  index: number;
  reduce: boolean | null;
}) {
  return (
    <motion.a
      {...stagger(index, reduce)}
      href={recall.official_url}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-2xl bg-ink p-4 text-paper outline-none focus-visible:ring-2 focus-visible:ring-reveal focus-visible:ring-offset-2"
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-elak">
          Penarikan Balik Rasmi · Official Recall
        </span>
        {/* Source badge — square, mono (document stamp). */}
        <span className="rounded-none border border-paper/30 px-2 py-0.5 font-mono text-[0.625rem] uppercase tracking-[0.08em] text-paper/80">
          {recall.source}
        </span>
      </div>
      <p className="mt-2 leading-snug text-paper">
        Listed in <span className="font-medium">{recall.source}</span> recall dated{" "}
        <span className="font-mono">{recall.date}</span>.
      </p>
      <p className="mt-1 font-mono text-xs leading-snug text-paper/60">
        {recall.title}
      </p>
      <span className="mt-3 inline-block font-mono text-xs uppercase tracking-[0.08em] text-reveal underline underline-offset-4">
        View official source →
      </span>
    </motion.a>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-card/50 p-8 text-center">
      <p className="font-display text-lg font-bold text-ink">
        Belum ada apa-apa di sini
      </p>
      <p className="mt-1 text-sm text-ink-70">Nothing here yet.</p>
      <Link
        href="/scan"
        className="mt-4 inline-block rounded-xl bg-ink px-4 py-2 font-mono text-xs uppercase tracking-[0.08em] text-paper"
      >
        Imbas produk · Scan a product →
      </Link>
    </div>
  );
}

export default FeedList;
