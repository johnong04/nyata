/**
 * Single source of truth for "is auth wired up?".
 *
 * Guest-mode gate (design decision, plan §Design): the app must run with NO auth
 * env set so the filmed demo never breaks. Every auth entry point — middleware,
 * server actions, the api seam — short-circuits on `!isAuthConfigured()`:
 * middleware passes through, actions return `auth-unconfigured`, scan logging
 * silently no-ops. Auth is "configured" only when BOTH the project URL and the
 * client publishable key are present (the secret key is server-side and not
 * required for the cookie-session auth path).
 */
export function isAuthConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}
