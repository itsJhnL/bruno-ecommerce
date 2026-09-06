import type { Metadata } from "next";

import { AccountNav } from "@/components/account/account-nav";
import { requireAccountUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

// Reads the caller's session, so it can never be prerendered.
export const dynamic = "force-dynamic";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  // Middleware already redirects anonymous requests. This is the second layer:
  // a middleware bug must not become a page that renders somebody's orders.
  const user = await requireAccountUser();

  return (
    <div className="shell pb-20 pt-10 md:pt-14">
      <header className="max-w-3xl">
        <p className="eyebrow">Your account</p>
        <h1 className="display-l mt-5 text-ink-primary">
          {user.firstName ?? user.fullName ?? "Welcome"}
        </h1>
        <p className="mt-3 text-sm text-ink-tertiary">{user.email}</p>
      </header>

      <div className="mt-12 grid gap-10 lg:grid-cols-[220px_1fr] lg:gap-16">
        <AccountNav />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
