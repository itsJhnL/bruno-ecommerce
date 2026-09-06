import type { CartPricing } from "@/types";

/**
 * The empty cart.
 *
 * Its own module because both the server normalizer and the client provider
 * need it, and importing the server query helpers into the browser bundle to
 * get one constant would be a needless cost.
 */
export const EMPTY_CART: CartPricing = {
  exists: false,
  cartId: null,
  currency: "USD",
  lines: [],
  itemCount: 0,
  subtotal: 0,
  compareTotal: 0,
  savings: 0,
  couponCode: null,
  couponId: null,
  couponValid: false,
  couponReason: null,
  discountTotal: 0,
  freeShipping: false,
  shippingMethodId: null,
  shippingMethod: null,
  shippingTotal: 0,
  taxRate: 0,
  taxTotal: 0,
  grandTotal: 0,
  hasUnavailable: false,
};
