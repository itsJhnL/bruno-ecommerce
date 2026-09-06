import Link from "next/link";
import type { Metadata } from "next";

import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/password-forms";

export const metadata: Metadata = {
  title: "Reset your password",
  robots: { index: false, follow: true },
};

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      eyebrow="Your account"
      title="Reset your password"
      lede="Tell us the address on your account and we will send a link."
      footer={
        <p>
          Remembered it?{" "}
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
      <ForgotPasswordForm />
    </AuthShell>
  );
}
