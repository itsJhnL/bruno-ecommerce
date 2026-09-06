import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils/cn";

interface PaginationProps {
  page: number;
  pageCount: number;
  /** Current search params minus `page`, so links preserve active filters. */
  baseParams: string;
  pathname: string;
}

export function Pagination({ page, pageCount, baseParams, pathname }: PaginationProps) {
  if (pageCount <= 1) return null;

  const href = (n: number) => {
    const params = new URLSearchParams(baseParams);
    if (n > 1) params.set("page", String(n));
    else params.delete("page");
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  };

  // Show first, last, current and its neighbours. Ellipses for the rest.
  const pages = new Set<number>([1, pageCount, page - 1, page, page + 1]);
  const visible = [...pages].filter((n) => n >= 1 && n <= pageCount).sort((a, b) => a - b);

  return (
    <nav aria-label="Pagination" className="mt-16 flex items-center justify-center gap-1.5">
      <PageLink href={href(page - 1)} disabled={page <= 1} label="Previous page">
        <ChevronLeft className="size-4" strokeWidth={1.5} aria-hidden />
      </PageLink>

      {visible.map((n, i) => {
        const previous = visible[i - 1];
        const gap = previous !== undefined && n - previous > 1;
        return (
          <span key={n} className="flex items-center gap-1.5">
            {gap && <span className="px-1 text-ink-muted" aria-hidden>…</span>}
            <Link
              href={href(n)}
              aria-current={n === page ? "page" : undefined}
              className={cn(
                "tnum grid size-10 place-items-center rounded-full border text-[0.8125rem] transition-colors",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-line",
                n === page
                  ? "border-accent-line/60 bg-accent-wash/40 text-accent-strong"
                  : "border-hairline text-ink-secondary hover:border-hairline-strong hover:text-ink-primary"
              )}
            >
              {n}
            </Link>
          </span>
        );
      })}

      <PageLink href={href(page + 1)} disabled={page >= pageCount} label="Next page">
        <ChevronRight className="size-4" strokeWidth={1.5} aria-hidden />
      </PageLink>
    </nav>
  );
}

function PageLink({
  href,
  disabled,
  label,
  children,
}: {
  href: string;
  disabled: boolean;
  label: string;
  children: React.ReactNode;
}) {
  if (disabled) {
    return (
      <span
        aria-disabled
        aria-label={label}
        className="grid size-10 cursor-not-allowed place-items-center rounded-full border border-hairline-faint text-ink-muted"
      >
        {children}
      </span>
    );
  }

  return (
    <Link
      href={href}
      aria-label={label}
      className="grid size-10 place-items-center rounded-full border border-hairline text-ink-secondary transition-colors hover:border-hairline-strong hover:text-ink-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-line"
    >
      {children}
    </Link>
  );
}
