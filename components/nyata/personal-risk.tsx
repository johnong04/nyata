"use client";

/**
 * PersonalRiskSection — scan-time "who's this for?" + per-member re-flag (§11.5).
 * Re-filters the ALREADY-generated verdict against the selected member's
 * conditions (lib/personalize) — no new AI call, so copy stays ingredient-factual
 * and non-diagnostic (§6). Premium-gated: until a STUB unlock flips is_premium,
 * the risks sit under the signature RedactionBar (payments deferred to S12).
 */
import { useState } from "react";
import type { Member, Verdict, PersonalCondition } from "@/lib/types";
import { PERSONAL_CONDITIONS } from "@/lib/types";
import { reflagForMember } from "@/lib/personalize";
import { setPremiumStub } from "@/lib/api";
import { RedactionBar } from "@/components/nyata/redaction-bar";
import { cn } from "@/lib/utils";

const labelFor = (c: PersonalCondition) =>
  PERSONAL_CONDITIONS.find((p) => p.value === c);

export function PersonalRiskSection({
  verdict,
  members,
  isPremium,
}: {
  verdict: Verdict;
  members: Member[];
  isPremium: boolean;
}) {
  const [selectedId, setSelectedId] = useState(members[0]?.id);
  const [unlocked, setUnlocked] = useState(isPremium);

  if (members.length === 0) return null;

  const member = members.find((m) => m.id === selectedId) ?? members[0];
  const risks = reflagForMember(verdict, member);

  const RiskList = (
    <div className="flex flex-col gap-2">
      {risks.length === 0 ? (
        <p className="rounded-xl border border-line bg-card p-4 text-sm text-ink-70">
          Tiada risiko khusus dikesan untuk {member.name}. · No specific risks
          detected for {member.name}.
        </p>
      ) : (
        risks.map((r, i) => (
          <div
            key={i}
            className="rounded-xl border border-line bg-card p-4 text-sm text-ink"
          >
            <p className="font-medium">{r.flag.name}</p>
            <p className="mt-1 text-ink-70">
              {r.flag.note_bm} · {r.flag.note_en}
            </p>
            <p className="type-eyebrow mt-2">
              {r.reasons
                .map((c) => {
                  const l = labelFor(c);
                  return l ? `${l.bm} · ${l.en}` : c;
                })
                .join("  ·  ")}
            </p>
          </div>
        ))
      )}
    </div>
  );

  return (
    <section aria-label="Personal risk" className="flex flex-col gap-3">
      <p className="type-eyebrow">RISIKO PERIBADI · FOR WHO?</p>

      {/* Member chip selector. */}
      <div className="flex flex-wrap gap-2">
        {members.map((m) => (
          <button
            key={m.id}
            type="button"
            aria-pressed={m.id === member.id}
            onClick={() => setSelectedId(m.id)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition-colors",
              m.id === member.id
                ? "bg-ink text-paper"
                : "bg-surface-2 text-ink-70 hover:bg-line",
            )}
          >
            {m.name}
          </button>
        ))}
      </div>

      {unlocked ? (
        RiskList
      ) : (
        <div className="flex flex-col gap-3">
          <RedactionBar label="TERSEMBUNYI" revealed={false} className="rounded-xl">
            {RiskList}
          </RedactionBar>
          <button
            type="button"
            onClick={async () => {
              setUnlocked(true); // optimistic reveal
              await setPremiumStub(true);
            }}
            className="rounded-xl bg-ink px-4 py-3 text-sm font-medium text-[color:var(--color-reveal)] ring-1 ring-[color:var(--color-reveal)]/40"
          >
            Buka kunci · Unlock personal flags — RM9
          </button>
          <p className="type-eyebrow text-ink-70">
            Flag ini adalah fakta ramuan, bukan nasihat perubatan. · These flags
            are ingredient facts, not medical advice.
          </p>
        </div>
      )}
    </section>
  );
}

export default PersonalRiskSection;
