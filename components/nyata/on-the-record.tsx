"use client";

/**
 * "On the record" (specs §11.2) — attributed, hedged, credibility-gated
 * third-party reports for a brand. LEGAL: every card shows a named source + a
 * working link; the summary is hedged; a disclaimer + right-of-reply link are
 * always present; NEVER a Nyata brand accusation. This surface NEVER affects the
 * numeric verdict. Pre-warmed brands render instantly (initialDossier); others
 * load on the "dig deeper" tap.
 */
import { useState } from "react";
import Link from "next/link";
import type { Dossier, DossierSource, Product } from "@/lib/types";
import { getDossier } from "@/lib/api";

const CRED_CLASS: Record<DossierSource["credibility_label"], string> = {
  high: "text-selamat border-selamat",
  med: "text-waspada border-waspada",
  low: "text-ink-40 border-line",
};
const CRED_LABEL: Record<DossierSource["credibility_label"], string> = {
  high: "TINGGI · HIGH",
  med: "SEDERHANA · MED",
  low: "RENDAH · LOW",
};

export function OnTheRecord({
  product,
  initialDossier,
}: {
  product: Product;
  initialDossier: Dossier | null;
}) {
  const [dossier, setDossier] = useState<Dossier | null>(initialDossier);
  const [loading, setLoading] = useState(false);
  const [tapped, setTapped] = useState(false);

  async function digDeeper() {
    setLoading(true);
    setTapped(true);
    const d = await getDossier({
      brand: product.brand,
      name: product.name,
      barcode: product.barcode,
    });
    setDossier(d);
    setLoading(false);
  }

  const reportHref = `/report?ref=${encodeURIComponent(product.brand || product.name || product.barcode)}`;

  return (
    <section aria-label="On the record" className="flex flex-col gap-3">
      <h2 className="type-eyebrow">DALAM REKOD · ON THE RECORD</h2>

      {!dossier && !tapped && (
        <button
          onClick={digDeeper}
          className="rounded-xl border border-line bg-surface-2 px-4 py-3 text-left font-mono text-sm text-ink hover:bg-line/40"
        >
          Gali lebih dalam · Dig deeper — what sources say about {product.brand || product.name} →
        </button>
      )}

      {loading && (
        <p className="rounded-xl border border-line bg-surface-2 p-4 font-mono text-sm text-ink-40">
          Menyemak sumber… · Checking attributed sources…
        </p>
      )}

      {tapped && !loading && !dossier && (
        <p className="rounded-xl border border-line bg-surface-2 p-4 text-ink-70">
          Tiada laporan bersumber dalam rekod buat masa ini. · No attributed reports on record yet.
        </p>
      )}

      {dossier && (
        <div className="flex flex-col gap-3">
          <p className="text-ink">{dossier.summary_en}</p>
          <p className="text-ink-70">{dossier.summary_bm}</p>

          <ul className="flex flex-col gap-3">
            {dossier.sources.map((s) => (
              <li key={s.url} className="rounded-2xl border border-line bg-surface-2 p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-sm font-bold text-ink">{s.source_name}</span>
                  <span
                    className={`rounded-full border px-2 py-0.5 font-mono text-[0.625rem] uppercase tracking-[0.16em] ${CRED_CLASS[s.credibility_label]}`}
                  >
                    {CRED_LABEL[s.credibility_label]}
                  </span>
                </div>
                <p className="mt-2 font-mono text-sm text-ink-70">&ldquo;{s.verbatim_snippet}&rdquo;</p>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-xs text-ink underline underline-offset-2 break-all"
                  >
                    {s.url}
                  </a>
                  {s.date && <span className="shrink-0 font-mono text-xs text-ink-40">{s.date}</span>}
                </div>
              </li>
            ))}
          </ul>

          {/* Disclaimer + right-of-reply (legal §11.2, always present when shown). */}
          <p className="font-mono text-xs text-ink-40">
            Laporan pihak ketiga yang disumberkan — bukan tuduhan Nyata. · Attributed third-party
            reports, not Nyata&rsquo;s claim. Read the sources and decide for yourself.
          </p>
          <Link href={reportHref} className="font-mono text-xs text-ink underline underline-offset-2">
            Lapor / hak menjawab · Report this / right of reply →
          </Link>
        </div>
      )}
    </section>
  );
}
