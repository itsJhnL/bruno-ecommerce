"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { mergeGuestCartIntoProfile } from "@/lib/cart/session";
import { sendEmail } from "@/lib/email/send";
import { welcome } from "@/lib/email/templates";
import { createClient } from "@/lib/supabase/server";

import { siteUrl } from "@/lib/utils/site";
import { firstIssue } from "@/lib/validations/commerce";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "@/lib/validations/auth";
import type { ActionResult } from "@/types";

/**
 * Authentication.
 *
 * Supabase Auth owns credentials; this file owns what happens around them —
 * merging the guest bag, sending the welcome note, and deciding what the
 * customer is told when something fails.
 */

const NOT_CONNECTED =
  "Accounts need a Supabase project. Add the keys to .env.local and run supabase/apply-all.sql.";

/**
 * Only ever send somebody to a path on this site.
 *
 * `?next=` comes from the URL, so without this an attacker can send
 * `/login?next=https://evil.example` and use the sign-in page as an open
 * redirect — a phishing primitive that looks like it came from you.
 */
function safeNext(next: string | undefined): string {
  if (!next) return "/account";
  if (!next.startsWith("/") || next.startsWith("//")) return "/account";
  return next;
}

export async function register(input: unknown): Promise<ActionResult<{ needsEmailConfirmation: boolean }>> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) return { ok: false, ...firstIssue(parsed.error) };

  const supabase = await createClient();
  if (!supabase) return { ok: false, error: NOT_CONNECTED };

  const { fullName, email, password, acceptsMarketing } = parsed.data;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, accepts_marketing: acceptsMarketing },
      emailRedirectTo: siteUrl("/auth/callback?next=/account"),
    },
  });

  if (error) {
    // Supabase distinguishes these; a customer does not need to.
    if (/already registered/i.test(error.message)) {
      return {
        ok: false,
        error: "An account with that email already exists. Try signing in instead.",
        field: "email",
      };
    }
    console.error("register failed", error.message);
    return { ok: false, error: "Your account could not be created. Please try again." };
  }

  // A session here means the project has email confirmation switched off.
  const signedIn = Boolean(data.session);

  if (signedIn && data.user) {
    await afterSignIn(data.user.id);
    await sendEmail({
      template: "welcome",
      to: email,
      content: welcome(email),
    });
  }

  return { ok: true, data: { needsEmailConfirmation: !signedIn } };
}

export async function signIn(input: unknown): Promise<ActionResult<{ next: string }>> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return { ok: false, ...firstIssue(parsed.error) };

  const supabase = await createClient();
  if (!supabase) return { ok: false, error: NOT_CONNECTED };

  const { email, password, next } = parsed.data;

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    // One message for both "no such account" and "wrong password". Telling
    // them apart lets anyone test which addresses are registered here.
    return { ok: false, error: "That email and password do not match an account." };
  }

  await afterSignIn(data.user.id);

  return { ok: true, data: { next: safeNext(next) } };
}

/**
 * Everything that has to happen once a session exists.
 *
 * The guest bag is folded in here — this is the call site Phase 2 wrote
 * `mergeGuestCartIntoProfile` for and could not wire, because there was no
 * sign-in (Memory.md D-019, docs/status.md).
 */
async function afterSignIn(profileId: string): Promise<void> {
  try {
    await mergeGuestCartIntoProfile(profileId);
  } catch (error) {
    // A bag that failed to merge is a bad afternoon; a sign-in that failed
    // because of it is worse. The guest cookie survives, so nothing is lost.
    console.error("cart merge on sign-in failed", error);
  }

  const supabase = await createClient();
  await supabase?.from("profiles").update({ last_seen_at: new Date().toISOString() }).eq("id", profileId);

  revalidatePath("/", "layout");
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase?.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

export async function requestPasswordReset(input: unknown): Promise<ActionResult<null>> {
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) return { ok: false, ...firstIssue(parsed.error) };

  const supabase = await createClient();
  if (!supabase) return { ok: false, error: NOT_CONNECTED };

  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: siteUrl("/auth/callback?next=/reset-password"),
  });

  if (error) console.error("password reset request failed", error.message);

  // Always the same answer, whether or not the address is registered. The
  // alternative is an oracle for which emails have accounts here.
  return { ok: true, data: null };
}

export async function updatePassword(input: unknown): Promise<ActionResult<null>> {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) return { ok: false, ...firstIssue(parsed.error) };

  const supabase = await createClient();
  if (!supabase) return { ok: false, error: NOT_CONNECTED };

  // The recovery link established a session; without one there is nothing to
  // update, and letting the form proceed would be misleading.
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return {
      ok: false,
      error: "This reset link has expired. Request a new one and try again.",
    };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    console.error("password update failed", error.message);
    return { ok: false, error: "Your password could not be changed. Please try again." };
  }

  revalidatePath("/", "layout");
  return { ok: true, data: null };
}
