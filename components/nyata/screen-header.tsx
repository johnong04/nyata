/**
 * ScreenHeader — on-brand placeholder header for shell screens.
 * Mono eyebrow (classified-document idiom) over a display heading.
 */

export function ScreenHeader({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="mb-6">
      <p className="type-eyebrow">{eyebrow}</p>
      <h1 className="type-display mt-2 text-ink">{title}</h1>
      {children ? (
        <p className="mt-3 max-w-prose text-ink-70">{children}</p>
      ) : null}
    </header>
  );
}

export default ScreenHeader;
