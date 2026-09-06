"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search, User } from "lucide-react";
import { useEffect, useState } from "react";

import { CartButton, CartMenuButton } from "@/components/cart/cart-button";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils/cn";
import type { NavItem } from "@/types";

interface SiteHeaderProps {
  nav: NavItem[];
  announcement: { text: string; ctaLabel: string | null; ctaHref: string | null } | null;
}

export function SiteHeader({ nav, announcement }: SiteHeaderProps) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-accent-solid focus:px-5 focus:py-3 focus:text-sm focus:font-medium focus:text-ink-inverse"
      >
        Skip to content
      </a>

      {announcement && (
        <div className="relative z-40 border-b border-hairline-faint bg-canvas/60 backdrop-blur-md">
          <div className="shell flex min-h-10 flex-wrap items-center justify-center gap-x-3 gap-y-1 py-2 text-center">
            <p className="text-[0.6875rem] uppercase tracking-[0.2em] text-ink-tertiary">
              {announcement.text}
            </p>
            {announcement.ctaHref && announcement.ctaLabel && (
              <Link
                href={announcement.ctaHref}
                className="text-[0.6875rem] uppercase tracking-[0.2em] text-accent underline decoration-accent-quiet underline-offset-4 transition-colors hover:text-accent-strong"
              >
                {announcement.ctaLabel}
              </Link>
            )}
          </div>
        </div>
      )}

      <header
        className={cn(
          "sticky top-0 z-40 transition-[background-color,border-color] duration-300",
          scrolled
            ? "glass-veil border-b border-hairline-faint"
            : "border-b border-transparent bg-transparent"
        )}
      >
        <div className="shell flex h-[72px] items-center justify-between gap-6 md:h-20">
          <div className="flex items-center gap-3 lg:hidden">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Open menu">
                  <Menu className="size-5" strokeWidth={1.5} />
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <SheetTitle className="eyebrow">Menu</SheetTitle>
                <nav className="mt-2 flex flex-col">
                  {nav.map((item) => (
                    <SheetClose asChild key={item.href}>
                      <Link
                        href={item.href}
                        className="border-b border-hairline-faint py-4 display-m text-ink-primary transition-colors hover:text-accent-strong"
                      >
                        {item.label}
                      </Link>
                    </SheetClose>
                  ))}
                </nav>
                <div className="mt-auto flex flex-col gap-3">
                  <div className="flex items-center justify-between rounded-[12px] border border-hairline px-4 py-2">
                    <span className="text-sm text-ink-secondary">Appearance</span>
                    <ThemeToggle />
                  </div>
                  <SheetClose asChild>
                    <Button variant="outline" className="w-full" asChild>
                      <Link href="/account">
                        <User className="size-4" strokeWidth={1.5} /> Account
                      </Link>
                    </Button>
                  </SheetClose>
                  <SheetClose asChild>
                    <CartMenuButton />
                  </SheetClose>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <Link
            href="/"
            aria-label="BRUNO — home"
            className="flex shrink-0 flex-col items-center lg:items-start"
          >
            <span className="wordmark text-[1.5rem] leading-none text-ink-primary md:text-[1.75rem]">
              BRUNO
            </span>
            <span className="mt-1 hidden text-[0.5625rem] uppercase tracking-[0.42em] text-accent-quiet md:block">
              Premium Apparel
            </span>
          </Link>

          {/* `min-w-0` and `overflow-x-auto` so a long menu scrolls instead of
              pushing the account and bag buttons off the end of the bar. Too
              many navigation rows is a content mistake, but it must not be able
              to hide the controls a shopper needs (Memory.md D-034). */}
          <nav
            aria-label="Primary"
            className="hidden min-w-0 items-center gap-1 overflow-x-auto lg:flex [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {nav.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative rounded-full px-4 py-2 text-[0.8125rem] transition-colors duration-200",
                    active ? "text-accent-strong" : "text-ink-secondary hover:text-ink-primary"
                  )}
                >
                  {item.label}
                  {active && (
                    <span className="absolute inset-x-4 -bottom-0.5 h-px bg-accent-solid/60" aria-hidden />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* `shrink-0` keeps a long menu from pushing these off the bar, but it
              also means they cannot give up the last 2px at 375. A tighter gap
              on small screens reclaims it — measured, not guessed
              (Memory.md D-039). */}
          <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
            <Button variant="ghost" size="icon" asChild aria-label="Search the collection">
              <Link href="/collection">
                <Search className="size-[18px]" strokeWidth={1.5} />
              </Link>
            </Button>
            <ThemeToggle />
            {/* Always a link. Middleware sends a signed-out visitor to /login
                and back again afterwards, so the header needs no session of its
                own — which is what keeps this layout static (Memory.md D-020). */}
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="hidden md:inline-flex"
              aria-label="Your account"
            >
              <Link href="/account">
                <User className="size-[18px]" strokeWidth={1.5} />
              </Link>
            </Button>
            <CartButton />
          </div>
        </div>
      </header>
    </>
  );
}
