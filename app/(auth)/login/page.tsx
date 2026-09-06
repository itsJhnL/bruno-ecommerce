import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { getUserId } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your BRUNO account.",
  robots: { index: false, follow: true },
};

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;

  // Somebody already signed in has no business on a sign-in page.
  if (await getUserId()) redirect(next && next.startsWith("/") ? next : "/account");

  return (
    <AuthShell
      eyebrow="Your account"
      title="Welcome back"
      lede="Orders, addresses and saved pieces, in one place."
      footer={
        <p>
          No account yet?{" "}
          <Link
            href={next ? `/register?next=${encodeURIComponent(next)}` : "/register"}
            className="text-accent underline-offset-4 transition-colors hover:text-accent-strong hover:underline"
          >
            Create one
          </Link>
          .
        </p>
      }
    >
      <LoginForm next={next} linkError={error} />
    </AuthShell>
  );
}
