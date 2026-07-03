"use client";

/**
 * Bottom tab bar — 5 tabs, Scan raised-center (design-system §6).
 *
 * NOTE (S1 deviation, flagged in report): the stock @aceternity/floating-dock
 * is a hover-magnify desktop dock + a collapse-to-open mobile button — neither
 * matches an always-visible fixed 5-tab bar with active-route state and a
 * raised center. So this is a bespoke themed bar. floating-dock stays installed
 * for other surfaces. Ink/paper tokens; mono labels; active tab = ink.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { House, Rss, ScanLine, History, User } from "lucide-react";
import { DUR, EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";

type Tab = {
  href: string;
  label: string;
  icon: typeof House;
};

const TABS: Tab[] = [
  { href: "/", label: "Utama", icon: House },
  { href: "/feed", label: "Suapan", icon: Rss },
  { href: "/scan", label: "Imbas", icon: ScanLine },
  { href: "/history", label: "Sejarah", icon: History },
  { href: "/profile", label: "Profil", icon: User },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function BottomNav() {
  const pathname = usePathname();
  const reduce = useReducedMotion();

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-md"
    >
      <div className="relative mx-3 mb-[max(0.75rem,env(safe-area-inset-bottom))] flex items-end justify-between rounded-2xl border border-line bg-card/95 px-2 py-2 shadow-[0_1px_2px_rgba(23,20,15,.05),0_8px_24px_rgba(23,20,15,.10)] backdrop-blur">
        {TABS.map((tab) => {
          const active = isActive(pathname, tab.href);
          const Icon = tab.icon;

          // Scan = raised center, ink-filled.
          if (tab.href === "/scan") {
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-label={tab.label}
                className="relative -mt-6 flex w-1/5 flex-col items-center gap-1"
              >
                <motion.span
                  whileTap={reduce ? undefined : { scale: 0.9 }}
                  transition={{ duration: DUR.micro, ease: EASE.out }}
                  className={cn(
                    "flex h-14 w-14 items-center justify-center rounded-full bg-ink text-paper shadow-[0_6px_20px_rgba(23,20,15,.35)]",
                    active && "ring-2 ring-reveal ring-offset-2 ring-offset-card"
                  )}
                >
                  <Icon className="h-6 w-6" strokeWidth={2.25} />
                </motion.span>
                <span className="type-eyebrow text-[0.6rem] text-ink">
                  {tab.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-label={tab.label}
              aria-current={active ? "page" : undefined}
              className="flex w-1/5 flex-col items-center gap-1 py-1"
            >
              <motion.span
                whileTap={reduce ? undefined : { scale: 0.88 }}
                transition={{ duration: DUR.micro, ease: EASE.out }}
                className="flex flex-col items-center gap-1"
              >
                <Icon
                  className={cn(
                    "h-5 w-5 transition-colors",
                    active ? "text-ink" : "text-ink-40"
                  )}
                  strokeWidth={active ? 2.25 : 1.75}
                />
                <span
                  className={cn(
                    "type-eyebrow text-[0.6rem] transition-colors",
                    active ? "text-ink" : "text-ink-40"
                  )}
                >
                  {tab.label}
                </span>
              </motion.span>
              {/* Turmeric active indicator — slides between tabs (shared-layout).
                  Reduced-motion → it jumps (transition duration 0), no slide. */}
              <span className="relative h-1 w-1">
                {active && (
                  <motion.span
                    layoutId="nav-active"
                    transition={
                      reduce
                        ? { duration: 0 }
                        : { type: "spring", bounce: 0.2, duration: 0.5 }
                    }
                    className="absolute inset-0 rounded-full bg-reveal"
                  />
                )}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default BottomNav;
