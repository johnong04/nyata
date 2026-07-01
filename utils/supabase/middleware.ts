import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isAuthConfigured } from "@/lib/auth-config";
import type { Database } from "./database.types";

/** Routes that require a signed-in user. Unauth hits redirect to /login. */
const PROTECTED_PREFIXES = ["/profile", "/history", "/premium"];

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

/**
 * Refreshes the auth session on every request and gates protected routes.
 * Degrades gracefully: in guest mode (no auth env) it passes through untouched,
 * and a failed refresh (Supabase unreachable) leaves routing intact — it never
 * 500s a route, it just treats the caller as logged out.
 */
export async function updateSession(request: NextRequest) {
  // Guest mode: no auth env → never gate, never construct a client with an
  // undefined URL. The filmed demo runs with zero Supabase config.
  if (!isAuthConfigured()) return NextResponse.next({ request });

  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (toSet) => {
          toSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          toSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT: getUser() right after create refreshes the token AND authoritatively
  // validates the session against the auth server (getClaims/getSession alone can be
  // spoofed from cookies). We need the real user to gate protected routes.
  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    // Supabase unreachable — degrade to logged-out, keep routing.
  }

  // Route gate: unauth hit on a protected path → /login?next=<path>.
  if (!user && isProtected(request.nextUrl.pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return response;
}
