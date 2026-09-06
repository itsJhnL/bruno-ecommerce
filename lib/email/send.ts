import "server-only";

import { Resend } from "resend";

import { createAdminClient } from "@/lib/supabase/admin";
import type { EmailContent } from "@/lib/email/templates";

/**
 * One way out of the building for transactional mail.
 *
 * When no provider is configured the send is recorded as SKIPPED rather than
 * silently dropped, so `email_log` always answers "did the customer get told?"
 * — including with a truthful no (Agents.md directive #1).
 *
 * Sending never throws at the caller. A webhook must not return 500 to Stripe,
 * and a customer must not see an order fail, because a mail provider is down.
 */

const API_KEY = process.env.RESEND_API_KEY ?? "";
const FROM = process.env.EMAIL_FROM ?? "BRUNO <onboarding@resend.dev>";

export const isEmailConfigured: boolean = API_KEY.startsWith("re_");

let resend: Resend | null = null;

function client(): Resend | null {
  if (!isEmailConfigured) return null;
  if (!resend) resend = new Resend(API_KEY);
  return resend;
}

export interface SendOptions {
  template: string;
  to: string;
  content: EmailContent;
  orderId?: string | null;
  metadata?: Record<string, unknown>;
}

export interface SendResult {
  status: "SENT" | "FAILED" | "SKIPPED";
  providerId: string | null;
  error: string | null;
}

async function log(options: SendOptions, result: SendResult): Promise<void> {
  const admin = createAdminClient();
  if (!admin) return;

  const { error } = await admin.from("email_log").insert({
    template: options.template,
    recipient: options.to,
    subject: options.content.subject,
    status: result.status,
    provider_id: result.providerId,
    error: result.error,
    order_id: options.orderId ?? null,
    metadata: (options.metadata ?? {}) as never,
  });

  if (error) console.error("email_log insert failed", error.message);
}

export async function sendEmail(options: SendOptions): Promise<SendResult> {
  const provider = client();

  if (!provider) {
    const result: SendResult = {
      status: "SKIPPED",
      providerId: null,
      error: "RESEND_API_KEY is not set",
    };
    await log(options, result);
    return result;
  }

  try {
    const { data, error } = await provider.emails.send({
      from: FROM,
      to: options.to,
      subject: options.content.subject,
      html: options.content.html,
      text: options.content.text,
    });

    const result: SendResult = error
      ? { status: "FAILED", providerId: null, error: error.message }
      : { status: "SENT", providerId: data?.id ?? null, error: null };

    await log(options, result);
    return result;
  } catch (error) {
    const result: SendResult = {
      status: "FAILED",
      providerId: null,
      error: error instanceof Error ? error.message : "Unknown send failure",
    };
    await log(options, result);
    return result;
  }
}

/** Where staff notifications go. Falls back to the client-care address. */
export function staffRecipient(): string | null {
  const explicit = process.env.ADMIN_NOTIFICATION_EMAIL;
  if (explicit && explicit.includes("@")) return explicit;
  return null;
}
