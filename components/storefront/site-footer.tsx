import Link from "next/link";

import { NewsletterForm } from "@/components/storefront/newsletter-form";
import { Separator } from "@/components/ui/separator";
import { SITE } from "@/lib/utils/site";
import type { NavItem } from "@/types";

interface SiteFooterProps {
  shop: NavItem[];
  house: NavItem[];
  care: NavItem[];
  legal: NavItem[];
}

export function SiteFooter({ shop, house, care, legal }: SiteFooterProps) {
  const year = new Date().getFullYear();

  const columns: { title: string; items: NavItem[] }[] = [
    { title: "Shop", items: shop },
    { title: "The House", items: house },
    { title: "Client Care", items: care },
  ];

  return (
    <footer className="mt-24 border-t border-hairline-faint pb-12 pt-20 md:mt-32">
      <div className="shell">
        <div className="grid gap-14 lg:grid-cols-[1.4fr_2fr]">
          <div>
            <Link href="/" className="inline-flex flex-col" aria-label="BRUNO — home">
              <span className="wordmark text-[1.625rem] text-ink-primary">BRUNO</span>
              <span className="mt-1.5 text-[0.5625rem] uppercase tracking-[0.42em] text-accent-quiet">
                Premium Apparel
              </span>
            </Link>

            <p className="lede mt-6 max-w-sm text-sm">
              Clothes made in small numbers and finished by hand. Four mills, three workshops,
              roughly forty pieces a year.
            </p>

            <div className="mt-8 max-w-sm">
              <NewsletterForm />
            </div>
          </div>

          <div className="grid gap-10 sm:grid-cols-3">
            {columns.map((column) => (
              <nav key={column.title} aria-label={column.title}>
                <h2 className="eyebrow mb-5 text-accent-quiet">{column.title}</h2>
                <ul className="space-y-3">
                  {column.items.map((item) => (
                    <li key={`${column.title}-${item.href}`}>
                      <Link
                        href={item.href}
                        className="text-sm text-ink-secondary transition-colors hover:text-accent-strong"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <Separator className="my-12" />

        <div className="flex flex-col gap-6 text-xs text-ink-muted md:flex-row md:items-center md:justify-between">
          <div className="space-y-1.5">
            <p>
              © {year} {SITE.name}. {SITE.address}
            </p>
            <p>
              <a href={`mailto:${SITE.email}`} className="transition-colors hover:text-accent">
                {SITE.email}
              </a>
              {" · "}
              <span>{SITE.hours}</span>
            </p>
          </div>

          <ul className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {legal.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="transition-colors hover:text-accent">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
