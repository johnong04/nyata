"use client";

/**
 * AuthForm — real Supabase email-OTP sign-in ("The Redacted Label", §1/§9).
 *
 * S9 wired the S7 stub to real auth:
 *  - Email → 6-digit code (signInWithOtp), then code → session (verifyOtp).
 *    Codes (not magic links) survive the in-app browsers TikTok/IG open links in.
 *  - Google: the provider is NOT enabled in Supabase yet, so the button degrades
 *    to a disabled "Akan datang · Coming soon" state — it never hard-errors.
 *
 * Ink chrome only; the primary CTA is ink, never turmeric (turmeric = reveal
 * glow / stamp only, design §5).
 */

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signInWithOtp, verifyOtp } from "@/app/(auth)/actions";
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

// Errors from the server actions → direct bilingual copy (design §9).
const ERROR_COPY: Record<string, string> = {
  "invalid-email": "E-mel tidak sah · Invalid email",
  "invalid-code": "Kod salah atau tamat tempoh · Wrong or expired code",
  "otp-send-failed": "Gagal hantar kod. Cuba lagi · Couldn’t send code, try again",
  "auth-unconfigured": "Mod tetamu — log masuk dimatikan · Guest mode — sign-in off",
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const copy = COPY[mode];
  const configured = isAuthConfigured();
  const next = searchParams.get("next") || "/";

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [stage, setStage] = useState<"email" | "code">("email");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(
    searchParams.get("error") ? "oauth" : null,
  );

  const sendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPending(true);
    const res = await signInWithOtp(email);
    setPending(false);
    if (res.ok) setStage("code");
    else setError(res.error);
  };

  const submitCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPending(true);
    const res = await verifyOtp(email, code);
    setPending(false);
    if (res.ok) router.push(next);
    else setError(res.error);
  };

  return (
    <form
      onSubmit={stage === "email" ? sendCode : submitCode}
      className="mx-auto flex w-full max-w-sm flex-col gap-7"
    >
      <div className="flex flex-col gap-2">
        <p className="type-eyebrow">{copy.eyebrow}</p>
        {/* Classified-dossier signature: a thin redacted rule under the eyebrow. */}
        <span aria-hidden className="h-1 w-16 bg-ink" />
        <h1 className="type-display mt-2 text-[2.25rem] leading-[0.95] text-ink">
          {copy.bm}
        </h1>
        <p className="font-mono text-sm text-ink-40">{copy.en}</p>
      </div>

      {stage === "email" ? (
        <div className="flex flex-col gap-2">
          <label htmlFor="email" className="type-eyebrow text-[0.6875rem]">
            E-MEL · EMAIL
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nama@contoh.com"
            className="h-11 rounded-xl border-line bg-card px-3.5 text-base"
          />
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <label htmlFor="code" className="type-eyebrow text-[0.6875rem]">
            KOD 6-DIGIT · 6-DIGIT CODE
          </label>
          <Input
            id="code"
            name="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="\d{6}"
            maxLength={6}
            required
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="000000"
            className="h-11 rounded-xl border-line bg-card px-3.5 text-center font-mono text-lg tracking-[0.4em]"
          />
          <p className="font-mono text-xs text-ink-40">
            Kod dihantar ke {email} · Code sent to {email}
          </p>
        </div>
      )}

      {error && (
        <p role="alert" className="font-mono text-sm text-[#b3261e]">
          {ERROR_COPY[error] ?? "Ralat · Something went wrong"}
        </p>
      )}

      <Button
        type="submit"
        disabled={pending}
        className="h-11 rounded-xl bg-ink text-paper hover:bg-ink/90 disabled:opacity-60"
      >
        {stage === "email"
          ? pending
            ? "Menghantar… · Sending…"
            : "Hantar kod · Send code"
          : pending
            ? "Mengesahkan… · Verifying…"
            : "Sahkan · Verify"}
      </Button>

      {stage === "code" && (
        <button
          type="button"
          onClick={() => {
            setStage("email");
            setCode("");
            setError(null);
          }}
          className="-mt-4 text-center text-sm text-ink-70 underline underline-offset-2"
        >
          Tukar e-mel · Change email
        </button>
      )}

      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-line" />
        <span className="type-eyebrow text-[0.6875rem]">ATAU · OR</span>
        <span className="h-px flex-1 bg-line" />
      </div>

      {/* Google provider is NOT enabled in Supabase yet → disabled "coming soon"
          so it never hard-errors. Wire-through action exists for when it flips. */}
      <Button
        type="button"
        variant="outline"
        disabled
        title="Google sign-in coming soon"
        className="h-11 gap-2 rounded-xl border-line bg-card text-ink-40 hover:bg-card disabled:opacity-100"
      >
        <GoogleG />
        Google — Akan datang · Coming soon
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
    </form>
  );
}

export default AuthForm;
