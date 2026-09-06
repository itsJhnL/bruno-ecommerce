import { z } from "zod";

import { addressSchema } from "@/lib/validations/commerce";

/**
 * Account input. Shared by the client forms and re-validated on the server,
 * where it is the only guard that counts.
 */

const email = z
  .string()
  .trim()
  .min(1, "Enter your email.")
  .email("That does not look like an email address.")
  .max(254)
  .transform((v) => v.toLowerCase());

/**
 * Twelve characters, no composition rules.
 *
 * Length beats character classes: "Password1!" satisfies every classic rule and
 * is on every cracking list, while a long passphrase is both stronger and
 * easier to remember. NIST 800-63B has recommended exactly this since 2017.
 */
const password = z
  .string()
  .min(12, "Use at least 12 characters — a short phrase works well.")
  .max(200, "That is longer than we can store.");

export const registerSchema = z
  .object({
    fullName: z.string().trim().min(1, "Enter your name.").max(120),
    email,
    password,
    confirmPassword: z.string(),
    acceptsMarketing: z.coerce.boolean().default(false),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Both passwords must match.",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email,
  // Deliberately not `password`: an existing account may predate the current
  // rule, and rejecting a correct password at the form is absurd.
  password: z.string().min(1, "Enter your password."),
  next: z.string().optional(),
});

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z
  .object({
    password,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Both passwords must match.",
    path: ["confirmPassword"],
  });

export const profileSchema = z.object({
  fullName: z.string().trim().min(1, "Enter your name.").max(120),
  phone: z.string().trim().max(32).optional().or(z.literal("")),
  acceptsMarketing: z.coerce.boolean().default(false),
});

export const savedAddressSchema = addressSchema.extend({
  id: z.string().uuid().optional(),
  label: z.string().trim().max(60).optional().or(z.literal("")),
  type: z.enum(["SHIPPING", "BILLING"]).default("SHIPPING"),
  isDefault: z.coerce.boolean().default(false),
});

export const reviewSchema = z.object({
  productId: z.string().uuid(),
  rating: z.coerce.number().int().min(1, "Choose a rating.").max(5),
  title: z.string().trim().max(120).optional().or(z.literal("")),
  body: z
    .string()
    .trim()
    .min(10, "Tell us a little more — at least 10 characters.")
    .max(5000, "That is longer than we can store."),
});

export const wishlistItemSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().optional().nullable(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type SavedAddressInput = z.infer<typeof savedAddressSchema>;
export type ReviewInput = z.infer<typeof reviewSchema>;
