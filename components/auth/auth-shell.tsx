import Link from "next/link";

/**
 * The frame every auth page sits in.
 *
 * Deliberately outside the storefront layout: no navigation, no cart, no
 * footer. A sign-in page with a full shop header invites the visitor to wander
 * off mid-task, and every extra link is a way to not finish.
 */
export function AuthShell({
  eyebrow,
  title,
  lede,
  children,
  footer,
}: {
  eyebrow: string;
  title: string;
  lede?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="shell flex items-center justify-between py-8">
        <Link
          href="/"
          aria-label="BRUNO — home"
          className="rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-line"
        >
          <span className="wordmark text-[1.375rem] leading-none text-ink-primary">BRUNO</span>
        </Link>
        <Link
          href="/collection"
          className="text-[0.8125rem] text-ink-tertiary transition-colors hover:text-ink-primary"
        >
          Continue shopping
        </Link>
      </header>

      <main id="main" className="shell flex flex-1 items-center justify-center py-10">
        <div className="w-full max-w-[420px]">
          <p className="eyebrow text-accent-quiet">{eyebrow}</p>
          <h1 className="display-l mt-4 text-ink-primary">{title}</h1>
          {lede && <p className="mt-4 text-sm leading-relaxed text-ink-secondary">{lede}</p>}

          <div className="mt-9">{children}</div>

          {footer && (
            <div className="mt-8 border-t border-hairline-faint pt-6 text-sm text-ink-tertiary">
              {footer}
            </div>
          )}
        </div>
      </main>

      <footer className="shell py-8 text-center text-xs text-ink-muted">
        Made in small numbers, finished by hand.
      </footer>
    </div>
  );
}
