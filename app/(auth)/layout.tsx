import { BackBar } from "@/components/nyata/back-bar";

/**
 * Auth shell — the (auth) group sits OUTSIDE the (app) BottomNav, so restore a
 * back affordance here (Run-2 S1 defect iv). Full-height paper with the document
 * texture; the page centers its card in the remaining space.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-paper bg-document">
      <BackBar fallback="/" />
      {children}
    </div>
  );
}
