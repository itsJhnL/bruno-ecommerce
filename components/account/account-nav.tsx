"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, LogOut, MapPin, Package, User } from "lucide-react";
import { useTransition } from "react";

import { signOut } from "@/lib/actions/auth";
import { cn } from "@/lib/utils/cn";

const LINKS = [
  { href: "/account", label: "Overview", icon: User, exact: true },
  { href: "/account/orders", label: "Orders", icon: Package, exact: false },
  { href: "/account/addresses", label: "Addresses", icon: MapPin, exact: false },
  { href: "/account/wishlist", label: "Saved", icon: Heart, exact: false },
  { href: "/account/profile", label: "Details", icon: User, exact: false },
] as const;

export function AccountNav() {
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  return (
    <nav aria-label="Your account" className="lg:sticky lg:top-28 lg:self-start">
      <ul className="flex gap-1 overflow-x-auto pb-2 lg:flex-col lg:gap-0.5 lg:overflow-visible lg:pb-0">
        {LINKS.map((link) => {
          const active = link.exact ? pathname === link.href : pathname.startsWith(link.href);
          return (
            <li key={link.href} className="shrink-0">
              <Link
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-[12px] px-4 py-3 text-sm transition-colors duration-200",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-line",
                  active
                    ? "bg-accent-wash/40 text-accent-strong"
                    : "text-ink-secondary hover:bg-tint hover:text-ink-primary"
                )}
              >
                <link.icon className="size-4 shrink-0" strokeWidth={1.5} aria-hidden />
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>

      <form
        className="mt-4 border-t border-hairline-faint pt-4"
        action={() => startTransition(() => void signOut())}
      >
        <button
          type="submit"
          disabled={pending}
          className="flex w-full items-center gap-3 rounded-[12px] px-4 py-3 text-sm text-ink-tertiary transition-colors hover:bg-tint hover:text-signal-danger focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-line disabled:opacity-50"
        >
          <LogOut className="size-4 shrink-0" strokeWidth={1.5} aria-hidden />
          {pending ? "Signing out…" : "Sign out"}
        </button>
      </form>
    </nav>
  );
}
