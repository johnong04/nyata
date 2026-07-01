import type { Profile } from "@/lib/types";

/** Mutable in-memory profile for the mock seam (S13 swaps to Supabase). */
export const MOCK_PROFILE: Profile = {
  conditions: ["diabetes"],
  is_premium: false,
};
