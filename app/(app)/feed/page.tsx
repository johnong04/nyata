import { getFeed, getFeedRecalls } from "@/lib/api";
import { FeedHeader } from "@/components/nyata/feed-header";
import { FeedList } from "@/components/nyata/feed-list";

/**
 * Feed route (S6) — the "Hidden Ingredients" community front-door. Server
 * component fetches the initial feed + official recalls, then hands them to the
 * FeedList client island (holds filter state, re-queries getFeed on tab switch).
 * All data is official-source / verdict-derived; recall cards fail closed and
 * always link their official source (design-system §9, specs §6).
 */
export default async function FeedPage() {
  const [items, recalls] = await Promise.all([
    getFeed("worst"),
    getFeedRecalls(),
  ]);

  return (
    <div>
      <FeedHeader />
      <FeedList initialItems={items} initialRecalls={recalls} />
    </div>
  );
}
