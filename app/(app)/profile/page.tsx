import { redirect } from "next/navigation";
import { getProfile } from "@/lib/api";
import { signOut } from "@/app/(auth)/actions";
import { isAuthConfigured } from "@/lib/auth-config";
import { createClient } from "@/utils/supabase/server";
import { ScreenHeader } from "@/components/nyata/screen-header";
import { ProfilePanel } from "@/components/account/profile-panel";
import { Button } from "@/components/ui/button";

export default async function ProfilePage() {
  const profile = await getProfile();

  // Only show sign-out to a genuinely signed-in user (not guests).
  let signedIn = false;
  if (isAuthConfigured()) {
    const supabase = await createClient();
    if (supabase) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      signedIn = Boolean(user);
    }
  }

  async function handleSignOut() {
    "use server";
    await signOut();
    redirect("/");
  }

  return (
    <div>
      <ScreenHeader eyebrow="Fail peribadi · Personal file" title="Profil">
        Tetapkan keadaan kesihatan anda supaya putusan lebih peribadi.
      </ScreenHeader>
      <ProfilePanel initial={profile} />
      {signedIn && (
        <form action={handleSignOut} className="mt-10">
          <Button
            type="submit"
            variant="outline"
            className="h-11 w-full rounded-xl border-line bg-card text-ink hover:bg-surface-2"
          >
            Log keluar · Sign out
          </Button>
        </form>
      )}
    </div>
  );
}
