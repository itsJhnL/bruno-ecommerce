import "server-only";

import Stripe from "stripe";

/**
 * The Stripe client, server-only.
 *
 * `STRIPE_SECRET_KEY` is never prefixed NEXT_PUBLIC_ and the `server-only`
 * import above makes importing this from a Client Component a build error
 * (Agents.md rule 4).
 *
 * Returns null when Stripe is not configured. Callers must say so plainly
 * rather than simulating a payment — a checkout that pretends to succeed is
 * the worst possible version of prime directive #1.
 */

const SECRET = process.env.STRIPE_SECRET_KEY ?? "";

export const isStripeConfigured: boolean =
  SECRET.startsWith("sk_") && SECRET.length > 20;

export const STRIPE_NOT_CONFIGURED =
  "Card payments are not connected yet. Add STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET to .env.local — see docs/status.md.";

let client: Stripe | null = null;

export function getStripe(): Stripe | null {
  if (!isStripeConfigured) return null;
  if (!client) {
    client = new Stripe(SECRET, {
      // Pinned deliberately: an implicit upgrade changes response shapes.
      apiVersion: "2025-02-24.acacia",
      appInfo: { name: "BRUNO Commerce", version: "2.0.0" },
      typescript: true,
    });
  }
  return client;
}

/** Stripe works in minor units. Rounding once, here, avoids float drift. */
export function toMinorUnits(amount: number): number {
  return Math.round(amount * 100);
}

export function fromMinorUnits(amount: number): number {
  return Math.round(amount) / 100;
}
