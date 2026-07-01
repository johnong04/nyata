import { getProfile } from "@/lib/api";
import { ScreenHeader } from "@/components/nyata/screen-header";
import { ProfilePanel } from "@/components/account/profile-panel";

export default async function ProfilePage() {
  const profile = await getProfile();
  return (
    <div>
      <ScreenHeader eyebrow="Fail peribadi · Personal file" title="Profil">
        Tetapkan keadaan kesihatan anda supaya putusan lebih peribadi.
      </ScreenHeader>
      <ProfilePanel initial={profile} />
    </div>
  );
}
