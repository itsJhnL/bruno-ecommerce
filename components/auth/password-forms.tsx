"use client";

import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, MailCheck } from "lucide-react";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { requestPasswordReset, updatePassword } from "@/lib/actions/auth";

/**
 * Requesting a reset link.
 *
 * The confirmation is identical whether or not the address has an account.
 * Saying "no account found" would turn this form into a way to test which
 * email addresses are registered here.
 */
export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setErrors({});

    startTransition(async () => {
      const result = await requestPasswordReset({ email });
      if (!result.ok) {
        setFormError(result.error);
        if (result.field) setErrors({ [result.field]: result.error });
        return;
      }
      setSent(true);
    });
  };

  if (sent) {
    return (
      <div
        role="status"
        className="rounded-card border border-accent-line/40 bg-accent-wash/25 p-6 text-center"
      >
        <MailCheck className="mx-auto size-6 text-accent" strokeWidth={1.5} />
        <p className="display-s mt-4 text-ink-primary">Check your email</p>
        <p className="mt-3 text-sm leading-relaxed text-ink-secondary">
          If <span className="text-ink-primary">{email}</span> has an account, a reset link
          is on its way. It expires in an hour.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      {formError && (
        <p role="alert" className="text-sm text-signal-danger">
          {formError}
        </p>
      )}

      <Field
        label="Email"
        name="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        autoFocus
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={errors.email}
        disabled={pending}
      />

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" strokeWidth={1.75} />}
        Send a reset link
      </Button>
    </form>
  );
}

/** Setting a new password, once the recovery link has established a session. */
export function ResetPasswordForm({ hasSession }: { hasSession: boolean }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!hasSession) {
    return (
      <div className="rounded-card border border-signal-warning/30 bg-signal-warning/10 p-6">
        <AlertTriangle className="size-5 text-signal-warning" strokeWidth={1.5} />
        <p className="mt-3 text-sm leading-relaxed text-ink-secondary">
          This page only works from a reset link, and that link has expired or was already
          used. Request a new one and try again.
        </p>
        <Button variant="outline" className="mt-5 w-full" onClick={() => router.push("/forgot-password")}>
          Request a new link
        </Button>
      </div>
    );
  }

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setErrors({});

    startTransition(async () => {
      const result = await updatePassword({ password, confirmPassword });
      if (!result.ok) {
        setFormError(result.error);
        if (result.field) setErrors({ [result.field]: result.error });
        return;
      }
      router.refresh();
      router.push("/account");
    });
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      {formError && (
        <p role="alert" className="text-sm text-signal-danger">
          {formError}
        </p>
      )}

      <Field
        label="New password"
        name="password"
        type="password"
        autoComplete="new-password"
        autoFocus
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={errors.password}
        hint="At least 12 characters."
        disabled={pending}
      />

      <Field
        label="Confirm new password"
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        required
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        error={errors.confirmPassword}
        disabled={pending}
      />

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" strokeWidth={1.75} />}
        Set new password
      </Button>
    </form>
  );
}
