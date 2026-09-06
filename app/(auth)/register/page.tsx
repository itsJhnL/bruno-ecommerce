import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";
import { getUserId } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Create an account",
  description: "Create a BRUNO account to track orders and save pieces.",
  robots: { index: false, follow: true },
};

export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  if (await getUserId()) redirect("/account");

  return (
    <AuthShell
      eyebrow="Your account"
      title="Create an account"
      lede="Track orders, save addresses, and keep a list of what you are waiting for."
      footer={
        <p>
          Already have one?{" "}
          <Link
            href="/login"
            className="text-accent underline-offset-4 transition-colors hover:text-accent-strong hover:underline"
          >
            Sign in
          </Link>
          .
        </p>
      }
    >
      <RegisterForm />
    </AuthShell>
  );
}
