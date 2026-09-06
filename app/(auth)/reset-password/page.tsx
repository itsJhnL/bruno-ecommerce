import type { Metadata } from "next";

import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/password-forms";
import { getUserId } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Set a new password",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage() {
  // The recovery link goes through /auth/callback, which exchanges the code
  // for a session. No session here means the link expired or was reused.
  const hasSession = Boolean(await getUserId());

  return (
    <AuthShell
      eyebrow="Your account"
      title="Set a new password"
      lede={hasSession ? "Choose something long. Length beats punctuation." : undefined}
    >
      <ResetPasswordForm hasSession={hasSession} />
    </AuthShell>
  );
}
