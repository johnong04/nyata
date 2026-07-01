import { getLandingRecalls } from "@/lib/landing-data";
import RecallTicker from "@/components/landing/recall-ticker";
import Hero from "@/components/landing/hero";
import NyataMethod from "@/components/landing/nyata-method";
import LatestRecalls from "@/components/landing/latest-recalls";
import PremiumCta from "@/components/landing/premium-cta";

/**
 * Nyata landing / home — the public front door at `/`.
 * Server component: fetches recalls once (official-source only) and hands them
 * to the ticker + Latest Recalls list. Renders inside the (app) phone shell.
 */
export default async function HomePage() {
  const recalls = await getLandingRecalls();

  return (
    <div className="-mt-8">
      <div className="-mx-5">
        <RecallTicker recalls={recalls} />
      </div>

      <div className="mt-8">
        <Hero />
        <NyataMethod />
        <LatestRecalls recalls={recalls} />
        <PremiumCta />
      </div>
    </div>
  );
}
