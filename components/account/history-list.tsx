/**
 * HistoryList — the scan log (specs §2). Each row: product name (body) +
 * brand/date (mono, ink-40) + the square verdict RatingStamp (S6), linking to
 * /product/<barcode>. Empty state invites a scan (design-system §9: empty
 * screens are an invitation to act). Server component — no interactivity.
 */

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { Scan } from "@/lib/types";
import { RatingStamp } from "@/components/nyata/rating-stamp";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-MY", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function HistoryList({ items }: { items: Scan[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line p-8 text-center">
        <p className="type-display text-xl text-ink">Belum ada imbasan</p>
        <p className="mt-2 text-sm text-ink-70">
          Imbas produk pertama anda · Scan your first product.
        </p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {items.map((s) => (
        <li key={s.barcode}>
          <Link
            href={`/product/${s.barcode}`}
            className="flex items-center gap-3 rounded-2xl border border-line bg-card p-3 transition-colors hover:bg-surface-2"
          >
            <RatingStamp rating={s.rating} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-ink">{s.name}</p>
              <p className="type-mono mt-1 truncate text-ink-40">
                {s.barcode} · {formatDate(s.scanned_at)}
              </p>
            </div>
            <ChevronRight
              className="h-4 w-4 shrink-0 text-ink-40"
              strokeWidth={2}
              aria-hidden
            />
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default HistoryList;
