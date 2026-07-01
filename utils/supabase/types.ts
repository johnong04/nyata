/**
 * Ergonomic row aliases over the generated `Database` type. The S13 seam
 * (`lib/api.ts`) consumes these. The DB is the source of truth for shapes;
 * `lib/types.ts` holds the app-facing domain types the UI renders — S13
 * reconciles the two (e.g. maps `verdicts.verdict` → `VerdictBand`).
 */
import type { Database } from "./database.types";

type T = Database["public"]["Tables"];

export type Profile = T["profiles"]["Row"];
export type Product = T["products"]["Row"];
export type Verdict = T["verdicts"]["Row"];
export type Recall = T["recalls"]["Row"];
export type Scan = T["scans"]["Row"];
export type FeedItem = Database["public"]["Views"]["feed_items"]["Row"];
