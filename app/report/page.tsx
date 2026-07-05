/**
 * /report — right-of-reply + takedown (legal §11.2). A named party can request a
 * correction / reply / removal of an attributed report. No self-authored claims
 * here; this is the redress channel that (with attribution + hedging) carries the
 * grey-area posture. Static page + mailto — no backend needed for v1.
 */
import Link from "next/link";

export default async function ReportPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const { ref } = await searchParams;
  const subject = `Right of reply / report${ref ? ` — ${ref}` : ""}`;
  const mailto = `mailto:report@nyata.app?subject=${encodeURIComponent(subject)}`;

  return (
    <main className="bg-document mx-auto flex max-w-md flex-col gap-6 bg-paper p-4">
      <header className="rounded-none bg-ink px-4 py-3 text-paper">
        <span className="type-eyebrow text-paper/60">HAK MENJAWAB · RIGHT OF REPLY</span>
        <h1 className="font-display text-xl font-bold leading-tight">Report this · Lapor</h1>
      </header>

      <section className="flex flex-col gap-3 text-ink">
        <p>
          Nyata republishes <strong>attributed third-party reports</strong> with a link to each
          source. We do not author brand accusations. If you represent a named party and want a
          correction, a reply published alongside the report, or its removal, contact us and we will
          review it promptly.
        </p>
        <p className="text-ink-70">
          Nyata menyiarkan semula laporan pihak ketiga yang disumberkan. Untuk pembetulan, jawapan,
          atau penarikan, hubungi kami.
        </p>
        {ref && (
          <p className="font-mono text-sm text-ink-40">Reference · Rujukan: {ref}</p>
        )}
        <a
          href={mailto}
          className="rounded-xl bg-ink px-4 py-3 text-center font-mono text-sm text-paper hover:bg-ink/90"
        >
          Email report@nyata.app →
        </a>
        <Link href="/" className="type-mono text-center text-ink-40 hover:text-ink">
          ← Kembali · Home
        </Link>
      </section>
    </main>
  );
}
