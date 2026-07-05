import { Suspense } from "react";
import { AuthForm } from "@/components/account/auth-form";

export default function SignupPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 items-center justify-center px-6 py-16">
      <Suspense>
        <AuthForm mode="signup" />
      </Suspense>
    </main>
  );
}
