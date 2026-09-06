"use client";

import { Check, Loader2 } from "lucide-react";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { updateProfile } from "@/lib/actions/account";

export function ProfileForm({
  initial,
}: {
  initial: { fullName: string; email: string; phone: string; acceptsMarketing: boolean };
}) {
  const [fullName, setFullName] = useState(initial.fullName);
  const [phone, setPhone] = useState(initial.phone);
  const [acceptsMarketing, setAcceptsMarketing] = useState(initial.acceptsMarketing);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setErrors({});
    setSaved(false);

    startTransition(async () => {
      const result = await updateProfile({ fullName, phone, acceptsMarketing });
      if (!result.ok) {
        setFormError(result.error);
        if (result.field) setErrors({ [result.field]: result.error });
        return;
      }
      setSaved(true);
    });
  };

  return (
    <form onSubmit={submit} noValidate className="max-w-lg space-y-5">
      <Field
        label="Name"
        name="fullName"
        autoComplete="name"
        required
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        error={errors.fullName}
        disabled={pending}
      />

      {/* Email is the account identifier and changing it means re-verifying an
          address, which is a different flow from editing a name. Showing it
          read-only is honest; showing it in an editable box that silently
          ignores the change would not be. */}
      <Field
        label="Email"
        name="email"
        type="email"
        value={initial.email}
        readOnly
        disabled
        hint="Your email is your sign-in. Write to us to change it."
      />

      <Field
        label="Telephone"
        name="phone"
        type="tel"
        autoComplete="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        error={errors.phone}
        optional
        hint="Only used if a courier needs you."
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

      {formError && (
        <p role="alert" className="text-sm text-signal-danger">
          {formError}
        </p>
      )}

      <div className="flex items-center gap-4 pt-2">
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" strokeWidth={1.75} />}
          Save changes
        </Button>
        {saved && (
          <span role="status" className="flex items-center gap-1.5 text-sm text-signal-success">
            <Check className="size-4" strokeWidth={2} aria-hidden />
            Saved
          </span>
        )}
      </div>
    </form>
  );
}
