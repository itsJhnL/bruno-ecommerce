"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Phase 5 sends this to the error reporter. For now, the console is honest.
    console.error(error);
  }, [error]);

  return (
    <div className="grid min-h-[70dvh] place-items-center px-6 py-24">
      <div className="max-w-md text-center">
        <p className="eyebrow">Something went wrong</p>
        <h1 className="display-m mt-6 text-ink-primary">We could not load this page</h1>
        <p className="lede mx-auto mt-5 text-sm">
          The problem is on our side. Trying again usually works; if it does not, our client care
          team will know about it.
        </p>
        {error.digest && (
          <p className="mt-4 text-xs text-ink-muted">Reference {error.digest}</p>
        )}
        <Button onClick={reset} className="mt-10">
          Try again
        </Button>
      </div>
    </div>
  );
}
