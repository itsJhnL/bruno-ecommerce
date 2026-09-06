import { z } from "zod";

/**
 * The only definition of what a valid cart or checkout input looks like.
 * Shared by the Server Actions that mutate and, where useful, by client forms —
 * but the server always re-validates. A schema imported into a component is a
 * convenience; the one on the server is the guard.
 */

export const MAX_LINE_QUANTITY = 99;

const uuid = z.string().uuid("That item could not be identified.");

export const addToCartSchema = z.object({
  variantId: uuid,
  quantity: z.coerce
    .number()
    .int("Quantity must be a whole number.")
    .min(1, "Quantity must be at least 1.")
    .max(MAX_LINE_QUANTITY, `Quantity cannot exceed ${MAX_LINE_QUANTITY}.`),
});

export const updateCartItemSchema = z.object({
  itemId: uuid,
  // 0 is legitimate: the quantity stepper removes the line at zero.
  quantity: z.coerce
    .number()
    .int("Quantity must be a whole number.")
    .min(0)
    .max(MAX_LINE_QUANTITY, `Quantity cannot exceed ${MAX_LINE_QUANTITY}.`),
});

export const removeCartItemSchema = z.object({ itemId: uuid });

export const couponSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2, "Enter a promotion code.")
    .max(40, "That code is too long.")
    // Codes are stored citext; anything outside this set cannot be a real code.
    .regex(/^[A-Za-z0-9_-]+$/, "Promotion codes use letters, numbers and dashes."),
});

/** ISO 3166-1 alpha-2, upper-cased. */
const countryCode = z
  .string()
  .trim()
  .length(2, "Use a two-letter country code.")
  .transform((v) => v.toUpperCase());

export const addressSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required.").max(80),
  lastName: z.string().trim().min(1, "Last name is required.").max(80),
  company: z.string().trim().max(120).optional().or(z.literal("")),
  line1: z.string().trim().min(1, "Street address is required.").max(180),
  line2: z.string().trim().max(180).optional().or(z.literal("")),
  city: z.string().trim().min(1, "City is required.").max(120),
  region: z.string().trim().max(120).optional().or(z.literal("")),
  postalCode: z.string().trim().min(2, "Postal code is required.").max(24),
  countryCode,
  phone: z.string().trim().min(5).max(32).optional().or(z.literal("")),
});

export const checkoutSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required.")
    .email("That does not look like an email address.")
    .max(254),
  phone: z.string().trim().max(32).optional().or(z.literal("")),
  shipping: addressSchema,
  billingSameAsShipping: z.coerce.boolean().default(true),
  billing: addressSchema.optional(),
  shippingMethodId: uuid,
  customerNote: z.string().trim().max(1000).optional().or(z.literal("")),
  acceptsMarketing: z.coerce.boolean().default(false),
});

export const newsletterSchema = z.object({
  email: z.string().trim().min(1, "Enter your email.").email("Enter a valid email.").max(254),
  firstName: z.string().trim().max(80).optional().or(z.literal("")),
  source: z.string().trim().max(40).default("footer"),
});

export const membershipApplicationSchema = z.object({
  email: z.string().trim().min(1, "Enter your email.").email("Enter a valid email.").max(254),
  fullName: z.string().trim().min(1, "Enter your name.").max(120),
  message: z.string().trim().max(1200).optional().or(z.literal("")),
});

export type AddToCartInput = z.infer<typeof addToCartSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
export type CouponInput = z.infer<typeof couponSchema>;
export type AddressInput = z.infer<typeof addressSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type NewsletterInput = z.infer<typeof newsletterSchema>;
export type MembershipApplicationInput = z.infer<typeof membershipApplicationSchema>;

/**
 * Turns a ZodError into the single message and field name a form can show.
 * Keeps every action's failure path identical.
 */
export function firstIssue(error: z.ZodError): { error: string; field?: string } {
  const issue = error.issues[0];
  if (!issue) return { error: "That input could not be read." };
  const field = issue.path.join(".");
  return { error: issue.message, field: field || undefined };
}
