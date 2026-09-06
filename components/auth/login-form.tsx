"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { signIn } from "@/lib/actions/auth";

const LINK_ERRORS: Record<string, string> = {
  "expired-link": "That link has expired. Request a new one below.",
  "missing-code": "That link was incomplete. Request a new one below.",
  "not-configured": "Accounts are not connected on this deployment.",
};

export function LoginForm({ next, linkError }: { next?: string; linkError?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(
    linkError ? (LINK_ERRORS[linkError] ?? linkError) : null
  );
  const [pending, startTransition] = useTransition();

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setErrors({});

    startTransition(async () => {
      const result = await signIn({ email, password, next });
      if (!result.ok) {
        setFormError(result.error);
        if (result.field) setErrors({ [result.field]: result.error });
        return;
      }
      // `refresh()` before navigating so the header re-renders as signed in.
      router.refresh();
      router.push(result.data.next);
    });
  };

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

      <div>
        <Field
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          disabled={pending}
        />
        <div className="mt-2 text-right">
          <Link
            href="/forgot-password"
            className="text-xs text-accent underline-offset-4 transition-colors hover:text-accent-strong hover:underline"
          >
            Forgotten your password?
          </Link>
        </div>
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" strokeWidth={1.75} />}
        Sign in
      </Button>
    </form>
  );
}
