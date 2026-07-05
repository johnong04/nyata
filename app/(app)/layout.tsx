import { BottomNav } from "@/components/nyata/bottom-nav";
import { PageTransition } from "@/components/nyata/page-transition";

/**
 * App shell — mobile-first phone column on paper, with the fixed bottom nav.
 * Bottom padding reserves room for the nav + safe area.
 */
export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative mx-auto min-h-dvh w-full max-w-md bg-paper">
      <main className="px-5 pt-8 pb-32 bg-document">
        <PageTransition>{children}</PageTransition>
      </main>
      <BottomNav />
    </div>
  );
}
