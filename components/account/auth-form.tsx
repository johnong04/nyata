"use client";

/**
 * AuthForm — Google-first sign-in ("The Redacted Label", §1/§9).
 *
 * Run-2 S1: the email-OTP block was removed — Google OAuth (provider enabled,
 * commit f6ea3b2) is the primary and only sign-in path. Guest mode (no auth env)
 * disables the button and shows a guest notice, so the filmed demo never
 * hard-errors. Ink chrome only; turmeric is reserved for reveal/stamp (design §5).
 */

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { signInWithGoogle } from "@/app/(auth)/actions";
import { isAuthConfigured } from "@/lib/auth-config";

const COPY = {
  login: {
    eyebrow: "AKAUN · ACCOUNT",
    bm: "Masuk semula",
    en: "Welcome back",
    swapText: "Belum ada akaun?",
    swapCta: "Daftar · Sign up",
    swapHref: "/signup",
  },
  signup: {
    eyebrow: "DAFTAR · SIGN UP",
    bm: "Buka fail anda",
    en: "Open your file",
    swapText: "Sudah ada akaun?",
    swapCta: "Masuk · Log in",
    swapHref: "/login",
  },
} as const;

const ERROR_COPY: Record<string, string> = {
  "auth-unconfigured": "Mod tetamu — log masuk dimatikan · Guest mode — sign-in off",
  "oauth-unavailable": "Google tidak tersedia · Google unavailable",
  oauth: "Log masuk Google gagal · Google sign-in failed",
};

function GoogleG() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.57c2.08-1.92 3.27-4.74 3.27-8.09Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.76c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.4 14.97.4 12 .4A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 4.75 12 4.75Z"
      />
    </svg>
  );
}

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const searchParams = useSearchParams();
  const copy = COPY[mode];
  const configured = isAuthConfigured();

  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(
    searchParams.get("error") ? "oauth" : null,
  );

  const handleGoogle = async () => {
    setError(null);
    setPending(true);
    const res = await signInWithGoogle();
    if (res.ok) {
      window.location.href = res.url; // hand off to Google (PKCE → /auth/callback)
      return;
    }
    setPending(false);
    setError(res.error);
  };

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-7">
      <div className="flex flex-col gap-2">
        <p className="type-eyebrow">{copy.eyebrow}</p>
        {/* Classified-dossier signature: a thin redacted rule under the eyebrow. */}
        <span aria-hidden className="h-1 w-16 bg-ink" />
        <h1 className="type-display mt-2 text-[2.25rem] leading-[0.95] text-ink">
          {copy.bm}
        </h1>
        <p className="font-mono text-sm text-ink-40">{copy.en}</p>
      </div>

      {error && (
        <p role="alert" className="font-mono text-sm text-[#b3261e]">
          {ERROR_COPY[error] ?? "Ralat · Something went wrong"}
        </p>
      )}

      {/* Google OAuth (PKCE → /auth/callback). Guest mode (no env) disables it. */}
      <Button
        type="button"
        variant="outline"
        onClick={handleGoogle}
        disabled={pending || !configured}
        className="h-12 gap-2 rounded-xl border-line bg-card text-ink hover:bg-surface-2 disabled:opacity-60"
      >
        <GoogleG />
        {pending
          ? "Menyambung… · Connecting…"
          : "Teruskan dengan Google · Continue with Google"}
      </Button>

      {!configured && (
        <p className="text-center font-mono text-xs text-ink-40">
          Mod tetamu aktif · Guest mode active
        </p>
      )}

      <p className="text-center text-sm text-ink-70">
        {copy.swapText}{" "}
        <Link
          href={copy.swapHref}
          className="font-medium text-ink underline underline-offset-2"
        >
          {copy.swapCta}
        </Link>
      </p>
    </div>
  );
}

export default AuthForm;
