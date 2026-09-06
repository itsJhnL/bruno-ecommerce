"use client";

import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, MailCheck } from "lucide-react";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { register } from "@/lib/actions/auth";

export function RegisterForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptsMarketing, setAcceptsMarketing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [awaitingEmail, setAwaitingEmail] = useState(false);
  const [pending, startTransition] = useTransition();

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setErrors({});

    startTransition(async () => {
      const result = await register({
        fullName,
        email,
        password,
        confirmPassword,
        acceptsMarketing,
      });

      if (!result.ok) {
        setFormError(result.error);
        if (result.field) setErrors({ [result.field]: result.error });
        return;
      }

      // Whether a session exists depends on the project's confirmation setting,
      // so the outcome is read from the server rather than assumed.
      if (result.data.needsEmailConfirmation) {
        setAwaitingEmail(true);
        return;
      }

      router.refresh();
      router.push("/account");
    });
  };

  if (awaitingEmail) {
    return (
      <div
        role="status"
        className="rounded-card border border-accent-line/40 bg-accent-wash/25 p-6 text-center"
      >
        <MailCheck className="mx-auto size-6 text-accent" strokeWidth={1.5} />
        <p className="display-s mt-4 text-ink-primary">Check your email</p>
        <p className="mt-3 text-sm leading-relaxed text-ink-secondary">
          We have sent a confirmation link to{" "}
          <span className="text-ink-primary">{email}</span>. Open it and your account is
          ready.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      {formError && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-[12px] border border-signal-danger/30 bg-signal-danger/10 px-4 py-3 text-sm leading-relaxed text-signal-danger"
        >
          <AlertTriangle className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} />
          {formError}
        </p>
      )}

      <Field
        label="Name"
        name="fullName"
        autoComplete="name"
        autoFocus
        required
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        error={errors.fullName}
        disabled={pending}
      />

      <Field
        label="Email"
        name="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={errors.email}
        disabled={pending}
      />

      <Field
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={errors.password}
        hint="At least 12 characters. A short phrase is stronger than a scramble."
        disabled={pending}
      />

      <Field
        label="Confirm password"
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        required
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        error={errors.confirmPassword}
        disabled={pending}
      />

      <label className="flex cursor-pointer items-start gap-3 text-sm text-ink-secondary">
        <input
          type="checkbox"
          checked={acceptsMarketing}
          onChange={(e) => setAcceptsMarketing(e.target.checked)}
          disabled={pending}
          className="mt-1 size-4 accent-(--color-accent-solid)"
        />
        <span className="leading-relaxed">
          Send me the letter — new work and private views, roughly monthly.
        </span>
      </label>

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" strokeWidth={1.75} />}
        Create account
      </Button>
    </form>
  );
}
