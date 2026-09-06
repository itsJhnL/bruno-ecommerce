"use client";

import { Loader2 } from "lucide-react";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { applyForMembership } from "@/lib/actions/marketing";
import { cn } from "@/lib/utils/cn";

/**
 * Membership applications, written to `membership_applications` and raised as
 * a staff notification. Approval is a Phase 4 job in the admin CMS; until then
 * an application is recorded and answered by hand, which is what the copy says.
 */
export function MembershipForm({ className }: { className?: string }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await applyForMembership({ fullName, email, message });
      if (result.ok) {
        setDone(true);
        setFullName("");
        setEmail("");
        setMessage("");
      } else {
        setError(result.error);
      }
    });
  };

  if (done) {
    return (
      <div
        className={cn("rounded-card border border-accent-line/40 bg-accent-wash/25 p-6", className)}
        role="status"
      >
        <p className="display-s text-ink-primary">Your request is with us</p>
        <p className="mt-3 text-sm leading-relaxed text-ink-secondary">
          Someone from the atelier will write to you within two working days. Invitations are
          reviewed by a person, not a queue.
        </p>
      </div>
    );
  }

  return (
    <form className={cn("space-y-5", className)} onSubmit={submit} noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="member-name" className="eyebrow mb-2.5 block text-accent-quiet">
            Name
          </label>
          <Input
            id="member-name"
            name="fullName"
            autoComplete="name"
            required
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            disabled={pending}
          />
        </div>
        <div>
          <label htmlFor="member-email" className="eyebrow mb-2.5 block text-accent-quiet">
            Email
          </label>
          <Input
            id="member-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={pending}
          />
        </div>
      </div>

      <div>
        <label htmlFor="member-message" className="eyebrow mb-2.5 block text-accent-quiet">
          What are you looking for?
        </label>
        <textarea
          id="member-message"
          name="message"
          rows={4}
          maxLength={1200}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          disabled={pending}
          className="w-full rounded-[12px] border border-hairline bg-tint px-4 py-3 text-sm text-ink-primary backdrop-blur-md transition-colors placeholder:text-ink-muted hover:border-hairline-strong focus:border-accent-line/50 focus:outline-2 focus:outline-offset-2 focus:outline-accent-line"
          placeholder="A winter coat that will last a decade, and a tailor who will listen."
        />
      </div>

      <Button type="submit" size="lg" disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" strokeWidth={1.75} />}
        Request an invitation
      </Button>

      {error && (
        <p role="alert" className="text-xs leading-relaxed text-signal-danger">
          {error}
        </p>
      )}
    </form>
  );
}
