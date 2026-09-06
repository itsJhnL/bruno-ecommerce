import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * Where every emailed link lands: confirmation, password recovery, magic link.
 *
 * Supabase sends a one-time `code` which has to be exchanged for a session
 * server-side. Doing it in a route handler rather than on a page means the
 * session cookie is set before anything renders, so the destination page never
 * flickers through a signed-out state.
 */

export const dynamic = "force-dynamic";

/** Only ever redirect to a path on this site — see `safeNext` in lib/actions/auth.ts. */
function safeNext(next: string | null): string {
  if (!next) return "/account";
  if (!next.startsWith("/") || next.startsWith("//")) return "/account";
  return next;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeNext(url.searchParams.get("next"));

  // Supabase reports link failures in the query string, not as an HTTP error.
  const errorDescription = url.searchParams.get("error_description");
  if (errorDescription) {
    const destination = new URL("/login", url.origin);
    destination.searchParams.set("error", errorDescription);
    return NextResponse.redirect(destination);
  }

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=missing-code", url.origin));
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.redirect(new URL("/login?error=not-configured", url.origin));
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    console.error("auth callback: code exchange failed", error.message);
    return NextResponse.redirect(new URL("/login?error=expired-link", url.origin));
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
