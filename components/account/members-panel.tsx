"use client";

/**
 * MembersPanel — "who are you buying for?" (specs §11.5). Self + kids, each with
 * closed condition chips (no free-text). This doubles as onboarding: one surface,
 * not a wizard. Optimistic; saveMembers is fire-and-forget within the session
 * (S13 seam persists to profiles.members for signed-in users).
 */
import { useState, useTransition } from "react";
import type { Member, PersonalCondition } from "@/lib/types";
import { PERSONAL_CONDITIONS } from "@/lib/types";
import { saveMembers } from "@/lib/api";
import { cn } from "@/lib/utils";

let seq = 0;
const newId = () => `m-${Date.now()}-${seq++}`;

export function MembersPanel({ initial }: { initial: Member[] }) {
  const [members, setMembers] = useState<Member[]>(
    initial.length > 0
      ? initial
      : [{ id: "self", name: "Saya · Me", conditions: [] }],
  );
  const [, startTransition] = useTransition();

  const persist = (next: Member[]) => {
    setMembers(next);
    startTransition(async () => {
      await saveMembers(next);
    });
  };

  const toggle = (memberId: string, c: PersonalCondition) => {
    persist(
      members.map((m) =>
        m.id !== memberId
          ? m
          : {
              ...m,
              conditions: m.conditions.includes(c)
                ? m.conditions.filter((x) => x !== c)
                : [...m.conditions, c],
            },
      ),
    );
  };

  const rename = (memberId: string, name: string) =>
    persist(members.map((m) => (m.id === memberId ? { ...m, name } : m)));

  const addMember = () =>
    persist([...members, { id: newId(), name: "Ahli baru", conditions: [] }]);

  const removeMember = (memberId: string) =>
    persist(members.filter((m) => m.id !== memberId));

  return (
    <section className="flex flex-col gap-4">
      <p className="type-eyebrow">UNTUK SIAPA? · WHO ARE YOU BUYING FOR?</p>

      {members.map((m, i) => (
        <div
          key={m.id}
          className="flex flex-col gap-3 rounded-xl border border-line bg-card p-4"
        >
          <div className="flex items-center gap-2">
            <input
              value={m.name}
              onChange={(e) => rename(m.id, e.target.value)}
              className="flex-1 rounded-lg bg-surface-2 px-3 py-2 text-sm text-ink outline-none"
              aria-label="Member name"
            />
            {i > 0 && (
              <button
                type="button"
                onClick={() => removeMember(m.id)}
                className="text-sm text-ink-70 hover:text-ink"
                aria-label={`Remove ${m.name}`}
              >
                Buang · Remove
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {PERSONAL_CONDITIONS.map((o) => {
              const active = m.conditions.includes(o.value);
              return (
                <button
                  key={o.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggle(m.id, o.value)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-ink text-paper"
                      : "bg-surface-2 text-ink-70 hover:bg-line",
                  )}
                >
                  {o.bm} · {o.en}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addMember}
        className="self-start rounded-full border border-line bg-surface-2 px-4 py-2 text-sm font-medium text-ink-70 hover:bg-line"
      >
        + Tambah ahli · Add member
      </button>
    </section>
  );
}

export default MembersPanel;
