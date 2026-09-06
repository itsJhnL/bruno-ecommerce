"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  firstIssue,
  membershipApplicationSchema,
  newsletterSchema,
} from "@/lib/validations/commerce";
import type { ActionResult } from "@/types";

/**
 * Marketing capture: the newsletter and membership applications.
 *
 * Both write through the service role because the visitor is anonymous and
 * there is no RLS predicate that can describe "a stranger may insert exactly
 * one row here". Both are therefore narrow: a fixed column set, Zod-validated,
 * with no user-controlled table or filter.
 */

const NOT_CONNECTED =
  "This form is not connected to a database yet, so nothing was stored. See docs/status.md.";

export async function subscribeToNewsletter(input: {
  email: string;
  firstName?: string;
  source?: string;
}): Promise<ActionResult<{ alreadySubscribed: boolean }>> {
  const parsed = newsletterSchema.safeParse(input);
  if (!parsed.success) return { ok: false, ...firstIssue(parsed.error) };

  const admin = createAdminClient();
  if (!admin) return { ok: false, error: NOT_CONNECTED };

  try {
    const { data: existing } = await admin
      .from("newsletter_subscribers")
      .select("id")
      .eq("email", parsed.data.email)
      .maybeSingle();

    if (existing) {
      // Saying "you are already on the list" is friendlier than a duplicate
      // error, and reveals nothing an attacker could not test by signing up.
      return { ok: true, data: { alreadySubscribed: true } };
    }

    const { error } = await admin.from("newsletter_subscribers").insert({
      email: parsed.data.email,
      first_name: parsed.data.firstName || null,
      source: parsed.data.source,
    });
    if (error) throw error;

    return { ok: true, data: { alreadySubscribed: false } };
  } catch (error) {
    console.error("subscribeToNewsletter failed", error);
    return { ok: false, error: "That could not be saved. Please try again." };
  }
}

export async function applyForMembership(input: {
  email: string;
  fullName: string;
  message?: string;
}): Promise<ActionResult<null>> {
  const parsed = membershipApplicationSchema.safeParse(input);
  if (!parsed.success) return { ok: false, ...firstIssue(parsed.error) };

  const admin = createAdminClient();
  if (!admin) return { ok: false, error: NOT_CONNECTED };

  try {
    const { error } = await admin.from("membership_applications").insert({
      email: parsed.data.email,
      full_name: parsed.data.fullName,
      message: parsed.data.message || null,
    });
    if (error) throw error;

    await admin.from("notifications").insert({
      audience: "STAFF",
      type: "membership.applied",
      title: "New membership application",
      body: `${parsed.data.fullName} · ${parsed.data.email}`,
      href: "/admin/customers",
    });

    return { ok: true, data: null };
  } catch (error) {
    console.error("applyForMembership failed", error);
    return { ok: false, error: "Your application could not be sent. Please try again." };
  }
}
