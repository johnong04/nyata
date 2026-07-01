import { Suspense } from "react";
import { AuthForm } from "@/components/account/auth-form";

export default function SignupPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md items-center justify-center bg-paper bg-document px-6 py-16">
      <Suspense>
        <AuthForm mode="signup" />
      </Suspense>
    </main>
  );
}
