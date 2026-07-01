/**
 * OAuth / PKCE callback. Google (and any future provider) redirects here with a
 * `code`; we exchange it for a cookie session, ensure a profile, then bounce to
 * `next` (default `/`). SERVER route handler — the secret key is never involved
 * (cookie auth uses the publishable key).
 *
 * Guest mode / misconfig / bad code all fall through to `/login?error=oauth`
 * rather than throwing, so a broken provider never dead-ends the demo.
 */

import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { ensureProfile } from "@/lib/profile-provision";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        await ensureProfile();
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  return NextResponse.redirect(`${origin}/login?error=oauth`);
}
