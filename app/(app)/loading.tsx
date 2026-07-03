/**
 * Route-level loading fallback for the (app) shell. Turns every tab transition
 * (notably the feed→home recalls fetch) into an instant skeleton paint instead
 * of a blank stall. Static, no animation dependency beyond Tailwind's pulse.
 */
export default function AppLoading() {
  return (
    <div className="space-y-4 pt-2" aria-hidden>
      <div className="h-7 w-40 animate-pulse rounded bg-surface-2" />
      <div className="h-44 w-full animate-pulse rounded-2xl bg-surface-2" />
      <div className="h-24 w-full animate-pulse rounded-2xl bg-surface-2" />
      <div className="h-24 w-full animate-pulse rounded-2xl bg-surface-2" />
    </div>
  );
}
