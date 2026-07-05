"use server";

/**
 * Auth server actions — real Supabase email-OTP + Google OAuth over the
 * `@supabase/ssr` cookie session. SERVER-ONLY (`"use server"`): the S7 AuthForm
 * calls these; no Supabase call ever runs in the client bundle, no secret key is
 * touched (cookie auth uses the publishable key).
 *
 * Guest mode: when `!isAuthConfigured()` every action returns
 * `{ ok: false, error: "auth-unconfigured" }` WITHOUT throwing, so the filmed
 * demo degrades cleanly instead of 500-ing.
 *
 * OTP flow (DECISION, plan §Design): 6-digit EMAIL CODE, not a magic link —
 * codes survive the in-app browsers TikTok/IG open links in.
 *   1. signInWithOtp(email)  → Supabase mails a 6-digit code (creates user if new)
 *   2. verifyOtp(email,code) → establishes the cookie session, ensures a profile
 */

import { headers } from "next/headers";
import { z } from "zod";
import { createClient } from "@/utils/supabase/server";
import { isAuthConfigured } from "@/lib/auth-config";
import { ensureProfile } from "@/lib/profile-provision";

export type ActionResult = { ok: true } | { ok: false; error: string };
export type OAuthResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

const emailSchema = z.string().trim().email();
const tokenSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, "token must be a 6-digit code");

/** Step 1: request a 6-digit code by email. */
export async function signInWithOtp(email: string): Promise<ActionResult> {
  if (!isAuthConfigured()) return { ok: false, error: "auth-unconfigured" };

  const parsed = emailSchema.safeParse(email);
  if (!parsed.success) return { ok: false, error: "invalid-email" };

  const supabase = await createClient();
  if (!supabase) return { ok: false, error: "auth-unconfigured" };

  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data,
    options: { shouldCreateUser: true },
  });
  if (error) return { ok: false, error: "otp-send-failed" };
  return { ok: true };
}

/** Step 2: verify the code → cookie session + provisioned profile. */
export async function verifyOtp(
  email: string,
  token: string,
): Promise<ActionResult> {
  if (!isAuthConfigured()) return { ok: false, error: "auth-unconfigured" };

  const emailParsed = emailSchema.safeParse(email);
  const tokenParsed = tokenSchema.safeParse(token);
  if (!emailParsed.success) return { ok: false, error: "invalid-email" };
  if (!tokenParsed.success) return { ok: false, error: "invalid-code" };

  const supabase = await createClient();
  if (!supabase) return { ok: false, error: "auth-unconfigured" };

  const { error } = await supabase.auth.verifyOtp({
    email: emailParsed.data,
    token: tokenParsed.data,
    type: "email",
  });
  if (error) return { ok: false, error: "invalid-code" };

  // Trigger provisions the profile row on signup; this is a belt-and-braces check.
  await ensureProfile();
  return { ok: true };
}

/**
 * Google OAuth (PKCE). Returns the provider URL for the client to navigate to.
 * The Google provider IS enabled in this Supabase project (commit f6ea3b2), so
 * the round-trip completes at Google → /auth/callback. Guest mode (no auth env)
 * returns `auth-unconfigured` and the AuthForm disables the button.
 */
export async function signInWithGoogle(): Promise<OAuthResult> {
  if (!isAuthConfigured()) return { ok: false, error: "auth-unconfigured" };

  const supabase = await createClient();
  if (!supabase) return { ok: false, error: "auth-unconfigured" };

  const origin = (await headers()).get("origin") ?? "";
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/auth/callback` },
  });
  if (error || !data?.url) return { ok: false, error: "oauth-unavailable" };
  return { ok: true, url: data.url };
}

/** Sign out — clears the cookie session. */
export async function signOut(): Promise<ActionResult> {
  if (!isAuthConfigured()) return { ok: false, error: "auth-unconfigured" };
  const supabase = await createClient();
  if (!supabase) return { ok: false, error: "auth-unconfigured" };
  await supabase.auth.signOut();
  return { ok: true };
}
