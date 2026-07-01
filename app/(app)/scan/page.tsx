import type { Metadata, Viewport } from "next";
import { ScanClient } from "./scan-client";

export const metadata: Metadata = {
  title: "Imbas · Scan — Nyata",
  description: "Halakan kamera ke barkod produk untuk putusan segera.",
};

// Full-height camera stage: lock the viewport so the video fills without bounce.
export const viewport: Viewport = {
  themeColor: "#17140f",
  maximumScale: 1,
};

export default function ScanPage() {
  return <ScanClient />;
}
