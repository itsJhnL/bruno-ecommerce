"use client";

import { ArrowRight, Check, Loader2 } from "lucide-react";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { subscribeToNewsletter } from "@/lib/actions/marketing";

type State =
  | { kind: "idle" }
  | { kind: "done"; already: boolean }
  | { kind: "error"; message: string };

/**
 * Newsletter signup, writing to `newsletter_subscribers`.
 *
 * An address already on the list is thanked rather than shown a duplicate
 * error — the outcome the visitor wanted is true either way, and the
 * distinction is not worth exposing.
 */
export function NewsletterForm({ source = "footer" }: { source?: string }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>({ kind: "idle" });
  const [pending, startTransition] = useTransition();

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    startTransition(async () => {
      const result = await subscribeToNewsletter({ email, source });
      if (result.ok) {
        setState({ kind: "done", already: result.data.alreadySubscribed });
        setEmail("");
      } else {
        setState({ kind: "error", message: result.error });
      }
    });
  };

  return (
    <form className="space-y-3" onSubmit={submit} noValidate>
      <label htmlFor="newsletter-email" className="eyebrow block text-accent-quiet">
        The Dispatch
      </label>
      <p className="text-sm text-ink-tertiary">
        Release dates, mill notes, and nothing else. Roughly monthly.
      </p>

      <div className="flex gap-2">
        <Input
          id="newsletter-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={pending}
          aria-invalid={state.kind === "error" ? true : undefined}
          aria-describedby="newsletter-status"
        />
        <Button type="submit" size="md" disabled={pending} aria-label="Subscribe">
          {pending ? (
            <Loader2 className="size-4 animate-spin" strokeWidth={1.75} />
          ) : state.kind === "done" ? (
            <Check className="size-4" strokeWidth={1.75} />
          ) : (
            <ArrowRight className="size-4" strokeWidth={1.5} />
          )}
        </Button>
      </div>

      <p
        id="newsletter-status"
        role="status"
        className={
          state.kind === "error"
            ? "text-xs leading-relaxed text-signal-danger"
            : "text-xs leading-relaxed text-ink-muted"
        }
      >
        {state.kind === "done"
          ? state.already
            ? "You are already on the list."
            : "Thank you — you are on the list."
          : state.kind === "error"
            ? state.message
            : "One email a month. Unsubscribe in a click."}
      </p>
    </form>
  );
}
