"use client";

/**
 * ConditionToggles — the 4 personal-risk conditions (specs §2 feat 5 / §4:
 * allergy | diabetic | pregnant | kid). Pill chips: ink when active,
 * surface-2 when inactive (design-system §5). Persists through the mock
 * `saveProfile` seam (S13 swaps the body to Supabase). Optimistic — the chip
 * flips immediately; the save is fire-and-forget within the session.
 */

import { useState, useTransition } from "react";
import { saveProfile } from "@/lib/api";
import { cn } from "@/lib/utils";

type Condition = "allergy" | "diabetic" | "pregnant" | "kid";

const OPTIONS: { value: Condition; bm: string; en: string }[] = [
  { value: "allergy", bm: "Alahan", en: "Allergy" },
  { value: "diabetic", bm: "Kencing manis", en: "Diabetic" },
  { value: "pregnant", bm: "Mengandung", en: "Pregnant" },
  { value: "kid", bm: "Untuk anak", en: "For kid" },
];

export function ConditionToggles({ initial }: { initial: string[] }) {
  const [selected, setSelected] = useState<string[]>(initial);
  const [, startTransition] = useTransition();

  const toggle = (c: Condition) => {
    const next = selected.includes(c)
      ? selected.filter((x) => x !== c)
      : [...selected, c];
    setSelected(next);
    // Mock in Phase 1 — persists in-memory for the session. S9/S13: real backend.
    startTransition(async () => {
      await saveProfile(next);
    });
  };

  return (
    <section className="flex flex-col gap-3">
      <p className="type-eyebrow">PROFIL RISIKO · YOUR RISK PROFILE</p>
      <div className="flex flex-wrap gap-2">
        {OPTIONS.map((o) => {
          const active = selected.includes(o.value);
          return (
            <button
              key={o.value}
              type="button"
              aria-pressed={active}
              onClick={() => toggle(o.value)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-ink text-paper"
                  : "bg-surface-2 text-ink-70 hover:bg-line"
              )}
            >
              {o.bm} · {o.en}
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default ConditionToggles;
